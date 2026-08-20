const { Customer, Interaction, Opportunity, Task, FollowUp, Notification, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

exports.getCustomers = asyncHandler(async (req, res, next) => {
  const { search, status, industry, assignedTo, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const filter = { isActive: true };

  if (req.user.role === 'executive') {
    filter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  if (status) filter.status = status;
  if (industry) filter.industry = industry;
  if (assignedTo) filter.assignedTo = assignedTo;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { name: searchRegex },
      { company: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  const total = await Customer.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit, 10));

  const customers = await Customer.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendPaginated(res, customers, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
    hasNextPage: parseInt(page, 10) < totalPages,
    hasPrevPage: parseInt(page, 10) > 1,
  });
});

exports.getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id)
    .populate('assignedTo', 'name email phone')
    .populate('createdBy', 'name email')
    .populate('leadSource', 'name company source');

  if (!customer || !customer.isActive) {
    return next(new AppError('Customer not found.', 404));
  }

  const opportunities = await Opportunity.find({ customer: customer._id, isActive: true })
    .populate('assignedTo', 'name email')
    .sort('-createdAt');

  const interactions = await Interaction.find({ customer: customer._id })
    .populate('performedBy', 'name email')
    .sort('-createdAt')
    .limit(50);

  const tasks = await Task.find({ relatedTo: customer._id, relatedModel: 'Customer', isActive: true })
    .populate('assignedTo', 'name email')
    .sort('-createdAt');

  const followups = await FollowUp.find({ customer: customer._id, isActive: true })
    .populate('assignedTo', 'name email')
    .sort('followUpDate');

  sendSuccess(res, { customer, opportunities, interactions, tasks, followups });
});

exports.createCustomer = asyncHandler(async (req, res, next) => {
  const { email, phone } = req.body;
  
  if (email || phone) {
    const duplicateConditions = [];
    if (email) duplicateConditions.push({ email: email.toLowerCase() });
    if (phone) duplicateConditions.push({ phone });
    
    if (duplicateConditions.length > 0) {
      const existing = await Customer.findOne({ isActive: true, $or: duplicateConditions });
      if (existing) {
        return next(new AppError('A customer with this email or phone already exists.', 409));
      }
    }
  }

  const customer = await Customer.create({ ...req.body, createdBy: req.user._id });

  await Interaction.create({
    type: 'Note',
    subject: 'Customer Created',
    description: `Customer "${customer.name}" was created`,
    customer: customer._id,
    performedBy: req.user._id,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'Customer created',
    entity: 'Customer',
    entityId: customer._id,
    description: `Customer "${customer.name}" created`,
    ipAddress: req.ip,
  });

  sendSuccess(res, { customer }, 201, 'Customer created successfully');
});

exports.updateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || !customer.isActive) {
    return next(new AppError('Customer not found.', 404));
  }

  if (req.user.role === 'executive' && customer.assignedTo?.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to update this customer.', 403));
  }

  const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('assignedTo', 'name email');

  await Interaction.create({
    type: 'Note',
    subject: 'Customer Updated',
    description: `Customer "${customer.name}" was updated`,
    customer: customer._id,
    performedBy: req.user._id,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'Customer updated',
    entity: 'Customer',
    entityId: customer._id,
    description: `Customer "${customer.name}" updated`,
    ipAddress: req.ip,
  });

  sendSuccess(res, { customer: updatedCustomer });
});

exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || !customer.isActive) {
    return next(new AppError('Customer not found.', 404));
  }

  await Customer.findByIdAndUpdate(req.params.id, { isActive: false });

  await AuditLog.create({
    user: req.user._id,
    action: 'Customer deleted',
    entity: 'Customer',
    entityId: customer._id,
    description: `Customer "${customer.name}" deleted`,
    ipAddress: req.ip,
  });

  sendSuccess(res, null, 200, 'Customer deleted successfully');
});