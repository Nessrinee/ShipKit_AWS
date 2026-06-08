const rateLimit = require('express-rate-limit');

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (req, res) => {
      res.status(429).json({
        error:   'Too many requests',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
      });
    },
    ...options,
  });

// Global: 200 req / 15min
const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      200,
});

// Auth endpoints: 10 req / 15min (brute-force protection)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      10,
  skipSuccessfulRequests: false,
});

// Download verify: 20 req / 15min
const downloadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      20,
});

// Contact form: 5 req / hour
const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max:      5,
});

// Webhook: 100 req / 15min
const webhookLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      100,
});

module.exports = {
  globalLimiter,
  authLimiter,
  downloadLimiter,
  contactLimiter,
  webhookLimiter,
};
