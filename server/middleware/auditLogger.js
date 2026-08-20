const { AuditLog } = require('../models');

const auditLogger = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      try {
        if (res.statusCode < 400) {
          await AuditLog.create({
            user: req.user?._id,
            action,
            entity,
            entityId: req.params?.id || body?.data?._id,
            description: `${action} on ${entity}`,
            metadata: {
              method: req.method,
              path: req.originalUrl,
              body: req.method !== 'GET' ? JSON.stringify(req.body).substring(0, 500) : undefined,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          });
        }
      } catch (error) {
        console.error('Audit log error:', error.message);
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = auditLogger;