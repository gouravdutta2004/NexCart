const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const AppError = require('../utils/apiError');

const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate({
    path: 'items.productId',
    select: 'name barcode sku sellingPrice imageUrl unit taxRate brand isActive',
    populate: { path: 'categoryId', select: 'name' },
  });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  // Filter out deleted/inactive items and enrich with live stock status
  const validItems = [];
  let subtotal = 0;
  let estimatedTax = 0;

  for (const item of cart.items) {
    if (!item.productId || !item.productId.isActive) continue;

    const inv = await Inventory.findOne({ productId: item.productId._id });
    const availableStock = inv ? inv.totalStock : 0;

    const itemTotal = Number((item.quantity * item.productId.sellingPrice).toFixed(2));
    const itemTax = Number(((itemTotal * (item.productId.taxRate || 0)) / 100).toFixed(2));

    subtotal += itemTotal;
    estimatedTax += itemTax;

    validItems.push({
      _id: item._id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.productId.sellingPrice,
      itemTotal,
      itemTax,
      availableStock,
      isOutOfStock: availableStock < item.quantity,
    });
  }

  return {
    cartId: cart._id,
    userId,
    items: validItems,
    itemCount: validItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Number(subtotal.toFixed(2)),
    estimatedTax: Number(estimatedTax.toFixed(2)),
    grandTotal: Number((subtotal + estimatedTax).toFixed(2)),
  };
};

const addToCart = async (userId, { productId, quantity = 1 }) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw AppError.notFound(`Product not found or inactive`);
  }

  const inventory = await Inventory.findOne({ productId });
  const availableStock = inventory ? inventory.totalStock : 0;

  if (availableStock < quantity) {
    throw AppError.badRequest(
      `Cannot add to cart: only ${availableStock} units of '${product.name}' available in stock`
    );
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

  const addQty = Math.max(1, Number(quantity));

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + addQty;
    if (newQty > availableStock) {
      throw AppError.badRequest(
        `Cannot add ${addQty} more. Total in cart (${newQty}) exceeds available warehouse stock (${availableStock})`
      );
    }
    cart.items[existingItemIndex].quantity = newQty;
  } else {
    cart.items.push({
      productId,
      quantity: addQty,
      priceAtAddition: product.sellingPrice,
      addedAt: new Date(),
    });
  }

  await cart.save();
  return getCart(userId);
};

const updateCartItem = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw AppError.notFound('Shopping cart not found');
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    throw AppError.notFound('Item not found in shopping cart');
  }

  const newQty = Number(quantity);

  if (newQty <= 0) {
    // Remove item if quantity set to 0
    cart.items.splice(itemIndex, 1);
  } else {
    // Verify inventory availability
    const inventory = await Inventory.findOne({ productId });
    const availableStock = inventory ? inventory.totalStock : 0;

    if (newQty > availableStock) {
      throw AppError.badRequest(
        `Requested quantity (${newQty}) exceeds available inventory (${availableStock})`
      );
    }
    cart.items[itemIndex].quantity = newQty;
  }

  await cart.save();
  return getCart(userId);
};

const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw AppError.notFound('Shopping cart not found');
  }

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );

  await cart.save();
  return getCart(userId);
};

const clearCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return { items: [], itemCount: 0, subtotal: 0, estimatedTax: 0, grandTotal: 0 };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
