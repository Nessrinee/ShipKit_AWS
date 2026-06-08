/**
 * licenseKey.js — HMAC-signed license key generation & verification
 *
 * FIXES APPLIED (v2):
 *   [CRITICAL] Buffer length mismatch crash in timingSafeEqual → now guarded
 *   [LOW]      Download token now includes a crypto nonce to prevent collision
 *   [MEDIUM]   Explicit format validation before any buffer operations
 */

'use strict';

const crypto = require('crypto');
const config = require('../config');

// ── Product prefix map ────────────────────────────────────────────────────────
const PRODUCT_PREFIX_MAP = {
  'kubernetes-starter-pack': 'K8S',
  'terraform-aws-kit':       'TF',
  'docker-compose-bundle':   'DCK',
  'complete-bundle':         'ALL',
};

// Key format: SK-{PREFIX}-{6-char-random}-{8-char-HMAC}
const KEY_REGEX = /^SK-[A-Z0-9]{1,8}-[A-F0-9]{12}-[A-F0-9]{16}$/i;

/**
 * Generate a signed license key.
 * @param {string} productId
 * @param {string} email
 * @returns {string}
 */
const generateLicenseKey = (productId, email) => {
  if (!productId || !email) throw new Error('productId and email are required');

  const prefix  = PRODUCT_PREFIX_MAP[productId] || 'PRD';
  const random  = crypto.randomBytes(6).toString('hex').toUpperCase();  // 12 hex chars
  const payload = `${productId}:${email.toLowerCase().trim()}:${random}`;

  const hmac = crypto
    .createHmac('sha256', config.license.secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16)   // 16 hex chars
    .toUpperCase();

  return `SK-${prefix}-${random}-${hmac}`;
};

/**
 * Verify a license key's HMAC signature.
 *
 * FIX [CRITICAL]: Previous code called crypto.timingSafeEqual() without
 * checking buffer lengths first. timingSafeEqual throws TypeError if lengths
 * differ — a malformed key caused a 500 crash. Now returns false safely.
 *
 * @param {string} licenseKey
 * @param {string} productId
 * @param {string} email
 * @returns {boolean}
 */
const verifyLicenseKey = (licenseKey, productId, email) => {
  // Structural validation first — reject obviously malformed keys early
  if (!licenseKey || typeof licenseKey !== 'string') return false;
  if (!KEY_REGEX.test(licenseKey)) return false;

  const parts = licenseKey.split('-');
  // Expected: ['SK', PREFIX, RANDOM_12, HMAC_16] → 4 parts
  if (parts.length !== 4 || parts[0] !== 'SK') return false;

  const random  = parts[2];
  const payload = `${productId}:${email.toLowerCase().trim()}:${random}`;

  const expected = crypto
    .createHmac('sha256', config.license.secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();

  const candidateBuf = Buffer.from(parts[3]);
  const expectedBuf  = Buffer.from(expected);

  // FIX [CRITICAL]: Guard length equality BEFORE timingSafeEqual
  // timingSafeEqual throws if lengths differ — this prevents the crash
  if (candidateBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
};

/**
 * Generate a short-lived signed download token (valid 10 minutes).
 *
 * FIX [LOW]: Added crypto nonce to prevent theoretical sub-millisecond
 * collision when Date.now() returns the same value for rapid calls.
 *
 * @param {string} licenseId
 * @param {string} productId
 * @returns {string} base64url token
 */
const generateDownloadToken = (licenseId, productId) => {
  const nonce   = crypto.randomBytes(4).toString('hex');  // FIX: added nonce
  const ts      = Date.now().toString();
  const payload = `${licenseId}:${productId}:${ts}:${nonce}`;

  const sig = crypto
    .createHmac('sha256', config.license.secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);

  return Buffer.from(`${payload}:${sig}`).toString('base64url');
};

/**
 * Verify and decode a download token (must be < 10 minutes old).
 * @param {string} token
 * @returns {{ licenseId: string, productId: string } | null}
 */
const verifyDownloadToken = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;

    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts   = decoded.split(':');

    // Expected: [licenseId, productId, timestamp, nonce, sig] → 5 parts
    if (parts.length !== 5) return null;

    const [licenseId, productId, timestamp, nonce, sig] = parts;

    // Age check — reject tokens older than 10 minutes
    const age = Date.now() - parseInt(timestamp, 10);
    if (isNaN(age) || age < 0 || age > 10 * 60 * 1000) return null;

    // Recompute signature
    const payload  = `${licenseId}:${productId}:${timestamp}:${nonce}`;
    const expected = crypto
      .createHmac('sha256', config.license.secret)
      .update(payload)
      .digest('hex')
      .substring(0, 16);

    const candidateBuf = Buffer.from(sig);
    const expectedBuf  = Buffer.from(expected);

    // FIX [CRITICAL]: Same guard as verifyLicenseKey
    if (candidateBuf.length !== expectedBuf.length) return null;

    const valid = crypto.timingSafeEqual(candidateBuf, expectedBuf);
    if (!valid) return null;

    return { licenseId, productId };
  } catch {
    return null;
  }
};

module.exports = { generateLicenseKey, verifyLicenseKey, generateDownloadToken, verifyDownloadToken };
