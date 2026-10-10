const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/apiError');
const config = require('../config/env');

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication required. Please provide a valid Bearer token.'));
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Verify that user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(AppError.unauthorized('The user belonging to this token no longer exists.'));
    }

    if (currentUser.status !== 'active') {
      return next(AppError.forbidden('Your account has been deactivated. Please contact an administrator.'));
    }

    // Attach user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalProtect = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next();
    }
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.status === 'active') {
      req.user = currentUser;
    }
    next();
  } catch (error) {
    // In optional protect, invalid token simply continues as guest
    next();
  }
};

module.exports = {
  protect,
  optionalProtect,
};
