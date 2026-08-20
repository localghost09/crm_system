const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const { User, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/helpers');
const config = require('../config');

const generateTokens = (userId) => {
  // Unique jti per token: guarantees two tokens issued in the same second
  // are still distinct, so refresh-token rotation is always verifiable.
  const accessToken = jwt.sign({ id: userId, jti: crypto.randomUUID() }, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
  const refreshToken = jwt.sign({ id: userId, jti: crypto.randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire,
  });
  return { accessToken, refreshToken };
};

const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  const tokens = generateTokens(user._id);

  if (tokens.refreshToken) {
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });
  }

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
  };

  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  sendSuccess(res, { user: userData, ...tokens }, statusCode, message);
};

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('A user with this email already exists.', 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'executive',
  });

  await AuditLog.create({
    user: user._id,
    action: 'User registered',
    entity: 'User',
    entityId: user._id,
    description: `User ${user.name} registered`,
    ipAddress: req.ip,
  });

  sendTokenResponse(user, 201, res, 'Registration successful');
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact your admin.', 401));
  }

  await AuditLog.create({
    user: user._id,
    action: 'User logged in',
    entity: 'User',
    entityId: user._id,
    description: `User ${user.name} logged in`,
    ipAddress: req.ip,
  });

  sendTokenResponse(user, 200, res, 'Login successful');
});

exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('accessToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  sendSuccess(res, null, 200, 'Logged out successfully');
});

exports.getMe = asyncHandler(async (req, res, next) => {
  sendSuccess(res, { user: req.user }, 200, 'User profile retrieved');
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required.', 400));
  }

  try {
    const decoded = await promisify(jwt.verify)(refreshToken, config.jwt.refreshSecret);
    // refreshToken is excluded from queries by default (select: false),
    // so it must be selected explicitly for the rotation check.
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid refresh token.', 401));
    }

    sendTokenResponse(user, 200, res, 'Token refreshed successfully');
  } catch (error) {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }
});