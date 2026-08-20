const { Task, Interaction, Notification, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

exports.getTasks = asyncHandler(async (req, res, next) => {
  const { search, status, priority, assignedTo, relatedTo, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const filter = { isActive: true };
  
  if (req.user.role === 'executive') {
    filter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (relatedTo) filter.relatedTo = relatedTo;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const total = await Task.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit, 10));

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendPaginated(res, tasks, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
    hasNextPage: parseInt(page, 10) < totalPages,
    hasPrevPage: parseInt(page, 10) > 1,
  });
});

exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  if (!task || !task.isActive) {
    return next(new AppError('Task not found.', 404));
  }

  sendSuccess(res, { task });
});

exports.createTask = asyncHandler(async (req, res, next) => {
  const task = await Task.create({ ...req.body, createdBy: req.user._id });

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email');

  if (task.assignedTo) {
    await Notification.create({
      user: task.assignedTo,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `Task "${task.title}" has been assigned to you.`,
      relatedTo: task._id,
      relatedModel: 'Task',
    });
  }

  await Interaction.create({
    type: 'Task',
    subject: 'Task Created',
    description: `Task "${task.title}" created`,
    customer: task.relatedModel === 'Customer' ? task.relatedTo : undefined,
    lead: task.relatedModel === 'Lead' ? task.relatedTo : undefined,
    opportunity: task.relatedModel === 'Opportunity' ? task.relatedTo : undefined,
    performedBy: req.user._id,
  });

  sendSuccess(res, { task: populated }, 201, 'Task created successfully');
});

exports.updateTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task || !task.isActive) {
    return next(new AppError('Task not found.', 404));
  }

  if (req.body.status === 'Completed' && task.status !== 'Completed') {
    req.body.completedAt = new Date();
  }

  if (req.body.status === 'Completed') {
    await Notification.create({
      user: task.assignedTo || task.createdBy,
      type: 'task_assigned',
      title: 'Task Completed',
      message: `Task "${task.title}" has been completed.`,
      relatedTo: task._id,
      relatedModel: 'Task',
    });
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('assignedTo', 'name email');

  sendSuccess(res, { task: updated });
});

exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task || !task.isActive) {
    return next(new AppError('Task not found.', 404));
  }

  await Task.findByIdAndUpdate(req.params.id, { isActive: false });
  sendSuccess(res, null, 200, 'Task deleted successfully');
});