const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/apiError');
const { AUDIT_MODULES, ROLES } = require('../utils/constants');
const { escapeRegex } = require('../utils/sanitize');

/**
 * Get all users with filtering, search, and pagination (Admin only)
 */
const getAllUsers = async ({ page = 1, limit = 20, role = '', status = '', search = '' }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { phone: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    User.countDocuments(query),
  ]);

  return {
    users: users.map((u) => {
      delete u.password;
      return u;
    }),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get user by ID (Admin only)
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw AppError.notFound('User not found');
  }
  delete user.password;
  return user;
};

/**
 * Admin creates user with explicit role and status
 */
const createUserByAdmin = async (
  { name, email, password, phone, role, status = 'active' },
  adminUserId,
  ipAddress = ''
) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw AppError.conflict('An account with this email address already exists');
  }

  if (role && !Object.values(ROLES).includes(role)) {
    throw AppError.badRequest(`Invalid user role '${role}'`);
  }

  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone ? phone.trim() : '',
    role: role || ROLES.CUSTOMER,
    status: status || 'active',
  });

  await AuditLog.create({
    userId: adminUserId,
    action: 'ADMIN_USER_CREATED',
    module: AUDIT_MODULES.USERS,
    recordId: newUser._id.toString(),
    ipAddress,
    newState: {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
    },
    notes: `Admin created user ${newUser.email} with role '${newUser.role}'`,
  });

  return newUser.toSafeObject();
};

/**
 * Admin updates user profile, role, or phone
 */
const updateUserByAdmin = async (
  userId,
  { name, phone, role, status },
  adminUserId,
  ipAddress = ''
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const previousState = {
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (role && Object.values(ROLES).includes(role)) user.role = role;
  if (status && ['active', 'inactive'].includes(status)) user.status = status;

  await user.save();

  await AuditLog.create({
    userId: adminUserId,
    action: 'ADMIN_USER_UPDATED',
    module: AUDIT_MODULES.USERS,
    recordId: user._id.toString(),
    ipAddress,
    previousState,
    newState: {
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    notes: `Admin updated account details for ${user.email}`,
  });

  return user.toSafeObject();
};

/**
 * Toggle user active/inactive status
 */
const toggleUserStatus = async (userId, adminUserId, ipAddress = '') => {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Prevent admin from deactivating their own account
  if (user._id.toString() === adminUserId.toString()) {
    throw AppError.badRequest('Administrators cannot deactivate their own active account');
  }

  const previousStatus = user.status;
  user.status = user.status === 'active' ? 'inactive' : 'active';
  await user.save();

  await AuditLog.create({
    userId: adminUserId,
    action: 'USER_STATUS_TOGGLED',
    module: AUDIT_MODULES.USERS,
    recordId: user._id.toString(),
    ipAddress,
    previousState: { status: previousStatus },
    newState: { status: user.status },
    notes: `User ${user.email} status changed from ${previousStatus} to ${user.status}`,
  });

  return user.toSafeObject();
};

module.exports = {
  getAllUsers,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  toggleUserStatus,
};
