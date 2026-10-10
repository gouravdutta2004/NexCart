const mongoose = require('mongoose');
const AppError = require('../utils/apiError');

const validateAddToCart = (req, res, next) => {
  const { productId, quantity } = req.body;
  const errors = [];

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    errors.push({ field: 'productId', message: 'A valid Product ID is required' });
  }

  if (quantity !== undefined && (isNaN(quantity) || Number(quantity) < 1)) {
    errors.push({ field: 'quantity', message: 'Quantity must be at least 1' });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

const validateUpdateCartItem = (req, res, next) => {
  const { quantity } = req.body;
  const errors = [];

  if (quantity === undefined || isNaN(quantity) || Number(quantity) < 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be a non-negative number' });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

const validateReview = (req, res, next) => {
  const { productId, rating, comment } = req.body;
  const errors = [];

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    errors.push({ field: 'productId', message: 'A valid Product ID is required' });
  }

  if (rating === undefined || isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
    errors.push({ field: 'rating', message: 'Rating must be an integer between 1 and 5' });
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    errors.push({ field: 'comment', message: 'Review comment cannot be empty' });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

module.exports = {
  validateAddToCart,
  validateUpdateCartItem,
  validateReview,
};
