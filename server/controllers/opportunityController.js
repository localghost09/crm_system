const { Opportunity, Interaction, Notification, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

exports.getOpportunities = asyncHandler(async (req, res, next) => {
  const { search, stage, assignedTo, customer, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const filter = { isActive: true };

  if (req.user.role === 'executive') {
    filter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  if (stage) filter.stage = stage;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (customer) filter.customer = customer;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { title: searchRegex },
    ];
  }

  const total = await Opportunity.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit, 10));

  const opportunities = await Opportunity.find(filter)
    .populate('customer', 'name company email')
    .populate('lead', 'name company')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendPaginated(res, opportunities, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
    hasNextPage: parseInt(page, 10) < totalPages,
    hasPrevPage: parseInt(page, 10) > 1,
  });
});

exports.getOpportunity = asyncHandler(async (req, res, next) => {
  const opportunity = await Opportunity.findById(req.params.id)
    .populate('customer', 'name company email phone address industry')
    .populate('lead', 'name company source')
    .populate('assignedTo', 'name email phone')
    .populate('createdBy', 'name email');

  if (!opportunity || !opportunity.isActive) {
    return next(new AppError('Opportunity not found.', 404));
  }

  sendSuccess(res, { opportunity });
});

exports.createOpportunity = asyncHandler(async (req, res, next) => {
  const opportunity = await Opportunity.create({ ...req.body, createdBy: req.user._id });

  const populated = await Opportunity.findById(opportunity._id)
    .populate('customer', 'name company')
    .populate('lead', 'name company')
    .populate('assignedTo', 'name email');

  await Interaction.create({
    type: 'Deal Change',
    subject: 'Opportunity Created',
    description: `Opportunity "${opportunity.title}" created in stage "${opportunity.stage}"`,
    customer: opportunity.customer,
    lead: opportunity.lead,
    opportunity: opportunity._id,
    performedBy: req.user._id,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'Opportunity created',
    entity: 'Opportunity',
    entityId: opportunity._id,
    description: `Opportunity "${opportunity.title}" created`,
    ipAddress: req.ip,
  });

  sendSuccess(res, { opportunity: populated }, 201, 'Opportunity created successfully');
});

exports.updateOpportunity = asyncHandler(async (req, res, next) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity || !opportunity.isActive) {
    return next(new AppError('Opportunity not found.', 404));
  }

  const oldStage = opportunity.stage;
  const updated = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('customer', 'name company')
    .populate('lead', 'name company')
    .populate('assignedTo', 'name email');

  if (oldStage !== req.body.stage && req.body.stage) {
    await Interaction.create({
      type: 'Deal Change',
      subject: 'Opportunity Stage Changed',
      description: `Opportunity "${opportunity.title}" moved from "${oldStage}" to "${req.body.stage}"`,
      customer: opportunity.customer,
      lead: opportunity.lead,
      opportunity: opportunity._id,
      performedBy: req.user._id,
    });

    if (req.body.stage === 'Won') {
      await Notification.create({
        user: opportunity.assignedTo,
        type: 'deal_status_change',
        title: 'Deal Won! 🎉',
        message: `Opportunity "${opportunity.title}" has been marked as Won!`,
        relatedTo: opportunity._id,
        relatedModel: 'Opportunity',
      });
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'Deal moved',
      entity: 'Opportunity',
      entityId: opportunity._id,
      description: `Opportunity "${opportunity.title}" moved from "${oldStage}" to "${req.body.stage}"`,
      ipAddress: req.ip,
    });
  }

  sendSuccess(res, { opportunity: updated });
});

exports.deleteOpportunity = asyncHandler(async (req, res, next) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity || !opportunity.isActive) {
    return next(new AppError('Opportunity not found.', 404));
  }

  await Opportunity.findByIdAndUpdate(req.params.id, { isActive: false });

  await AuditLog.create({
    user: req.user._id,
    action: 'Opportunity deleted',
    entity: 'Opportunity',
    entityId: opportunity._id,
    description: `Opportunity "${opportunity.title}" deleted`,
    ipAddress: req.ip,
  });

  sendSuccess(res, null, 200, 'Opportunity deleted successfully');
});

exports.updateStage = asyncHandler(async (req, res, next) => {
  const { stage } = req.body;
  if (!stage) {
    return next(new AppError('Stage is required.', 400));
  }

  const validStages = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
  if (!validStages.includes(stage)) {
    return next(new AppError('Invalid stage.', 400));
  }

  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity || !opportunity.isActive) {
    return next(new AppError('Opportunity not found.', 404));
  }

  const oldStage = opportunity.stage;
  opportunity.stage = stage;
  if (stage === 'Won') {
    opportunity.probability = 100;
  } else if (stage === 'Lost') {
    opportunity.probability = 0;
    opportunity.lostReason = req.body.lostReason || '';
  }
  await opportunity.save();

  await Interaction.create({
    type: 'Deal Change',
    subject: 'Pipeline Stage Updated',
    description: `Opportunity "${opportunity.title}" moved from "${oldStage}" to "${stage}" on the pipeline`,
    customer: opportunity.customer,
    lead: opportunity.lead,
    opportunity: opportunity._id,
    performedBy: req.user._id,
  });

  sendSuccess(res, { opportunity });
});