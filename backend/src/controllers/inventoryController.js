const inventoryService = require('../services/inventoryService');
const ApiResponse = require('../utils/apiResponse');

const getOverview = async (req, res, next) => {
  try {
    const data = await inventoryService.getInventoryOverview();
    return ApiResponse.success(res, {
      message: 'Inventory overview retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getProductInventory = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getInventoryByProductId(req.params.productId);
    return ApiResponse.success(res, {
      message: 'Product inventory batches retrieved',
      data: { inventory },
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockAlerts = async (req, res, next) => {
  try {
    const alerts = await inventoryService.getLowStockAlerts();
    return ApiResponse.success(res, {
      message: 'Low stock alerts retrieved',
      data: { alerts },
    });
  } catch (error) {
    next(error);
  }
};

const getExpiryAlerts = async (req, res, next) => {
  try {
    const rawDays = parseInt(req.query.days, 10);
    const days = !isNaN(rawDays) && rawDays > 0 ? Math.min(rawDays, 365) : 30;
    const expiringBatches = await inventoryService.getExpiryAlerts(days);
    return ApiResponse.success(res, {
      message: 'Expiring inventory batches retrieved',
      data: { expiringBatches },
    });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { productId, newQuantity, reason } = req.body;
    const inventory = await inventoryService.adjustStock(req.user._id, {
      productId,
      newQuantity,
      reason,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, {
      message: 'Stock adjusted and logged to audit trail',
      data: { inventory },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getProductInventory,
  getLowStockAlerts,
  getExpiryAlerts,
  adjustStock,
};
