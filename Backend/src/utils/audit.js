const { query } = require('../config/db');
const logger = require('./logger');

/**
 * Record an immutable audit log entry.
 * Call this after any critical create/update/delete operation.
 *
 * @param {Object} req - Express request (for user info + IP)
 * @param {string} action - e.g. 'product.create', 'receipt.validate'
 * @param {string} entityType - e.g. 'product', 'receipt'
 * @param {string|null} entityId - UUID of the affected record
 * @param {Object|null} oldValues - Previous state (for updates/deletes)
 * @param {Object|null} newValues - New state (for creates/updates)
 */
const auditLog = async (req, action, entityType, entityId, oldValues = null, newValues = null) => {
  try {
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || 'system';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        userEmail,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      ]
    );

    logger.debug(`AUDIT: ${userEmail} → ${action} on ${entityType}:${entityId}`);
  } catch (err) {
    // Audit logging must NEVER crash the main operation
    logger.error('Audit log write failed (non-fatal):', err.message);
  }
};

module.exports = { auditLog };
