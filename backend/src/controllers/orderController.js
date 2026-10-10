const orderService = require('../services/orderService');
const ApiResponse = require('../utils/apiResponse');
const { ROLES, ORDER_TYPES } = require('../utils/constants');
const AppError = require('../utils/apiError');

const createOrder = async (req, res, next) => {
  try {
    let userId = null;
    let cashierId = null;
    let orderType;

    if (!req.user) {
      // Unauthenticated / Anonymous checkout: STRICTLY RESTRICTED TO SELF_CHECKOUT ONLY
      if (req.body.orderType && req.body.orderType !== ORDER_TYPES.SELF_CHECKOUT) {
        throw AppError.unauthorized(
          'Authentication required for online or POS counter checkout. Anonymous checkout is restricted to express self-checkout kiosk only.'
        );
      }
      orderType = ORDER_TYPES.SELF_CHECKOUT;
    } else if (req.user.role === ROLES.CUSTOMER) {
      userId = req.user._id;
      // Customer cannot spoof POS walk-in orders (restricted to cashier registers)
      if (req.body.orderType === ORDER_TYPES.POS_WALKIN) {
        throw AppError.forbidden(
          'Customers cannot create POS walk-in orders. POS orders must be placed through an authorized cashier.'
        );
      }
      // Allowed customer types: self_checkout or online (default)
      orderType = req.body.orderType === ORDER_TYPES.SELF_CHECKOUT
        ? ORDER_TYPES.SELF_CHECKOUT
        : ORDER_TYPES.ONLINE;
    } else if (req.user.role === ROLES.CASHIER) {
      cashierId = req.user._id;
      userId = req.body.customerId || null;
      // Cashiers can ONLY process POS walk-in orders at register lanes
      if (req.body.orderType && req.body.orderType !== ORDER_TYPES.POS_WALKIN) {
        throw AppError.badRequest('Cashiers can only process POS walk-in orders at checkout lane registers.');
      }
      orderType = ORDER_TYPES.POS_WALKIN;
    } else if (req.user.role === ROLES.ADMIN) {
      // Admin can operate all order channels
      if (req.body.orderType === ORDER_TYPES.ONLINE) {
        userId = req.body.customerId || req.user._id;
        orderType = ORDER_TYPES.ONLINE;
      } else if (req.body.orderType === ORDER_TYPES.SELF_CHECKOUT) {
        userId = req.body.customerId || req.user._id;
        orderType = ORDER_TYPES.SELF_CHECKOUT;
      } else {
        cashierId = req.user._id;
        userId = req.body.customerId || null;
        orderType = ORDER_TYPES.POS_WALKIN;
      }
    } else {
      throw AppError.forbidden(`Role '${req.user.role}' is not authorized to create orders.`);
    }

    const orderData = await orderService.createOrder({
      userId,
      cashierId,
      orderType,
      items: req.body.items,
      couponCode: req.body.couponCode,
      paymentDetails: req.body.paymentDetails,
      shippingAddress: req.body.shippingAddress,
      notes: req.body.notes,
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return ApiResponse.created(res, {
      message: `Order #${orderData.order.orderNumber} successfully processed`,
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getCustomerOrders(req.user._id, req.query);
    return ApiResponse.success(res, {
      message: 'Orders retrieved successfully',
      data: result.orders,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    return ApiResponse.success(res, {
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    return ApiResponse.success(res, {
      message: 'Supermarket orders list retrieved',
      data: result.orders,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.ip || req.connection?.remoteAddress
    );
    return ApiResponse.success(res, {
      message: `Order #${order.orderNumber} status updated to '${order.orderStatus}'`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
