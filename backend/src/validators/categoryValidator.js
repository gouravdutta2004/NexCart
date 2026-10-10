const AppError = require('../utils/apiError');

const validateCategory = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Category name is required' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Category name cannot exceed 100 characters' });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

module.exports = {
  validateCategory,
};
