const { Lead, Customer, Opportunity, Task, FollowUp } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/helpers');

exports.getSummary = asyncHandler(async (req, res, next) => {
  const baseFilter = {};
  if (req.user.role === 'executive') {
    baseFilter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  const [totalLeads, totalCustomers, totalOpportunities, totalTasks] = await Promise.all([
    Lead.countDocuments({ ...baseFilter, isActive: true }),
    Customer.countDocuments({ ...baseFilter, isActive: true }),
    Opportunity.countDocuments({ ...baseFilter, isActive: true }),
    Task.countDocuments({ ...baseFilter, isActive: true }),
  ]);

  const [wonOpportunities, lostOpportunities, pipelineOpportunities] = await Promise.all([
    Opportunity.countDocuments({ ...baseFilter, isActive: true, stage: 'Won' }),
    Opportunity.countDocuments({ ...baseFilter, isActive: true, stage: 'Lost' }),
    Opportunity.countDocuments({ ...baseFilter, isActive: true, stage: { $nin: ['Won', 'Lost'] } }),
  ]);

  const pipelineValueResult = await Opportunity.aggregate([
    { $match: { ...baseFilter, isActive: true, stage: { $nin: ['Won', 'Lost'] } } },
    { $group: { _id: null, total: { $sum: '$expectedValue' } } },
  ]);
  const pipelineValue = pipelineValueResult[0]?.total || 0;

  const revenueResult = await Opportunity.aggregate([
    { $match: { ...baseFilter, isActive: true, stage: 'Won' } },
    { $group: { _id: null, total: { $sum: '$expectedValue' } } },
  ]);
  const revenue = revenueResult[0]?.total || 0;

  const conversionRate = totalLeads > 0 ? ((wonOpportunities / totalLeads) * 100).toFixed(1) : 0;

  // Upcoming follow-ups
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingFollowUps = await FollowUp.find({
    ...baseFilter,
    isActive: true,
    status: 'Pending',
    followUpDate: { $gte: today, $lte: tomorrow },
  })
    .populate('lead', 'name company')
    .populate('customer', 'name company')
    .sort('followUpDate')
    .limit(10);

  const overdueTasks = await Task.find({
    ...baseFilter,
    isActive: true,
    status: { $nin: ['Completed', 'Overdue'] },
    dueDate: { $lt: today },
  })
    .populate('assignedTo', 'name email')
    .sort('dueDate')
    .limit(10);

  const recentLeads = await Lead.find({ ...baseFilter, isActive: true })
    .populate('assignedTo', 'name email')
    .sort('-createdAt')
    .limit(5);

  const recentDeals = await Opportunity.find({ ...baseFilter, isActive: true, stage: { $in: ['Won', 'Lost'] } })
    .populate('customer', 'name company')
    .sort('-updatedAt')
    .limit(5);

  sendSuccess(res, {
    kpi: {
      totalLeads,
      totalCustomers,
      totalOpportunities,
      totalTasks,
      wonOpportunities,
      lostOpportunities,
      pipelineOpportunities,
      pipelineValue,
      revenue,
      conversionRate: parseFloat(conversionRate),
    },
    upcoming: {
      followUps: upcomingFollowUps,
      overdueTasks,
      recentLeads,
      recentDeals,
    },
  });
});

exports.getRevenue = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const match = { isActive: true, stage: 'Won' };

  if (req.user.role === 'executive') {
    match.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const monthlyRevenue = await Opportunity.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$expectedValue' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  sendSuccess(res, { monthlyRevenue });
});

exports.getPipeline = asyncHandler(async (req, res, next) => {
  const match = { isActive: true };
  if (req.user.role === 'executive') {
    match.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  const pipeline = await Opportunity.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        value: { $sum: '$expectedValue' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byStage = await Opportunity.find(match)
    .populate('customer', 'name company')
    .populate('assignedTo', 'name email')
    .sort({ expectedClosingDate: 1 });

  sendSuccess(res, { pipeline, opportunities: byStage });
});

exports.getPerformance = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const match = { isActive: true };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  // Sales rep performance
  const performance = await Opportunity.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$assignedTo',
        totalDeals: { $sum: 1 },
        wonDeals: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, 1, 0] } },
        lostDeals: { $sum: { $cond: [{ $eq: ['$stage', 'Lost'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, '$expectedValue', 0] } },
        pipelineValue: { $sum: { $cond: [{ $not: [{ $in: ['$stage', ['Won', 'Lost']] }] }, '$expectedValue', 0] } },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: {
        _id: 1,
        'user.name': 1,
        'user.email': 1,
        totalDeals: 1,
        wonDeals: 1,
        lostDeals: 1,
        revenue: 1,
        pipelineValue: 1,
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  sendSuccess(res, { performance });
});

exports.getCharts = asyncHandler(async (req, res, next) => {
  const match = {};
  if (req.user.role === 'executive') {
    match.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  // Lead acquisition by source
  const leadsBySource = await Lead.aggregate([
    { $match: { ...match, isActive: true } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },  ]);

  // Customer growth over time
  const customerGrowth = await Customer.aggregate([
    { $match: { ...match, isActive: true } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Lead status distribution
  const leadStatus = await Lead.aggregate([
    { $match: { ...match, isActive: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  sendSuccess(res, { leadsBySource, customerGrowth, leadStatus });
});