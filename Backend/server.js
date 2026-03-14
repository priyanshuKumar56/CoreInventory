require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const connected = await testConnection();
  if (!connected) {
    logger.error('Failed to connect to PostgreSQL. Server not started.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`🚀 CoreInventory API running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`📋 API Docs: http://localhost:${PORT}/api`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after 10s');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
};

startServer();
