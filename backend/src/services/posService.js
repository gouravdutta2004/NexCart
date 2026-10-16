const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const HeldCart = require('../models/HeldCart');
const AppError = require('../utils/apiError');
const { ROLES } = require('../utils/constants');
const { emitNotification } = require('../config/socket');
const { validateLineDiscount } = require('../utils/discountAuthorization');

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

const holdCart = async (
  cashierId,
  { items, customerName = 'Walk-in Customer', notes = '', managerOverride = null },
  user = null
) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Cannot hold an empty cart');
  }

  // 1. Combine repeated product IDs and quantities before checking stock
  const aggregatedMap = new Map();
  for (const item of items) {
    const rawId = item.productId || item.product?._id || item.product || item._id;
    if (!rawId) {
      throw AppError.badRequest('Each held item must have a valid productId');
    }
    const pidStr = rawId.toString();
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw AppError.badRequest('Each held item must have a positive integer quantity');
    }
    const rawDiscount = item.discount !== undefined ? Number(item.discount) : 0;
    if (isNaN(rawDiscount) || rawDiscount < 0) {
      throw AppError.badRequest('Invalid discount specified');
    }

    if (aggregatedMap.has(pidStr)) {
      const existing = aggregatedMap.get(pidStr);
      existing.quantity += qty;
      existing.discount += rawDiscount;
    } else {
      aggregatedMap.set(pidStr, {
        productId: rawId,
        quantity: qty,
        discount: rawDiscount,
      });
    }
  }

  const sanitizedItems = [];
  let calculatedSubtotal = 0;

  for (const [, aggItem] of aggregatedMap) {
    // Authoritative lookup directly from MongoDB
    const product = await Product.findById(aggItem.productId);
    if (!product || !product.isActive) {
      throw AppError.badRequest(`Product '${aggItem.productId}' is invalid or no longer active in the catalog`);
    }

    // Validate live stock availability against the combined quantity
    const inventory = await Inventory.findOne({ productId: product._id });
    const availableStock = inventory ? inventory.totalStock : 0;
    if (availableStock < aggItem.quantity) {
      throw AppError.badRequest(
        `Cannot hold cart: Insufficient stock for '${product.name}' (Available: ${availableStock}, Requested: ${aggItem.quantity})`
      );
    }

    // Always enforce server authoritative selling price and tax rate
    const unitPrice = Number(product.sellingPrice);
    const taxRate = Number(product.taxRate !== undefined ? product.taxRate : 5);
    const lineGross = unitPrice * aggItem.quantity;

    // Apply standardized discount authorization policy
    const discount = validateLineDiscount({
      user,
      lineGross,
      requestedDiscount: aggItem.discount,
      productName: product.name,
      managerOverride,
    });

    const lineTotal = Number((lineGross - discount).toFixed(2));
    calculatedSubtotal += lineTotal;

    sanitizedItems.push({
      productId: product._id,
      name: product.name,
      barcode: product.barcode,
      quantity: aggItem.quantity,
      unitPrice, // STRICTLY server-authoritative price from database
      discount,
      taxRate,
    });
  }

  const cartReference = `HC-${Date.now().toString().slice(-4)}`;

  const heldCart = await HeldCart.create({
    cartReference,
    cashierId,
    customerName: customerName ? customerName.trim() : 'Walk-in Customer',
    items: sanitizedItems,
    subtotal: Number(calculatedSubtotal.toFixed(2)),
    notes: notes ? notes.trim() : '',
    heldAt: new Date(),
  });

  try {
    emitNotification({ role: 'cashier' }, 'cart_held', {
      cartReference,
      customerName: heldCart.customerName,
      subtotal: heldCart.subtotal,
      itemsCount: sanitizedItems.length,
      timestamp: new Date().toISOString(),
    });
  } catch (notifErr) {
    // Non-blocking notification
  }

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

  // 1. Combine repeated product IDs in held cart items if any
  const aggregatedMap = new Map();
  for (const item of heldCart.items) {
    const pidStr = item.productId.toString();
    if (aggregatedMap.has(pidStr)) {
      const existing = aggregatedMap.get(pidStr);
      existing.quantity += item.quantity;
      existing.discount += (item.discount || 0);
    } else {
      aggregatedMap.set(pidStr, {
        _id: item._id,
        productId: item.productId,
        name: item.name,
        barcode: item.barcode,
        quantity: item.quantity,
        discount: item.discount || 0,
        unitPrice: item.unitPrice,
      });
    }
  }

  // Revalidate product existence, availability, and recalculate authoritative prices
  const revalidatedItems = [];
  let recalculatedSubtotal = 0;
  let priceChangedAlert = false;

  for (const [, item] of aggregatedMap) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      throw AppError.badRequest(`Cannot recall cart: Product '${item.name}' is no longer active in the catalog.`);
    }

    const inventory = await Inventory.findOne({ productId: item.productId });
    const availableStock = inventory ? inventory.totalStock : 0;
    if (availableStock < item.quantity) {
      throw AppError.badRequest(
        `Cannot recall cart: Insufficient stock for '${product.name}'. Available: ${availableStock}, Requested: ${item.quantity}`
      );
    }

    const currentUnitPrice = Number(product.sellingPrice);
    if (currentUnitPrice !== item.unitPrice) {
      priceChangedAlert = true;
    }

    const lineGross = currentUnitPrice * item.quantity;

    // Apply standardized discount authorization policy
    const discount = validateLineDiscount({
      user,
      lineGross,
      requestedDiscount: item.discount,
      productName: product.name,
      managerOverride: user?.managerOverride,
    });

    const lineTotal = Number((lineGross - discount).toFixed(2));
    recalculatedSubtotal += lineTotal;

    revalidatedItems.push({
      _id: item._id,
      productId: product._id,
      name: product.name,
      barcode: product.barcode,
      quantity: item.quantity,
      unitPrice: currentUnitPrice,
      discount,
      taxRate: Number(product.taxRate !== undefined ? product.taxRate : 5),
      subtotal: lineTotal,
    });
  }

  // Remove from held collection only after successful revalidation
  await HeldCart.findByIdAndDelete(heldId);

  const recalledObject = heldCart.toObject();
  recalledObject.items = revalidatedItems;
  recalledObject.subtotal = Number(recalculatedSubtotal.toFixed(2));
  recalledObject.priceChangedAlert = priceChangedAlert;

  return recalledObject;
};

const validatePreCheckout = async (items, { isStaff = false, user = null, managerOverride = null } = {}) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Cart contains no line items to validate');
  }

  const validatedItems = [];
  const errors = [];

  // Combine repeated product IDs before checking available stock
  const aggregatedMap = new Map();
  for (const item of items) {
    const rawId = item.productId || item._id;
    if (!rawId) {
      errors.push('Invalid item identifier');
      continue;
    }
    const pidStr = rawId.toString();
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push('Item quantity must be a positive number');
      continue;
    }
    const rawDiscount = Math.max(0, Number(item.discount || item.discountAmount) || 0);

    if (aggregatedMap.has(pidStr)) {
      const existing = aggregatedMap.get(pidStr);
      existing.quantity += qty;
      existing.discount += rawDiscount;
    } else {
      aggregatedMap.set(pidStr, {
        productId: rawId,
        quantity: qty,
        discount: rawDiscount,
        name: item.name,
        managerOverride: item.managerOverride || managerOverride,
      });
    }
  }

  for (const [, aggItem] of aggregatedMap) {
    const product = await Product.findById(aggItem.productId);
    if (!product || !product.isActive) {
      errors.push(
        isStaff
          ? `Product '${aggItem.name || aggItem.productId}' is no longer active in the catalog.`
          : 'One or more items in your cart are no longer available.'
      );
      continue;
    }

    const inventory = await Inventory.findOne({ productId: product._id });
    const availableStock = inventory ? inventory.totalStock : 0;

    if (availableStock < aggItem.quantity) {
      errors.push(
        isStaff
          ? `Insufficient stock for '${product.name}'. Available: ${availableStock}, Requested: ${aggItem.quantity}`
          : `Insufficient stock available for '${product.name}' to fulfill requested quantity.`
      );
    }

    const unitPrice = Number(product.sellingPrice);
    const lineGross = unitPrice * aggItem.quantity;

    let itemDiscount = 0;
    try {
      itemDiscount = validateLineDiscount({
        user,
        lineGross,
        requestedDiscount: aggItem.discount,
        productName: product.name,
        managerOverride: aggItem.managerOverride,
      });
    } catch (discErr) {
      errors.push(discErr.message);
    }

    validatedItems.push({
      productId: product._id,
      name: product.name,
      barcode: product.barcode,
      quantity: aggItem.quantity,
      unitPrice,
      taxRate: Number(product.taxRate !== undefined ? product.taxRate : 5),
      discount: itemDiscount,
    });
  }

  if (errors.length > 0) {
    const userMessage = isStaff
      ? 'Checkout validation failed'
      : 'One or more items are unavailable or have insufficient stock.';
    throw AppError.badRequest(userMessage, errors);
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
