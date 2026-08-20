const { Interaction, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/helpers');

const INTERACTION_TYPES = ['Phone Call', 'Email', 'Meeting', 'Note', 'Status Change', 'Deal Change', 'Assignment', 'Follow-up', 'Task', 'Conversion', 'Other'];

exports.getInteractions = asyncHandler(async (req, res, next) => {
  const { lead, customer, opportunity, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (lead) filter.lead = lead;
  if (customer) filter.customer = customer;
  if (opportunity) filter.opportunity = opportunity;

  const total = await Interaction.countDocuments(filter);
  const interactions = await Interaction.find(filter)
    .populate('performedBy', 'name email')
    .sort('-createdAt')
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendSuccess(res, {
    interactions,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  });
});

exports.createInteraction = asyncHandler(async (req, res, next) => {
  const { type, subject, description, lead, customer, opportunity } = req.body;

  if (!INTERACTION_TYPES.includes(type)) {
    return next(new AppError('Invalid interaction type.', 400));
  }

  if (!lead && !customer && !opportunity) {
    return next(new AppError('An interaction must be linked to a lead, customer, or opportunity.', 400));
  }

  const interaction = await Interaction.create({
    type,
    subject: subject || type,
    description: description || '',
    lead: lead || null,
    customer: customer || null,
    opportunity: opportunity || null,
    performedBy: req.user._id,
  });

  const populated = await Interaction.findById(interaction._id).populate('performedBy', 'name email');

  await AuditLog.create({
    user: req.user._id,
    action: 'Interaction recorded',
    entity: 'Interaction',
    entityId: interaction._id,
    description: `${type} recorded: ${subject}`,
    ipAddress: req.ip,
  });

  sendSuccess(res, { interaction: populated }, 201, 'Interaction recorded');
});
