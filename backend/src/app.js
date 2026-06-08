/**
 * app.js — Express application with all security middleware
 *
 * FIXES APPLIED (v2):
 *   [LOW]    X-Request-Id added to every request — enables log correlation
 *   [HIGH]   Admin routes registered from separate admin.js router
 *   [MEDIUM] CSP tightened — only allows Gumroad + Google Fonts
 *   [LOW]    Trust proxy configured for accurate IP behind Nginx/Docker
 */

'use strict';

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const compression = require('compression');
const morgan      = require('morgan');
const hpp         = require('hpp');
const { v4: uuidv4 } = require('uuid');

const config     = require('./config');
const logger     = require('./utils/logger');
const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const downloadRoutes = require('./routes/downloads');
const webhookRoutes  = require('./routes/webhooks');
const contactRoutes  = require('./routes/contact');
const adminRoutes    = require('./routes/admin');      // FIX [HIGH]: separate admin router

const app = express();

// ── Trust proxy ───────────────────────────────────────────────────────────────
// FIX [LOW]: Required for accurate req.ip behind Nginx/Docker
app.set('trust proxy', 1);

// ── Request ID ────────────────────────────────────────────────────────────────
// FIX [LOW]: Every request gets a unique ID — appears in logs and response headers
// Customers can quote their X-Request-Id when reporting issues
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", 'https://gumroad.com'],         // Only Gumroad scripts allowed
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:'],
      connectSrc:     ["'self'"],
      frameSrc:       ['https://gumroad.com'],                   // Gumroad overlay iframe
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      frameAncestors: ["'none'"],                                // Prevent clickjacking
      upgradeInsecureRequests: config.isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,  // Required for Gumroad overlay
  hsts: {
    maxAge:            63072000,
    includeSubDomains: true,
    preload:           true,
  },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);  // curl, Postman, server-to-server
    if (config.cors.origins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not in allowed list`));
  },
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],   // Let clients read the request ID
  credentials:    true,
  maxAge:         600,
}));

// ── HTTP Parameter Pollution protection ───────────────────────────────────────
app.use(hpp());

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Request logging ───────────────────────────────────────────────────────────
app.use(morgan(config.isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Body size limits (DoS prevention) ────────────────────────────────────────
// 16KB is more than enough for any legitimate API request
app.use(express.json({ limit: '16kb' }));

// ── Global rate limiter (all /api/* routes) ───────────────────────────────────
app.use('/api/', globalLimiter);

// ── Health check (no auth needed) ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:      'ok',
    version:     '2.0.0',
    environment: config.env,
    timestamp:   new Date().toISOString(),
    reqId:       req.id,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/webhooks',  webhookRoutes);
app.use('/api/contact',   contactRoutes);
app.use('/api/admin',     adminRoutes);   // FIX [HIGH]: admin routes at separate prefix

// ── Frontend static (production) ─────────────────────────────────────────────
if (config.isProd) {
  const path = require('path');
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
