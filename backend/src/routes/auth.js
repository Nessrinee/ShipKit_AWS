/**
 * auth.js — Admin authentication routes
 *
 * FIXES APPLIED (v2):
 *   [CRITICAL] Timing oracle: always run bcrypt.compare() even if user not found
 *   [MEDIUM]   Email now trimmed + lowercased in Joi schema
 *   [LOW]      Added request ID to error logs for traceability
 *   [LOW]      Refresh token endpoint now validates payload shape
 */

'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const Joi     = require('joi');
const { getDb }                                    = require('../db/database');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { authLimiter }                              = require('../middleware/rateLimiter');
const logger                                       = require('../utils/logger');

const router = express.Router();

/**
 * FIX [CRITICAL]: Dummy hash used when user is not found.
 * Without this, login for non-existent users returns immediately (fast)
 * while login for existing users runs bcrypt (~100ms slow).
 * An attacker timing hundreds of requests can enumerate valid emails.
 *
 * Solution: ALWAYS call bcrypt.compare() — even with a dummy hash —
 * so every login attempt takes the same time regardless of whether
 * the email exists.
 */
const DUMMY_HASH = '$2b$12$invalidhashfortimingprotect000000000000000000000000000';

// ── Validation schemas ────────────────────────────────────────────────────────
const loginSchema = Joi.object({
  // FIX [MEDIUM]: .trim().lowercase() — prevents whitespace/casing mismatch
  email:    Joi.string().email().trim().lowercase().max(254).required(),
  password: Joi.string().min(6).max(128).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error:  'Validation failed',
        fields: error.details.map((d) => ({ field: d.context?.key, message: d.message })),
      });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(value.email);

    // FIX [CRITICAL]: Always run bcrypt — prevents timing-based email enumeration
    const hashToCompare = user ? user.password : DUMMY_HASH;
    const passwordValid = await bcrypt.compare(value.password, hashToCompare);

    // Unified error message — never reveal whether email vs password was wrong
    if (!user || !passwordValid) {
      logger.warn('Failed login attempt', {
        email: value.email,
        ip:    req.ip,
        reqId: req.id,
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken  = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    logger.info('Admin login successful', { userId: user.id, ip: req.ip });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', authLimiter, (req, res, next) => {
  try {
    // FIX [LOW]: Validate shape before touching the token
    const { error, value } = refreshSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    const { valid, payload, error: jwtError } = verifyRefreshToken(value.refreshToken);
    if (!valid) {
      logger.warn('Invalid refresh token attempt', {
        reason: jwtError,
        ip: req.ip,
        reqId: req.id,
      });
      return res.status(401).json({
        error:  'Invalid or expired refresh token',
      });
    }

    // Validate payload shape — guard against malformed tokens
    if (!payload?.userId || !payload?.email || !payload?.role) {
      return res.status(401).json({ error: 'Malformed token payload' });
    }

    const accessToken = signAccessToken({
      userId: payload.userId,
      email:  payload.email,
      role:   payload.role,
    });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
