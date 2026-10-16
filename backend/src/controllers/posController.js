const posService = require('../services/posService');
const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../utils/constants');

const scanBarcode = async (req, res, next) => {
  try {
    const isStaff = req.user && [ROLES.ADMIN, ROLES.CASHIER, ROLES.INVENTORY_MANAGER].includes(req.user.role);
    const data = await posService.lookupBarcode(req.params.code, { isStaff });
    return ApiResponse.success(res, {
      message: 'Barcode scanned successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const holdCart = async (req, res, next) => {
  try {
    const heldCart = await posService.holdCart(req.user._id, req.body, req.user);
    return ApiResponse.created(res, {
      message: `Cart held successfully under reference ${heldCart.cartReference}`,
      data: { heldCart },
    });
  } catch (error) {
    next(error);
  }
};

const getHeldCarts = async (req, res, next) => {
  try {
    const isCashier = req.user.role === ROLES.CASHIER;
    const filterCashierId = isCashier ? req.user._id : null;
    const heldCarts = await posService.getHeldCarts(filterCashierId);
    return ApiResponse.success(res, {
      message: 'Held carts retrieved',
      data: { heldCarts },
    });
  } catch (error) {
    next(error);
  }
};

const recallCart = async (req, res, next) => {
  try {
    const recalledCart = await posService.recallCart(req.params.id, req.user);
    return ApiResponse.success(res, {
      message: `Cart ${recalledCart.cartReference} recalled to active POS lane`,
      data: { recalledCart },
    });
  } catch (error) {
    next(error);
  }
};

const validateCheckout = async (req, res, next) => {
  try {
    const isStaff = req.user && [ROLES.ADMIN, ROLES.CASHIER, ROLES.INVENTORY_MANAGER].includes(req.user.role);
    const validation = await posService.validatePreCheckout(req.body.items, {
      isStaff,
      user: req.user,
      managerOverride: req.body.managerOverride,
    });
    return ApiResponse.success(res, {
      message: 'Checkout pre-flight validation passed',
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanBarcode,
  holdCart,
  getHeldCarts,
  recallCart,
  validateCheckout,
};
