/**
 * admin.js — Admin-only API routes
 *
 * NEW FILE (v2): Previously the admin license generation endpoint lived inside
 * downloads.js. This separation:
 *   - Makes it clear which routes require admin auth (all of them in this file)
 *   - Allows different rate limits, logging, and middleware per route type
 *   - Prevents accidental auth inheritance from customer routes
 *
 * All routes here require:  requireAuth → requireAdmin (applied via router.use())
 */

'use strict';

const express = require('express');
const Joi     = require('joi');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generateLicenseKey }        = require('../utils/licenseKey');
const { getDb }                     = require('../db/database');
const PRODUCTS                      = require('../data/products');
const config                        = require('../config');
const logger                        = require('../utils/logger');

const router = express.Router();

// All routes in this file require valid admin JWT
router.use(requireAuth, requireAdmin);

// ── Schemas ───────────────────────────────────────────────────────────────────
const generateSchema = Joi.object({
  productId:    Joi.string().alphanum().max(64).required(),
  email:        Joi.string().email().trim().lowercase().max(254).required(),
  maxDownloads: Joi.number().integer().min(1).max(50).default(config.license.maxDownloads),
  orderId:      Joi.string().max(128).optional(),  // optional manual order reference
});

// ── POST /api/admin/licenses/generate ─────────────────────────────────────────
router.post('/licenses/generate', (req, res, next) => {
  try {
    const { error, value } = generateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error:  'Validation failed',
        fields: error.details.map((d) => ({ field: d.context?.key, message: d.message })),
      });
    }

    const { productId, email, maxDownloads, orderId } = value;

    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: `Product '${productId}' not found` });
    }

    const licenseKey = generateLicenseKey(productId, email);
    const expiresAt  = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO licenses (product_id, email, license_key, order_id, max_downloads, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      productId, email, licenseKey,
      orderId || `admin-manual-${Date.now()}`,
      maxDownloads,
      expiresAt.toISOString()
    );

    logger.info('Admin generated license key', {
      productId,
      email,
      maxDownloads,
      generatedBy: req.user.email,
      licenseId:   result.lastInsertRowid,
      reqId:       req.id,
    });

    res.status(201).json({
      licenseKey,
      email,
      productId,
      maxDownloads,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/licenses ───────────────────────────────────────────────────
router.get('/licenses', (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const offset = (page - 1) * limit;

    const db = getDb();
    const licenses = db.prepare(
      'SELECT id, product_id, email, download_count, max_downloads, expires_at, created_at FROM licenses ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM licenses').get().count;

    res.json({ licenses, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', (req, res, next) => {
  try {
    const db = getDb();
    const stats = {
      totalLicenses:    db.prepare('SELECT COUNT(*) as c FROM licenses').get().c,
      totalDownloads:   db.prepare('SELECT SUM(download_count) as c FROM licenses').get().c || 0,
      licensesByProduct: db.prepare(
        'SELECT product_id, COUNT(*) as count FROM licenses GROUP BY product_id'
      ).all(),
      recentActivity: db.prepare(
        'SELECT dl.downloaded_at, l.email, l.product_id FROM download_logs dl JOIN licenses l ON dl.license_id = l.id ORDER BY dl.downloaded_at DESC LIMIT 10'
      ).all(),
    };
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
