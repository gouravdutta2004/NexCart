const cartService = require('../services/cartService');
const ApiResponse = require('../utils/apiResponse');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user._id);
    return ApiResponse.success(res, {
      message: 'Active shopping cart retrieved',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user._id, { productId, quantity });

    return ApiResponse.success(res, {
      message: 'Item added to shopping cart',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user._id, productId, quantity);

    return ApiResponse.success(res, {
      message: 'Cart item quantity updated',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await cartService.removeFromCart(req.user._id, productId);

    return ApiResponse.success(res, {
      message: 'Item removed from shopping cart',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user._id);

    return ApiResponse.success(res, {
      message: 'Shopping cart cleared',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
