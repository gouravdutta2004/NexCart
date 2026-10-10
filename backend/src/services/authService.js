const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/apiError');
const config = require('../config/env');
const { ROLES } = require('../utils/constants');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    config.JWT_SECRET,
    {
      expiresIn: config.JWT_EXPIRES_IN,
    }
  );
};

const AuditLog = require('../models/AuditLog');
const { AUDIT_MODULES } = require('../utils/constants');

const registerUser = async ({ name, email, password, phone, role }, ipAddress = '') => {
  if (role && role !== ROLES.CUSTOMER) {
    throw AppError.badRequest(
      'Public registration is restricted to customer accounts only. Staff accounts must be provisioned by an administrator.'
    );
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw AppError.conflict('An account with this email address already exists');
  }

  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone ? phone.trim() : '',
    role: ROLES.CUSTOMER, // Invariant: Public registration is strictly customer
  });

  // Record audit log for new registration
  await AuditLog.create({
    userId: newUser._id,
    action: 'USER_REGISTERED',
    module: AUDIT_MODULES.USERS,
    recordId: newUser._id.toString(),
    ipAddress,
    newState: {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
    notes: 'Public customer self-registration completed',
  });

  const token = generateToken(newUser);

  return {
    user: newUser.toSafeObject(),
    token,
  };
};

const loginUser = async ({ email, password }, ipAddress = '') => {
  // Query user and explicitly select password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw AppError.forbidden('Your account has been deactivated. Please contact an administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Record audit log for login
  await AuditLog.create({
    userId: user._id,
    action: 'USER_LOGIN',
    module: AUDIT_MODULES.USERS,
    recordId: user._id.toString(),
    ipAddress,
    newState: { role: user.role, email: user.email },
    notes: `User logged in with role: ${user.role}`,
  });

  const token = generateToken(user);

  return {
    user: user.toSafeObject(),
    token,
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User profile not found');
  }
  return user.toSafeObject();
};

const updateUserProfile = async (userId, { name, phone, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw AppError.notFound('User profile not found');
  }

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;

  // Optional password update
  if (newPassword) {
    if (!currentPassword) {
      throw AppError.badRequest('Current password is required to set a new password');
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw AppError.badRequest('Incorrect current password');
    }
    if (newPassword.length < 6) {
      throw AppError.badRequest('New password must be at least 6 characters long');
    }
    user.password = newPassword;
  }

  await user.save();
  return user.toSafeObject();
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
