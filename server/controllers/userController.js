const { User, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

exports.getUsers = asyncHandler(async (req, res, next) => {
  const { search, role, isActive, page = 1, limit = 20, sort = 'name' } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password -refreshToken')
    .sort(sort)
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));

  sendPaginated(res, users, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages: Math.ceil(total / parseInt(limit, 10)),
    hasNextPage: parseInt(page, 10) < Math.ceil(total / parseInt(limit, 10)),
    hasPrevPage: parseInt(page, 10) > 1,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) {
    return next(new AppError('User not found.', 404));
  }
  sendSuccess(res, { user });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, department, title } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('A user with this email already exists.', 400));
  }

  const user = await User.create({ name, email, password, role, phone, department, title });

  await AuditLog.create({
    user: req.user._id,
    action: 'User created',
    entity: 'User',
    entityId: user._id,
    description: `Admin created user "${user.name}" with role "${user.role}"`,
    ipAddress: req.ip,
  });

  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  sendSuccess(res, { user: userData }, 201, 'User created successfully');
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, role, phone, department, title, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError('Email already in use.', 400));
    }
  }

  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (phone) updates.phone = phone;
  if (department) updates.department = department;
  if (title) updates.title = title;
  if (isActive !== undefined) updates.isActive = isActive;

  const updated = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password -refreshToken');

  if (role && role !== user.role) {
    await AuditLog.create({
      user: req.user._id,
      action: 'User role changed',
      entity: 'User',
      entityId: user._id,
      description: `User "${user.name}" role changed from "${user.role}" to "${role}"`,
      ipAddress: req.ip,
    });
  }

  sendSuccess(res, { user: updated }, 200, 'User updated successfully');
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account.', 400));
  }

  await User.findByIdAndUpdate(req.params.id, { isActive: false });

  await AuditLog.create({
    user: req.user._id,
    action: 'User deleted',
    entity: 'User',
    entityId: user._id,
    description: `User "${user.name}" deleted`,
    ipAddress: req.ip,
  });

  sendSuccess(res, null, 200, 'User deleted successfully');
});