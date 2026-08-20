const { Lead, Customer, Opportunity, Interaction, Notification, AuditLog } = require('../models');
const leadService = require('../services/leadService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

exports.getLeads = asyncHandler(async (req, res, next) => {
  const result = await leadService.getLeads(req.query, req.user, { role: req.user.role });
  sendPaginated(res, result.leads, result.pagination);
});

exports.getLead = asyncHandler(async (req, res, next) => {
  const lead = await leadService.getLeadById(req.params.id);
  if (!lead || !lead.isActive) {
    return next(new AppError('Lead not found.', 404));
  }
  
  // Only executives see their own leads
  if (req.user.role === 'executive' && lead.assignedTo?._id?.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to view this lead.', 403));
  }
  
  sendSuccess(res, { lead });
});

exports.createLead = asyncHandler(async (req, res, next) => {
  const duplicate = await leadService.checkDuplicate(req.body);
  if (duplicate) {
    return sendSuccess(res, {
      duplicate: true,
      existingLead: duplicate,
      message: 'A similar lead already exists.',
    }, 409, 'Duplicate lead detected');
  }

  const lead = await leadService.createLead(req.body, req.user._id);

  await Interaction.create({
    type: 'Note',
    subject: 'Lead Created',
    description: `Lead "${lead.name}" was created`,
    lead: lead._id,
    performedBy: req.user._id,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'Lead created',
    entity: 'Lead',
    entityId: lead._id,
    description: `Lead "${lead.name}" created`,
    ipAddress: req.ip,
  });

  if (lead.assignedTo) {
    await Notification.create({
      user: lead.assignedTo,
      type: 'lead_assigned',
      title: 'New Lead Assigned',
      message: `Lead "${lead.name}" has been assigned to you.`,
      relatedTo: lead._id,
      relatedModel: 'Lead',
    });
  }

  sendSuccess(res, { lead }, 201, 'Lead created successfully');
});

exports.updateLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead || !lead.isActive) {
    return next(new AppError('Lead not found.', 404));
  }

  if (req.user.role === 'executive' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to update this lead.', 403));
  }

  const oldStatus = lead.status;
  const updatedLead = await leadService.updateLead(req.params.id, req.body);

  const changes = [];
  if (oldStatus !== req.body.status) {
    changes.push(`Status changed from "${oldStatus}" to "${req.body.status}"`);
    await Interaction.create({
      type: 'Status Change',
      subject: 'Lead Status Changed',
      description: `Lead status changed from "${oldStatus}" to "${req.body.status}"`,
      lead: lead._id,
      performedBy: req.user._id,
    });
  }

  if (req.body.assignedTo && req.body.assignedTo !== lead.assignedTo?.toString()) {
    changes.push('Lead reassigned');
    await Notification.create({
      user: req.body.assignedTo,
      type: 'lead_assigned',
      title: 'Lead Reassigned',
      message: `Lead "${lead.name}" has been reassigned to you.`,
      relatedTo: lead._id,
      relatedModel: 'Lead',
    });
  }

  await Interaction.create({
    type: 'Note',
    subject: 'Lead Updated',
    description: `Lead "${lead.name}" updated: ${changes.join(', ') || 'General update'}`,
    lead: lead._id,
    performedBy: req.user._id,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'Lead updated',
    entity: 'Lead',
    entityId: lead._id,
    description: `Lead "${lead.name}" updated`,
    ipAddress: req.ip,
  });

  sendSuccess(res, { lead: updatedLead });
});

exports.deleteLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead || !lead.isActive) {
    return next(new AppError('Lead not found.', 404));
  }

  if (req.user.role === 'executive' && lead.assignedTo?.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to delete this lead.', 403));
  }

  await leadService.deleteLead(req.params.id);

  await AuditLog.create({
    user: req.user._id,
    action: 'Lead deleted',
    entity: 'Lead',
    entityId: lead._id,
    description: `Lead "${lead.name}" deleted`,
    ipAddress: req.ip,
  });

  sendSuccess(res, null, 200, 'Lead deleted successfully');
});

exports.convertLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead || !lead.isActive) {
    return next(new AppError('Lead not found.', 404));
  }

  if (lead.status !== 'Qualified' && lead.status !== 'Proposal Sent' && lead.status !== 'Negotiation' && lead.status !== 'Won') {
    return next(new AppError('Only qualified leads can be converted.', 400));
  }

  // Create Customer
  const customer = await Customer.create({
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    industry: lead.industry,
    source: 'Lead Conversion',
    leadSource: lead._id,
    assignedTo: lead.assignedTo,
    status: 'Active',
    createdBy: req.user._id,
  });

  // Create Opportunity
  const opportunity = await Opportunity.create({
    title: `Deal with ${lead.name}`,
    customer: customer._id,
    lead: lead._id,
    assignedTo: lead.assignedTo,
    stage: lead.status === 'Won' ? 'Won' : 'Qualified',
    expectedValue: lead.estimatedValue,
    probability: lead.status === 'Won' ? 100 : 50,
    createdBy: req.user._id,
  });

  // Update lead
  lead.convertedToCustomer = customer._id;
  lead.convertedToOpportunity = opportunity._id;
  lead.status = 'Won';
  await lead.save();

  await Interaction.create({
    type: 'Conversion',
    subject: 'Lead Converted',
    description: `Lead "${lead.name}" converted to customer and opportunity`,
    lead: lead._id,
    customer: customer._id,
    opportunity: opportunity._id,
    performedBy: req.user._id,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'Lead converted',
    entity: 'Lead',
    entityId: lead._id,
    description: `Lead "${lead.name}" converted to customer and opportunity`,
    ipAddress: req.ip,
  });

  sendSuccess(res, { customer, opportunity, lead }, 201, 'Lead converted successfully');
});
exports.addNote = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead || !lead.isActive) {
    return next(new AppError('Lead not found.', 404));
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return next(new AppError('Note text is required.', 400));
  }

  lead.notes.push({
    text: text.trim(),
    addedBy: req.user._id,
    addedAt: new Date(),
  });
  await lead.save();

  await Interaction.create({
    type: 'Note',
    subject: 'Note Added',
    description: 'Note added to lead: ' + text.substring(0, 100),
    lead: lead._id,
    performedBy: req.user._id,
  });

  sendSuccess(res, { lead }, 201, 'Note added successfully');
});

exports.updateTags = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead || !lead.isActive) {
    return next(new AppError('Lead not found.', 404));
  }

  const { tags } = req.body;
  if (!Array.isArray(tags)) {
    return next(new AppError('Tags must be an array of strings.', 400));
  }

  lead.tags = tags.map((t) => t.trim()).filter(Boolean);
  await lead.save();

  sendSuccess(res, { lead }, 200, 'Tags updated successfully');
});
