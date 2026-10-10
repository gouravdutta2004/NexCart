const supplierService = require('../services/supplierService');
const ApiResponse = require('../utils/apiResponse');

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await supplierService.getAllSuppliers({ status: req.query.status });
    return ApiResponse.success(res, {
      message: 'Suppliers retrieved successfully',
      data: { suppliers },
    });
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Supplier retrieved successfully',
      data: { supplier },
    });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    return ApiResponse.created(res, {
      message: 'Supplier created successfully',
      data: { supplier },
    });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    return ApiResponse.success(res, {
      message: 'Supplier updated successfully',
      data: { supplier },
    });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.deleteSupplier(req.params.id);
    return ApiResponse.success(res, {
      message: 'Supplier marked inactive',
      data: { supplier },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
