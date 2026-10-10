const mongoose = require('mongoose');
const AppError = require('../utils/apiError');

const validateStockAdjustment = (req, res, next) => {
  const { productId, newQuantity, reason } = req.body;
  const errors = [];

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    errors.push({ field: 'productId', message: 'A valid Product ID is required' });
  }

  if (newQuantity === undefined || isNaN(newQuantity) || Number(newQuantity) < 0) {
    errors.push({ field: 'newQuantity', message: 'New quantity must be a non-negative number' });
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    errors.push({ field: 'reason', message: 'A valid audit reason is required for inventory adjustment' });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

const validateSupplier = (req, res, next) => {
  const { name, email, phone } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Supplier name is required' });
  }

  if (!email || !email.includes('@')) {
    errors.push({ field: 'email', message: 'A valid supplier email is required' });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    errors.push({ field: 'phone', message: 'Supplier phone is required' });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

const validatePurchaseOrder = (req, res, next) => {
  const { supplierId, items } = req.body;
  const errors = [];

  if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
    errors.push({ field: 'supplierId', message: 'A valid Supplier ID is required' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required in the Purchase Order' });
  } else {
    items.forEach((item, index) => {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        errors.push({ field: `items[${index}].productId`, message: 'Valid Product ID is required' });
      }
      if (!item.orderedQty || Number(item.orderedQty) < 1) {
        errors.push({ field: `items[${index}].orderedQty`, message: 'Quantity must be at least 1' });
      }
      if (item.unitCost === undefined || Number(item.unitCost) < 0) {
        errors.push({ field: `items[${index}].unitCost`, message: 'Unit cost cannot be negative' });
      }
    });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

module.exports = {
  validateStockAdjustment,
  validateSupplier,
  validatePurchaseOrder,
};
