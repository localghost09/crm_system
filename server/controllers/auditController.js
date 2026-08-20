const { AuditLog } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const { action, entity, userId, page = 1, limit = 30, sort = '-createdAt' } = req.query;
  const filter = {};

  if (action) filter.action = { $regex: action, $options: 'i' };
  if (entity) filter.entity = entity;
  if (userId) filter.user = userId;

  const total = await AuditLog.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit, 10));

  const logs = await AuditLog.find(filter)
    .populate('user', 'name email')
    .sort(sort)
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendPaginated(res, logs, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
    hasNextPage: parseInt(page, 10) < totalPages,
    hasPrevPage: parseInt(page, 10) > 1,
  });
});