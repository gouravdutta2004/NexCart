const AppError = require('../utils/apiError');

/**
 * Restrict route access to specified roles
 * @param  {...string} roles - Allowed user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required before checking role authorization.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access Denied: Your role '${req.user.role}' is not authorized to perform this operation.`
        )
      );
    }

    next();
  };
};

module.exports = {
  authorize,
};
