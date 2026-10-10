const purchaseOrderService = require('../services/purchaseOrderService');
const ApiResponse = require('../utils/apiResponse');

const getPurchaseOrders = async (req, res, next) => {
  try {
    const purchaseOrders = await purchaseOrderService.getAllPurchaseOrders();
    return ApiResponse.success(res, {
      message: 'Purchase orders retrieved',
      data: { purchaseOrders },
    });
  } catch (error) {
    next(error);
  }
};

const getPurchaseOrder = async (req, res, next) => {
  try {
    const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Purchase order retrieved',
      data: { purchaseOrder },
    });
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(req.user._id, req.body);
    return ApiResponse.created(res, {
      message: 'Purchase order created successfully',
      data: { purchaseOrder },
    });
  } catch (error) {
    next(error);
  }
};

const receivePurchaseOrder = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const purchaseOrder = await purchaseOrderService.receivePurchaseOrder(
      req.user._id,
      req.params.id,
      ipAddress
    );
    return ApiResponse.success(res, {
      message: 'Purchase order received and stock batches deposited',
      data: { purchaseOrder },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
};
