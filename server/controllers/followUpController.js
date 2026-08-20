const { FollowUp, Interaction, Notification, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

exports.getFollowUps = asyncHandler(async (req, res, next) => {
  const { status, assignedTo, lead, customer, opportunity, page = 1, limit = 20, sort = 'followUpDate' } = req.query;

  const filter = { isActive: true };

  if (req.user.role === 'executive') {
    filter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (lead) filter.lead = lead;
  if (customer) filter.customer = customer;
  if (opportunity) filter.opportunity = opportunity;

  const total = await FollowUp.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit, 10));

  const followups = await FollowUp.find(filter)
    .populate('assignedTo', 'name email')
    .populate('lead', 'name company')
    .populate('customer', 'name company')
    .populate('opportunity', 'title stage')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendPaginated(res, followups, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
    hasNextPage: parseInt(page, 10) < totalPages,
    hasPrevPage: parseInt(page, 10) > 1,
  });
});

exports.getFollowUp = asyncHandler(async (req, res, next) => {
  const followup = await FollowUp.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('lead', 'name company')
    .populate('customer', 'name company')
    .populate('opportunity', 'title stage');

  if (!followup || !followup.isActive) {
    return next(new AppError('Follow-up not found.', 404));
  }

  sendSuccess(res, { followup });
});

exports.createFollowUp = asyncHandler(async (req, res, next) => {
  const followup = await FollowUp.create({ ...req.body, createdBy: req.user._id });

  const populated = await FollowUp.findById(followup._id)
    .populate('assignedTo', 'name email')
    .populate('lead', 'name company')
    .populate('customer', 'name company');

  // Notification for assignee
  if (followup.assignedTo && followup.assignedTo.toString() !== req.user._id.toString()) {
    await Notification.create({
      user: followup.assignedTo,
      type: 'follow_up_due',
      title: 'Follow-up Scheduled',
      message: `Follow-up "${followup.title}" scheduled for ${new Date(followup.followUpDate).toLocaleDateString()}`,
      relatedTo: followup._id,
      relatedModel: 'FollowUp',
    });
  }

  await Interaction.create({
    type: 'Follow-up',
    subject: 'Follow-up Scheduled',
    description: `Follow-up "${followup.title}" scheduled for ${new Date(followup.followUpDate).toLocaleDateString()}`,
    lead: followup.lead,
    customer: followup.customer,
    opportunity: followup.opportunity,
    performedBy: req.user._id,
  });

  sendSuccess(res, { followup: populated }, 201, 'Follow-up created successfully');
});

exports.updateFollowUp = asyncHandler(async (req, res, next) => {
  const followup = await FollowUp.findById(req.params.id);
  if (!followup || !followup.isActive) {
    return next(new AppError('Follow-up not found.', 404));
  }

  if (req.body.status === 'Completed') {
    req.body.completedAt = new Date();
  }

  const updated = await FollowUp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('assignedTo', 'name email');

  sendSuccess(res, { followup: updated });
});

exports.deleteFollowUp = asyncHandler(async (req, res, next) => {
  const followup = await FollowUp.findById(req.params.id);
  if (!followup || !followup.isActive) {
    return next(new AppError('Follow-up not found.', 404));
  }

  await FollowUp.findByIdAndUpdate(req.params.id, { isActive: false });
  sendSuccess(res, null, 200, 'Follow-up deleted successfully');
});