const AppError = require('../utils/apiError');
const logger = require('../utils/logger');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error with context
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip,
  });

  // Mongoose CastError (Invalid ID)
  if (err.name === 'CastError') {
    error = AppError.badRequest(`Resource not found with invalid ${err.path}: ${err.value}`);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    error = AppError.conflict(`Duplicate value '${value}' entered for unique field '${field}'`);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = AppError.badRequest('Validation Error', formattedErrors);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = AppError.unauthorized('Invalid security token. Please log in again.');
  }

  if (err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('Security token has expired. Please log in again.');
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';
  const message = error.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    statusCode,
    status,
    message,
    errors: error.errors || null,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
