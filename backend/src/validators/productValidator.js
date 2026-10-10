const mongoose = require('mongoose');
const AppError = require('../utils/apiError');

const validateProduct = (req, res, next) => {
  const isUpdate = req.method === 'PUT' || req.method === 'PATCH';
  const { barcode, sku, name, categoryId, costPrice, sellingPrice, taxRate } = req.body;
  const errors = [];

  if (!isUpdate || barcode !== undefined) {
    if (!barcode || typeof barcode !== 'string' || barcode.trim().length === 0) {
      errors.push({ field: 'barcode', message: 'Barcode is required' });
    }
  }

  if (!isUpdate || sku !== undefined) {
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
      errors.push({ field: 'sku', message: 'SKU is required' });
    }
  }

  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Product name is required' });
    }
  }

  if (!isUpdate || categoryId !== undefined) {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      errors.push({ field: 'categoryId', message: 'A valid Category ID is required' });
    }
  }

  if (!isUpdate || costPrice !== undefined) {
    if (costPrice === undefined || costPrice === null || isNaN(costPrice) || Number(costPrice) < 0) {
      errors.push({ field: 'costPrice', message: 'Cost price must be a non-negative number' });
    }
  }

  if (!isUpdate || sellingPrice !== undefined) {
    if (sellingPrice === undefined || sellingPrice === null || isNaN(sellingPrice) || Number(sellingPrice) < 0) {
      errors.push({ field: 'sellingPrice', message: 'Selling price must be a non-negative number' });
    }
  }

  if (taxRate !== undefined && (isNaN(taxRate) || Number(taxRate) < 0 || Number(taxRate) > 100)) {
    errors.push({ field: 'taxRate', message: 'Tax rate must be between 0 and 100%' });
  }

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation Error', errors));
  }

  next();
};

module.exports = {
  validateProduct,
};
