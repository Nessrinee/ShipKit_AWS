const { initDb } = require('./db/database');
const config     = require('./config');
const logger     = require('./utils/logger');

// Initialize DB before importing app (app.js uses DB via routes)
initDb();

const app = require('./app');

const server = app.listen(config.port, () => {
  logger.info(`ShipKit API running on port ${config.port} [${config.env}]`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { logger.error('Uncaught exception',  err); process.exit(1); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled rejection', err); process.exit(1); });

module.exports = server;
