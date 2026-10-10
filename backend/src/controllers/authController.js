const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const result = await authService.registerUser(
      { name, email, password, phone, role },
      ipAddress
    );

    return ApiResponse.created(res, {
      message: 'Account registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const result = await authService.loginUser({ email, password }, ipAddress);

    return ApiResponse.success(res, {
      message: 'Logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);

    return ApiResponse.success(res, {
      message: 'Current profile retrieved',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const updatedUser = await authService.updateUserProfile(req.user._id, {
      name,
      phone,
      currentPassword,
      newPassword,
    });

    return ApiResponse.success(res, {
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
