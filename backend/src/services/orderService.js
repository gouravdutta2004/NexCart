const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');
const inventoryService = require('./inventoryService');
const { emitNotification } = require('../config/socket');
const AppError = require('../utils/apiError');
const { 
  ORDER_TYPES, 
  ORDER_STATUS, 
  PAYMENT_STATUS, 
  PAYMENT_METHODS, 
  NOTIFICATION_TYPES, 
  AUDIT_MODULES, 
  ROLES 
} = require('../utils/constants');
const { escapeRegex } = require('../utils/sanitize');

/**
 * Generate human-friendly unique references
 */
const generateReference = (prefix) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
};

const Discount = require('../models/Discount');
const mongoose = require('mongoose');

/**
 * Detect replica set support for MongoDB multi-document ACID transactions
 */
let isReplicaSet = null;
const supportsTransactions = async () => {
  if (isReplicaSet !== null) return isReplicaSet;
  try {
    const topologyType = mongoose.connection.client?.topology?.description?.type;
    if (topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded') {
      isReplicaSet = true;
      console.log('[TRANSACTION ENGINE]: MongoDB replica set detected. Utilizing native multi-document ACID transactions.');
      return true;
    }
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ replSetGetStatus: 1 }).catch(() => null);
    isReplicaSet = Boolean(status && status.ok);
    if (isReplicaSet) {
      console.log('[TRANSACTION ENGINE]: MongoDB replica set detected. Utilizing native multi-document ACID transactions.');
    } else {
      console.log('[TRANSACTION ENGINE]: Standalone MongoDB detected. Utilizing exact FEFO batch compensating rollback.');
    }
  } catch (err) {
    isReplicaSet = false;
    console.log('[TRANSACTION ENGINE]: Standalone MongoDB detected. Utilizing exact FEFO batch compensating rollback.');
  }
  return isReplicaSet;
};

/**
 * Create Order with atomic FEFO stock deduction, Payment record, and Invoice snapshot
 */
const createOrder = async ({
  userId = null,
  cashierId = null,
  orderType = ORDER_TYPES.ONLINE,
  items = [],
  couponCode = null,
  paymentDetails = {},
  shippingAddress = null,
  notes = '',
  ipAddress = '',
}) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Order must contain at least one product item');
  }

  // Enforce anonymous restriction: unauthenticated checkouts are strictly restricted to SELF_CHECKOUT
  if (!userId && !cashierId && orderType !== ORDER_TYPES.SELF_CHECKOUT) {
    throw AppError.unauthorized('Anonymous checkout is restricted to express self-checkout kiosk only');
  }

  const useReplicaSetTxn = await supportsTransactions();
  const session = useReplicaSetTxn ? await mongoose.startSession() : null;
  if (session) {
    session.startTransaction();
  }

  // Tracking for standalone compensating rollback if an error occurs
  const executedDeductions = [];
  const lowStockAlerts = [];
  let appliedCoupon = null;
  let isCommitted = false;
  let savedOrderDoc = null;

  try {
    // 1. Authoritative Pricing, Tax, and FEFO Stock Deduction
    const preparedOrderItems = [];
    let subtotal = 0;
    let taxTotal = 0;

    for (const item of items) {
      const productId = item.productId || item._id;
      const quantity = Number(item.quantity);

      if (!productId || isNaN(quantity) || quantity <= 0) {
        throw AppError.badRequest('Each item must have a valid productId and quantity > 0');
      }

      // Query product directly from database to obtain authoritative price and tax
      const productQuery = Product.findById(productId);
      if (session) productQuery.session(session);
      const product = await productQuery;

      if (!product || !product.isActive) {
        throw AppError.notFound(`Product with ID '${productId}' is not available or inactive`);
      }

      // Authoritative values from database ONLY
      const unitPrice = Number(product.sellingPrice);
      const itemTaxRate = Number(product.taxRate !== undefined ? product.taxRate : 5);

      // Perform FEFO stock deduction with session and optimistic concurrency
      const deduction = await inventoryService.deductStockFEFO(product._id, quantity, session);
      executedDeductions.push({
        productId: product._id,
        allocations: deduction.allocations || [],
      });
      if (deduction.lowStockAlert) {
        lowStockAlerts.push(deduction.lowStockAlert);
      }

      const itemBaseTotal = unitPrice * quantity;
      const itemTax = (itemBaseTotal * itemTaxRate) / 100;
      const itemTotal = itemBaseTotal + itemTax;

      subtotal += itemBaseTotal;
      taxTotal += itemTax;

      preparedOrderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity,
        unitPrice,
        discountAmount: 0,
        taxRate: itemTaxRate,
        taxAmount: Math.round(itemTax * 100) / 100,
        subtotal: Math.round(itemTotal * 100) / 100,
        batchAllocations: deduction.allocations || [],
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;

    // 2. Authoritative Coupon Validation & Discount Calculation
    let discountTotal = 0;
    appliedCoupon = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const discountQuery = Discount.findOne({
        code: normalizedCode,
        isActive: true,
        endDate: { $gte: new Date() },
      });
      if (session) discountQuery.session(session);
      appliedCoupon = await discountQuery;

      if (!appliedCoupon) {
        throw AppError.badRequest(`Coupon code '${normalizedCode}' is invalid or expired`);
      }

      if (appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
        throw AppError.badRequest(`Coupon code '${appliedCoupon.code}' has reached its maximum usage limit`);
      }

      if (subtotal < appliedCoupon.minPurchaseAmount) {
        throw AppError.badRequest(
          `Minimum order subtotal of Rs. ${appliedCoupon.minPurchaseAmount} required for coupon '${appliedCoupon.code}'`
        );
      }

      let calculatedDiscount = 0;
      if (appliedCoupon.discountType === 'percentage') {
        calculatedDiscount = (subtotal * appliedCoupon.discountValue) / 100;
        if (appliedCoupon.maxDiscountAmount) {
          calculatedDiscount = Math.min(calculatedDiscount, appliedCoupon.maxDiscountAmount);
        }
      } else {
        calculatedDiscount = appliedCoupon.discountValue;
      }

      calculatedDiscount = Math.min(calculatedDiscount, subtotal);
      discountTotal = Math.round(calculatedDiscount * 100) / 100;

      // Increment coupon usage count atomically to prevent race condition overselling slots
      const couponUpdateQuery = {
        _id: appliedCoupon._id,
        isActive: true,
        $expr: { $lt: ['$usedCount', '$usageLimit'] },
      };
      const couponOpts = { new: true };
      if (session) couponOpts.session = session;

      const incrementedCoupon = await Discount.findOneAndUpdate(
        couponUpdateQuery,
        { $inc: { usedCount: 1 } },
        couponOpts
      );

      if (!incrementedCoupon) {
        throw AppError.badRequest(`Coupon code '${appliedCoupon.code}' has reached its maximum usage limit`);
      }
      appliedCoupon = incrementedCoupon;
    }

    const grandTotal = Math.max(0, Math.round((subtotal - discountTotal + taxTotal) * 100) / 100);

    // 3. Resolve Customer Snapshot
    let customerUser = null;
    if (userId) {
      const userQuery = User.findById(userId);
      if (session) userQuery.session(session);
      customerUser = await userQuery;
    }

    const customerSnapshot = {
      name: customerUser ? customerUser.name : (paymentDetails.customerName || 'Walk-in Customer'),
      email: customerUser ? customerUser.email : (paymentDetails.customerEmail || 'walkin@nexcart.local'),
      phone: customerUser ? (customerUser.phone || 'N/A') : (paymentDetails.customerPhone || 'N/A'),
      address: shippingAddress 
        ? `${shippingAddress.addressLine1 || ''}, ${shippingAddress.city || ''}, ${shippingAddress.postalCode || ''}` 
        : 'In-Store POS Counter',
    };

    // 4. Create Order
    const orderNumber = generateReference('NXC-ORD');
    const orderDoc = new Order({
      orderNumber,
      orderType,
      customer: customerUser ? customerUser._id : null,
      cashier: cashierId || null,
      items: preparedOrderItems,
      subtotal,
      discountTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      couponDiscount: discountTotal,
      taxTotal,
      totalAmount: grandTotal,
      orderStatus: ORDER_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      shippingAddress: shippingAddress || {},
      notes,
    });

    const order = session ? await orderDoc.save({ session }) : await orderDoc.save();
    savedOrderDoc = order;

    // 5. Create Normalized OrderItems
    const normalizedItems = preparedOrderItems.map((item) => ({
      order: order._id,
      product: item.product,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      totalPrice: item.subtotal,
      batchAllocations: item.batchAllocations,
    }));

    if (session) {
      await OrderItem.insertMany(normalizedItems, { session });
    } else {
      await OrderItem.insertMany(normalizedItems);
    }

    // 6. Create Payment Record
    const paymentNumber = generateReference('NXC-PAY');
    const paymentDoc = new Payment({
      paymentNumber,
      order: order._id,
      amount: grandTotal,
      currency: 'INR',
      paymentMethod: paymentDetails.method || PAYMENT_METHODS.CARD,
      status: PAYMENT_STATUS.COMPLETED,
      transactionReference: paymentDetails.transactionReference || generateReference('TXN'),
      tenderDetails: {
        cashTendered: paymentDetails.tenderDetails?.cashTendered || 0,
        changeDue: paymentDetails.tenderDetails?.changeDue || 0,
        cardLast4: paymentDetails.tenderDetails?.cardLast4 || '',
        upiId: paymentDetails.tenderDetails?.upiId || '',
        terminalLane: paymentDetails.tenderDetails?.terminalLane || 'LANE-01',
      },
      paidAt: new Date(),
    });

    const payment = session ? await paymentDoc.save({ session }) : await paymentDoc.save();

    // 7. Create Invoice Record
    const invoiceNumber = generateReference('NXC-INV');
    const invoiceDoc = new Invoice({
      invoiceNumber,
      order: order._id,
      payment: payment._id,
      customerSnapshot,
      itemsSnapshot: preparedOrderItems.map((i) => ({
        name: i.name,
        sku: i.sku,
        barcode: i.barcode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountAmount: i.discountAmount,
        taxRate: i.taxRate,
        taxAmount: i.taxAmount,
        totalPrice: i.subtotal,
        batchNumber: i.batchAllocations?.[0]?.batchNumber || 'STANDARD',
      })),
      subtotal,
      discountTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      couponDiscount: discountTotal,
      taxBreakdown: {
        cgst: Math.round((taxTotal / 2) * 100) / 100,
        sgst: Math.round((taxTotal / 2) * 100) / 100,
        igst: 0,
        totalTax: taxTotal,
      },
      grandTotal,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.transactionReference,
      status: 'paid',
      issuedAt: new Date(),
    });

    const invoice = session ? await invoiceDoc.save({ session }) : await invoiceDoc.save();

    // 8. Clear Shopping Cart if customer online checkout
    if (userId && orderType === ORDER_TYPES.ONLINE) {
      if (session) {
        await Cart.findOneAndUpdate({ userId }, { items: [] }, { session });
      } else {
        await Cart.findOneAndUpdate({ userId }, { items: [] });
      }
    }

    // Commit Transaction if replica set
    if (session) {
      await session.commitTransaction();
      await session.endSession();
      isCommitted = true;
    } else {
      isCommitted = true;
    }

    // 9. Real-time Notification Dispatch (STRICTLY Post-commit, outside transaction)
    try {
      emitNotification({ role: 'admin' }, NOTIFICATION_TYPES.NEW_ORDER, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderType: order.orderType,
        timestamp: new Date().toISOString(),
      });

      // Low-stock notifications dispatched strictly outside transaction
      for (const alert of lowStockAlerts) {
        emitNotification({ role: 'inventory_manager' }, NOTIFICATION_TYPES.LOW_STOCK, alert);
      }
    } catch (notifErr) {
      console.error('[Post-Commit Notification Error]:', notifErr.message);
    }

    // 10. Audit Trail Record (Post-commit with isolated error handling)
    try {
      await AuditLog.create({
        userId: userId || cashierId || null,
        action: 'ORDER_PLACED',
        module: AUDIT_MODULES.ORDERS,
        recordId: order._id.toString(),
        ipAddress,
        newState: {
          orderNumber,
          totalAmount: grandTotal,
          subtotal,
          discountTotal,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          itemsCount: items.length,
          orderType,
        },
        notes: `Order ${orderNumber} created with invoice ${invoiceNumber}${appliedCoupon ? ` (Applied Coupon: ${appliedCoupon.code})` : ''}`,
      });
    } catch (auditErr) {
      console.error('[Post-Commit Audit Error]: Failed to record order audit log:', auditErr.message);
    }

    return {
      order,
      payment,
      invoice,
    };
  } catch (error) {
    if (session && !isCommitted) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error('Failed to abort order transaction:', abortErr);
      }
      try {
        await session.endSession();
      } catch (endErr) {
        console.error('Failed to end order session:', endErr);
      }
    } else if (!isCommitted) {
      // Compensating rollback for standalone mode: restore exact FEFO batch allocations
      for (const ded of executedDeductions) {
        try {
          const inv = await Inventory.findOne({ productId: ded.productId });
          if (inv && Array.isArray(ded.allocations)) {
            for (const alloc of ded.allocations) {
              const targetBatch = inv.batches.find((b) => b.batchNumber === alloc.batchNumber);
              if (targetBatch) {
                targetBatch.quantity += alloc.deductedQty;
              } else {
                inv.batches.push({
                  batchNumber: alloc.batchNumber,
                  quantity: alloc.deductedQty,
                  expiryDate: alloc.expiryDate || new Date(),
                  costPrice: 0,
                  receivedDate: new Date(),
                });
              }
            }
            await inv.save();
          }
        } catch (rollbackErr) {
          console.error('Failed compensating stock rollback:', rollbackErr);
        }
      }

      // Rollback coupon increment if consumed in standalone mode
      if (appliedCoupon) {
        try {
          await Discount.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: -1 } });
        } catch (couponRollbackErr) {
          console.error('Failed compensating coupon rollback:', couponRollbackErr);
        }
      }

      // Clean up orphaned order and items if created in standalone mode
      if (savedOrderDoc && savedOrderDoc._id) {
        try {
          await Order.findByIdAndDelete(savedOrderDoc._id);
          await OrderItem.deleteMany({ order: savedOrderDoc._id });
        } catch (cleanErr) {
          console.error('Failed compensating order deletion:', cleanErr);
        }
      }
    }
    throw error;
  }
};

/**
 * Get Orders for authenticated customer
 */
const getCustomerOrders = async (userId, { page = 1, limit = 10 }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find({ customer: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments({ customer: userId }),
  ]);

  // Fetch invoices for these orders
  const orderIds = orders.map((o) => o._id);
  const invoices = await Invoice.find({ order: { $in: orderIds } }).lean();
  const invoiceMap = new Map();
  invoices.forEach((inv) => invoiceMap.set(inv.order.toString(), inv));

  const ordersWithInvoice = orders.map((o) => ({
    ...o,
    invoice: invoiceMap.get(o._id.toString()) || null,
  }));

  return {
    orders: ordersWithInvoice,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get specific order by ID (with authorization check)
 */
const getOrderById = async (orderId, requestingUserId, requestingRole) => {
  const order = await Order.findById(orderId)
    .populate('customer', 'name email phone')
    .populate('cashier', 'name email employeeId')
    .populate('items.product', 'name category brand image')
    .lean();

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  // Customers can only see their own orders
  if (
    requestingRole === ROLES.CUSTOMER &&
    order.customer?._id?.toString() !== requestingUserId.toString()
  ) {
    throw AppError.forbidden('You are not authorized to view this order');
  }

  const [invoice, payment] = await Promise.all([
    Invoice.findOne({ order: order._id }).lean(),
    Payment.findOne({ order: order._id }).lean(),
  ]);

  return {
    ...order,
    invoice,
    payment,
  };
};

/**
 * Get all orders across the supermarket (Admin / Cashier)
 */
const getAllOrders = async ({
  page = 1,
  limit = 20,
  status = '',
  orderType = '',
  search = '',
}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.orderStatus = status;
  if (orderType) query.orderType = orderType;
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    query.$or = [
      { orderNumber: { $regex: safeSearch, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customer', 'name email')
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query),
  ]);

  const orderIds = orders.map((o) => o._id);
  const invoices = await Invoice.find({ order: { $in: orderIds } }).lean();
  const invoiceMap = new Map();
  invoices.forEach((inv) => invoiceMap.set(inv.order.toString(), inv));

  const enrichedOrders = orders.map((o) => ({
    ...o,
    invoice: invoiceMap.get(o._id.toString()) || null,
  }));

  return {
    orders: enrichedOrders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Update order status (Admin)
 */
const updateOrderStatus = async (orderId, status, adminUserId, ipAddress = '') => {
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw AppError.badRequest(`Invalid order status '${status}'`);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw AppError.notFound('Order not found');
  }

  const previousStatus = order.orderStatus;
  order.orderStatus = status;
  await order.save();

  await AuditLog.create({
    userId: adminUserId,
    action: 'ORDER_STATUS_UPDATED',
    module: AUDIT_MODULES.ORDERS,
    recordId: order._id.toString(),
    ipAddress,
    previousState: { orderStatus: previousStatus },
    newState: { orderStatus: status },
    notes: `Order ${order.orderNumber} status changed from ${previousStatus} to ${status}`,
  });

  return order;
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
