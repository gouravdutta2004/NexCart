const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const HeldCart = require('../models/HeldCart');
const AppError = require('../utils/apiError');

const lookupBarcode = async (barcode, { isStaff = false } = {}) => {
  if (!barcode) {
    throw AppError.badRequest('Barcode is required');
  }

  const cleanBarcode = barcode.toString().trim();
  const product = await Product.findOne({ barcode: cleanBarcode, isActive: true }).populate(
    'categoryId',
    'name slug'
  );

  if (!product) {
    throw AppError.notFound(`No active product found matching barcode '${cleanBarcode}'`);
  }

  // Enrich with live warehouse stock & earliest expiry batch
  const inventory = await Inventory.findOne({ productId: product._id });
  let availableStock = 0;
  let earliestExpiry = null;

  if (inventory) {
    availableStock = inventory.totalStock;
    if (inventory.batches && inventory.batches.length > 0) {
      const activeBatches = inventory.batches
        .filter((b) => b.quantity > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      if (activeBatches.length > 0) {
        earliestExpiry = activeBatches[0].expiryDate;
      }
    }
  }

  const responseData = {
    product: {
      _id: product._id,
      name: product.name,
      barcode: product.barcode,
      sku: product.sku,
      brand: product.brand,
      unit: product.unit,
      sellingPrice: product.sellingPrice,
      taxRate: product.taxRate,
      category: product.categoryId?.name || 'General',
      isExpiryTracked: product.isExpiryTracked,
    },
    inStock: availableStock > 0,
    isOutOfStock: availableStock <= 0,
    stockStatus: availableStock > 0 ? 'in_stock' : 'out_of_stock',
  };

  // Only disclose exact warehouse quantities and batch expiry dates to authorized staff
  if (isStaff) {
    responseData.availableStock = availableStock;
    responseData.earliestExpiry = earliestExpiry;
  }

  return responseData;
};

const holdCart = async (cashierId, { items, customerName = 'Walk-in Customer', notes = '' }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Cannot hold an empty cart');
  }

  const cartReference = `HC-${Date.now().toString().slice(-4)}`;
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity) - (Number(item.discount) || 0)),
    0
  );

  const heldCart = await HeldCart.create({
    cartReference,
    cashierId,
    customerName,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    notes,
    heldAt: new Date(),
  });

  return heldCart;
};

const getHeldCarts = async (cashierId = null) => {
  const query = cashierId ? { cashierId } : {};
  return HeldCart.find(query).sort({ heldAt: -1 });
};

const recallCart = async (heldId, user = null) => {
  const heldCart = await HeldCart.findById(heldId);
  if (!heldCart) {
    throw AppError.notFound('Held cart record not found');
  }

  // Enforce ownership: Cashier can only recall their own carts; Admin can manage all
  if (user && user.role !== 'admin') {
    if (heldCart.cashierId.toString() !== user._id.toString()) {
      throw AppError.forbidden('Access denied. Cashiers can only recall carts held by their own account.');
    }
  }

  // Remove from held collection
  await HeldCart.findByIdAndDelete(heldId);

  return heldCart;
};

const validatePreCheckout = async (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Cart contains no line items to validate');
  }

  const validatedItems = [];
  const errors = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      errors.push(`Product '${item.name || item.productId}' is no longer active in the catalog.`);
      continue;
    }

    const inventory = await Inventory.findOne({ productId: item.productId });
    const availableStock = inventory ? inventory.totalStock : 0;

    if (availableStock < item.quantity) {
      errors.push(
        `Insufficient stock for '${product.name}'. Available: ${availableStock}, Requested: ${item.quantity}`
      );
    }

    validatedItems.push({
      productId: product._id,
      name: product.name,
      barcode: product.barcode,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      taxRate: product.taxRate,
      discount: Number(item.discount) || 0,
    });
  }

  if (errors.length > 0) {
    throw AppError.badRequest('Checkout validation failed', errors);
  }

  return {
    isValid: true,
    validatedItems,
  };
};

module.exports = {
  lookupBarcode,
  holdCart,
  getHeldCarts,
  recallCart,
  validatePreCheckout,
};
