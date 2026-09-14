/**
 * downloads.js — Customer license verification & secure file delivery
 *
 * FIXES APPLIED (v3):
 *   [CRITICAL] Path traversal guard on productDir before fs.resolve()
 *   [HIGH]     All requires moved from inside handlers to module top
 *   [MEDIUM]   Download counter increment moved inside transaction / atomic check
 *   [LOW]      X-Request-Id included in error logs
 *   [FIX]      Expanded productId validation to accept alphanumeric strings, hyphens, and underscores (e.g., kubernetes-starter-pack)
 */

'use strict';

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const archiver = require('archiver');
const Joi      = require('joi');

// FIX [MEDIUM]: All requires at module top — never inside handlers
const { getDb }               = require('../db/database');
const { generateDownloadToken, verifyDownloadToken, verifyLicenseKey } = require('../utils/licenseKey');
const { downloadLimiter } = require('../middleware/rateLimiter');
const PRODUCTS            = require('../data/products');
const config              = require('../config');
const logger              = require('../utils/logger');

const router = express.Router();

// ── Validation schemas ────────────────────────────────────────────────────────
const verifySchema = Joi.object({
  email:        Joi.string().email().trim().lowercase().max(254).required(),
  licenseKey:   Joi.string().pattern(/^SK-[A-Z0-9]+-[A-F0-9]{12}-[A-F0-9]{16}$/i).required(),
  productId:    Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).max(64).required(),
});

// ── POST /api/downloads/verify ────────────────────────────────────────────────
router.post('/verify', downloadLimiter, (req, res, next) => {
  try {
    const { error, value } = verifySchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error:  'Validation failed',
        fields: error.details.map((d) => ({ field: d.context?.key, message: d.message })),
      });
    }

    const { email, licenseKey, productId } = value;

    // 1. Verify HMAC integrity — fast check before any DB lookup
    const hmacValid = verifyLicenseKey(licenseKey, productId, email);
    if (!hmacValid) {
      logger.warn('Invalid license key attempt', { productId, ip: req.ip, reqId: req.id });
      return res.status(401).json({ error: 'Invalid license key' });
    }

    // 2. Database lookup — confirm existence + quota
    const db      = getDb();
    const license = db.prepare(
      'SELECT * FROM licenses WHERE license_key = ? AND email = ? AND product_id = ?'
    ).get(licenseKey, email, productId);

    if (!license) {
      return res.status(401).json({ error: 'License key not found or does not match email' });
    }

    if (new Date(license.expires_at) < new Date()) {
      return res.status(410).json({ error: 'License key has expired. Contact support.' });
    }

    if (license.download_count >= license.max_downloads) {
      return res.status(429).json({
        error:   'Download limit reached',
        limit:   license.max_downloads,
        used:    license.download_count,
        message: 'Email support@shipkit.dev to reset your download count.',
      });
    }

    // 3. Issue short-lived download token (10 min)
    const downloadToken = generateDownloadToken(license.id, productId);

    logger.info('License verified — download token issued', {
      productId,
      licenseId: license.id,
      remaining: license.max_downloads - license.download_count,
      reqId:     req.id,
    });

    res.json({
      downloadToken,
      product:       productId,
      downloadsUsed: license.download_count,
      downloadsLeft: license.max_downloads - license.download_count,
      expiresAt:     license.expires_at,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/downloads/:token ─────────────────────────────────────────────────
router.get('/:token', downloadLimiter, (req, res, next) => {
  try {
    const { token } = req.params;
    const result = verifyDownloadToken(token);

    if (!result) {
      return res.status(401).json({ error: 'Invalid or expired download link' });
    }

    const { licenseId, productId } = result;

    const db      = getDb();
    const license = db.prepare('SELECT * FROM licenses WHERE id = ?').get(licenseId);

    if (!license || license.product_id !== productId) {
      logger.warn('Token product mismatch', { licenseId, productId, reqId: req.id });
      return res.status(403).json({ error: 'Download token does not match license' });
    }

    // Re-check quota at download time and reserve slot atomically to prevent replay races.
    if (license.download_count >= license.max_downloads) {
      return res.status(429).json({ error: 'Download limit reached' });
    }

    const reserveResult = db.prepare(
      'UPDATE licenses SET download_count = download_count + 1 WHERE id = ? AND download_count < max_downloads'
    ).run(licenseId);
    if (reserveResult.changes !== 1) {
      return res.status(429).json({ error: 'Download limit reached' });
    }

    // Find product definition
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // FIX [CRITICAL]: Path traversal guard before using productDir in path.resolve()
    const { productDir } = product;

    if (!productDir || typeof productDir !== 'string') {
      logger.error('Missing productDir', { productId });
      return res.status(500).json({ error: 'Product configuration error. Contact support.' });
    }

    // Guard against path traversal: productDir must be a simple name, no slashes or dots
    if (productDir.includes('..') || productDir.includes('/') ||
        productDir.includes('\\') || path.isAbsolute(productDir)) {
      logger.error('Path traversal attempt blocked', { productDir, productId, ip: req.ip });
      return res.status(500).json({ error: 'Product configuration error' });
    }

    const productsRoot = path.resolve(config.products.path);
    const productPath  = path.resolve(productsRoot, productDir);

    // Double-check resolved path stays inside products root
    if (!productPath.startsWith(productsRoot + path.sep)) {
      logger.error('Resolved path outside products root', { productPath, productsRoot });
      return res.status(500).json({ error: 'Product configuration error' });
    }

    if (!fs.existsSync(productPath)) {
      logger.error('Product directory not found on disk', { productPath, productId });
      return res.status(500).json({ error: 'Product files unavailable. Contact support@shipkit.dev.' });
    }

    // ── Stream ZIP response ────────────────────────────────────────────────────
    const filename = `shipkit-${productId}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');  // never cache download responses

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      logger.error('Archive error during streaming', { err: err.message, productId, reqId: req.id });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create archive' });
      }
    });

    archive.pipe(res);

    // Personalized license.txt inside the ZIP
    const licenseText = [
      'ShipKit Commercial License',
      `Product:        ${product.name}`,
      `Licensed to:    ${license.email}`,
      `License Key:    ${license.license_key}`,
      `Download Date:  ${new Date().toISOString()}`,
      `Download #:     ${license.download_count + 1} of ${license.max_downloads}`,
      '',
      'This license permits unlimited use in personal and commercial projects.',
      'Redistribution or resale of the source files is NOT permitted.',
      'Support: support@shipkit.dev',
    ].join('\n');

    archive.append(licenseText, { name: 'LICENSE.txt' });
    archive.directory(productPath, productId);
    archive.finalize();

    // Download slot was already reserved before streaming.
    res.on('finish', () => {
      try {
        db.prepare(
          'INSERT INTO download_logs (license_id, ip, user_agent) VALUES (?, ?, ?)'
        ).run(licenseId, req.ip, req.headers['user-agent'] || 'unknown');

        logger.info('Download completed', {
          productId,
          email:     license.email,
          ip:        req.ip,
          reqId:     req.id,
        });
      } catch (dbErr) {
        logger.error('Failed to record download in DB', { err: dbErr.message });
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;