const { Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/helpers');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const total = await Notification.countDocuments({ user: req.user._id, isActive: true });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false, isActive: true });

  const notifications = await Notification.find({ user: req.user._id, isActive: true })
    .populate('relatedTo')
    .sort('-createdAt')
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendSuccess(res, {
    notifications,
    unreadCount,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (id === 'all') {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    sendSuccess(res, null, 200, 'All notifications marked as read');
  } else {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return sendSuccess(res, null, 404, 'Notification not found');
    }

    sendSuccess(res, { notification });
  }
});

exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false, isActive: true });
  sendSuccess(res, { count });
});