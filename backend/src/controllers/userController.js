const userService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');

const getAllUsers = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers(req.query);
    return ApiResponse.success(res, {
      message: 'User directory retrieved',
      data: data.users,
      meta: data.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return ApiResponse.success(res, {
      message: 'User details retrieved',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, status } = req.body;
    if (!name || !email || !password) {
      throw AppError.badRequest('Name, email, and password are required');
    }

    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const user = await userService.createUserByAdmin(
      { name, email, password, phone, role, status },
      req.user._id,
      ipAddress
    );

    return ApiResponse.created(res, {
      message: `User '${user.name}' (${user.role}) created successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role, status } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const user = await userService.updateUserByAdmin(
      req.params.id,
      { name, phone, role, status },
      req.user._id,
      ipAddress
    );

    return ApiResponse.success(res, {
      message: `User profile for '${user.email}' updated`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const user = await userService.toggleUserStatus(req.params.id, req.user._id, ipAddress);

    return ApiResponse.success(res, {
      message: `User '${user.email}' status set to '${user.status}'`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
};
