const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Enterprise Log Streamer
 * Allows administrators to view the latest logs directly from the dashboard
 */
exports.getLogs = async (req, res, next) => {
  try {
    const logType = req.query.type || 'combined'; // combined or error
    const linesCount = parseInt(req.query.lines) || 100;
    const logFile = path.join(__dirname, `../../logs/${logType}.log`);

    if (!fs.existsSync(logFile)) {
      return res.status(404).json({ success: false, message: 'Log file not found' });
    }

    // Read the file and get the last N lines
    // For small/medium logs, reading the whole file is fine. 
    // For large ones, we should use a stream or tail-like logic.
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n');
    const lastLines = lines.slice(-linesCount).join('\n');

    res.json({
      success: true,
      data: {
        type: logType,
        lines: linesCount,
        content: lastLines,
        totalLines: lines.length
      }
    });
  } catch (err) {
    logger.error('Log fetch failed:', err);
    next(err);
  }
};
