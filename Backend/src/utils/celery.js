const celery = require('celery-node');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';

const client = celery.createClient(
  REDIS_URL,
  REDIS_URL
);

// Graceful shutdown
process.on('SIGINT', () => {
  client.disconnect();
});

module.exports = client;
