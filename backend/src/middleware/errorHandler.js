const logger = require('../utils/logger');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  logger.error({
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
    ip:      req.ip,
  });

  // Never leak stack traces in production
  res.status(status).json({
    error:  status >= 500 ? 'Internal server error' : err.message,
    ...(config.isProd ? {} : { stack: err.stack }),
  });
};

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFound };
