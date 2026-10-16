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
const { validateLineDiscount } = require('../utils/discountAuthorization');
const { parsePagination } = require('../utils/paginationHelper');

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
  requestingUser = null,
  managerOverride = null,
  orderStatus = null,
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
  let savedPaymentDoc = null;
  let savedInvoiceDoc = null;

  const effectiveUser = requestingUser || (cashierId ? { role: ROLES.CASHIER, _id: cashierId } : (userId ? { role: ROLES.CUSTOMER, _id: userId } : null));

  try {
    // 1. Authoritative Pricing, Tax, and FEFO Stock Deduction
    const preparedOrderItems = [];
    let subtotal = 0;
    let lineDiscountTotal = 0;
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
      let itemDiscount = 0;

      // In POS walk-in lanes, staff line discounts are authorized through the standardized engine
      if (orderType === ORDER_TYPES.POS_WALKIN) {
        const rawDiscount = Number(item.discount || item.discountAmount) || 0;
        if (rawDiscount > 0) {
          itemDiscount = validateLineDiscount({
            user: effectiveUser,
            lineGross: itemBaseTotal,
            requestedDiscount: rawDiscount,
            productName: product.name,
            managerOverride: item.managerOverride || managerOverride,
          });
        }
      }
      // For online and self-checkout orders, client-supplied line discounts are strictly ignored in favor of server-controlled pricing and validated coupons

      const itemNetBase = itemBaseTotal - itemDiscount;
      const itemTax = (itemNetBase * itemTaxRate) / 100;
      const itemTotal = itemNetBase + itemTax;

      subtotal += itemBaseTotal;
      lineDiscountTotal += itemDiscount;
      taxTotal += itemTax;

      preparedOrderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity,
        unitPrice,
        discountAmount: itemDiscount,
        taxRate: itemTaxRate,
        taxAmount: Math.round(itemTax * 100) / 100,
        subtotal: Math.round(itemTotal * 100) / 100,
        batchAllocations: deduction.allocations || [],
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    lineDiscountTotal = Math.round(lineDiscountTotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;

    // 2. Authoritative Coupon Validation & Discount Calculation
    let couponDiscount = 0;
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

      calculatedDiscount = Math.min(calculatedDiscount, Math.max(0, subtotal - lineDiscountTotal));
      couponDiscount = Math.round(calculatedDiscount * 100) / 100;

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

    const discountTotal = Math.round((lineDiscountTotal + couponDiscount) * 100) / 100;
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
      couponDiscount,
      taxTotal,
      totalAmount: grandTotal,
      orderStatus: orderStatus || ORDER_STATUS.COMPLETED,
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
    savedPaymentDoc = payment;

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
      couponDiscount,
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
    savedInvoiceDoc = invoice;

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
      // Admin notification for supermarket overview
      emitNotification({ role: 'admin' }, NOTIFICATION_TYPES.NEW_ORDER, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderType: order.orderType,
        customerName: order.shippingAddress?.fullName || 'Supermarket Shopper',
        timestamp: new Date().toISOString(),
      });

      // Customer-targeted order confirmation (only to the customer who placed it)
      if (userId) {
        emitNotification({ userId: userId.toString() }, 'order_status', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'confirmed',
          totalAmount: order.totalAmount,
          title: `Order #${order.orderNumber} Confirmed`,
          message: `Your grocery basket of ₹${order.totalAmount.toFixed(2)} is being prepared.`,
          timestamp: new Date().toISOString(),
        });
      }

      // Cashier lane notification for POS walk-in transactions
      if (orderType === ORDER_TYPES.POS_WALKIN) {
        emitNotification({ role: 'cashier' }, 'pos_completed', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          invoiceNumber,
          timestamp: new Date().toISOString(),
        });
      }

      // Low-stock notifications dispatched strictly to Inventory Managers and Admins
      for (const alert of lowStockAlerts) {
        emitNotification({ role: 'inventory_manager' }, NOTIFICATION_TYPES.LOW_STOCK, alert);
        emitNotification({ role: 'admin' }, NOTIFICATION_TYPES.LOW_STOCK, alert);
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

      // Clean up orphaned invoice, payment, and order if created in standalone mode
      if (savedInvoiceDoc && savedInvoiceDoc._id) {
        try {
          await Invoice.findByIdAndDelete(savedInvoiceDoc._id);
        } catch (cleanInvErr) {
          console.error('Failed compensating invoice deletion:', cleanInvErr);
        }
      }

      if (savedPaymentDoc && savedPaymentDoc._id) {
        try {
          await Payment.findByIdAndDelete(savedPaymentDoc._id);
        } catch (cleanPayErr) {
          console.error('Failed compensating payment deletion:', cleanPayErr);
        }
      }

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
const getCustomerOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit }, 10, 50);

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

  const ordersWithInvoice = orders.map((o) => {
    const inv = invoiceMap.get(o._id.toString()) || null;
    return {
      ...o,
      invoice: inv,
      invoiceId: inv ? inv._id : null,
    };
  });

  return {
    orders: ordersWithInvoice,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
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

  // Strict Role-Based and Ownership Authorization Policy:
  // - Admin: Allowed access to supermarket orders
  // - Customer: Strictly restricted to their own orders (IDOR protection)
  // - Cashier: Strictly restricted to orders within authorized operational lane scope (POS walk-in, self-checkout, or assigned register)
  // - Inventory Manager / others: Denied by default
  if (requestingRole === ROLES.ADMIN) {
    // Admin authorized
  } else if (requestingRole === ROLES.CUSTOMER) {
    const customerId = order.customer?._id?.toString() || order.customer?.toString();
    if (!customerId || customerId !== requestingUserId?.toString()) {
      throw AppError.forbidden('You are not authorized to view this order');
    }
  } else if (requestingRole === ROLES.CASHIER) {
    const cashierId = order.cashier?._id?.toString() || order.cashier?.toString();
    const isAssignedCashier = cashierId && cashierId === requestingUserId?.toString();
    if (cashierId && !isAssignedCashier) {
      throw AppError.forbidden('Cashiers cannot access orders processed by other cashiers');
    }
    if (!cashierId && order.orderType !== ORDER_TYPES.SELF_CHECKOUT) {
      throw AppError.forbidden('Cashiers are not authorized to access orders outside their operational lane scope');
    }
  } else {
    throw AppError.forbidden(`Role '${requestingRole}' is not authorized to access orders`);
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
const getAllOrders = async (
  { page = 1, limit = 20, status = '', orderType = '', search = '' } = {},
  requestingUserId = null,
  requestingRole = null
) => {
  if (requestingRole && requestingRole !== ROLES.ADMIN && requestingRole !== ROLES.CASHIER) {
    throw AppError.forbidden(`Role '${requestingRole}' is not authorized to list supermarket orders`);
  }

  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit }, 20, 100);

  const query = {};
  if (status) query.orderStatus = status;
  if (orderType) query.orderType = orderType;

  // Cashiers can only list orders within authorized operational lane scope (their own or unassigned kiosk)
  if (requestingRole === ROLES.CASHIER) {
    query.$or = [
      { cashier: requestingUserId },
      { cashier: null, orderType: ORDER_TYPES.SELF_CHECKOUT },
    ];
  }

  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    const searchFilter = [
      { orderNumber: { $regex: safeSearch, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: safeSearch, $options: 'i' } },
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchFilter }];
      delete query.$or;
    } else {
      query.$or = searchFilter;
    }
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

  const enrichedOrders = orders.map((o) => {
    const inv = invoiceMap.get(o._id.toString()) || null;
    return {
      ...o,
      invoice: inv,
      invoiceId: inv ? inv._id : null,
    };
  });

  return {
    orders: enrichedOrders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Update order status (Admin or Customer self-cancellation)
 */
const updateOrderStatus = async (orderId, status, actingUserId, userRole = ROLES.ADMIN, ipAddress = '') => {
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw AppError.badRequest(`Invalid order status '${status}'`);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw AppError.notFound('Order not found');
  }

  const previousStatus = order.orderStatus;

  // Terminal state check
  if (previousStatus === ORDER_STATUS.CANCELLED) {
    throw AppError.badRequest(`Cannot modify an already cancelled order (#${order.orderNumber}).`);
  }

  // Customer authorization check: customers can only cancel their own pending orders
  if (userRole === ROLES.CUSTOMER) {
    const isOwner = order.customer && order.customer.toString() === actingUserId.toString();
    if (!isOwner) {
      throw AppError.forbidden('You are not authorized to modify this order.');
    }
    if (order.orderStatus !== ORDER_STATUS.PENDING) {
      throw AppError.badRequest('Orders that have already begun processing or completed cannot be cancelled by customer.');
    }
    if (status !== ORDER_STATUS.CANCELLED) {
      throw AppError.forbidden('Customers are only permitted to cancel pending orders.');
    }
  }

  // Restore inventory stock and coupons if moving to CANCELLED
  if (status === ORDER_STATUS.CANCELLED && previousStatus !== ORDER_STATUS.CANCELLED) {
    for (const item of order.items) {
      const prodId = item.product?._id || item.product;
      if (prodId) {
        const inv = await Inventory.findOne({ productId: prodId });
        if (inv) {
          if (item.batchAllocations && item.batchAllocations.length > 0) {
            for (const alloc of item.batchAllocations) {
              const batch = inv.batches.find((b) => b.batchNumber === alloc.batchNumber);
              if (batch) {
                batch.quantity += alloc.deductedQty;
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
          } else {
            if (inv.batches.length > 0) {
              inv.batches[0].quantity += item.quantity;
            } else {
              inv.batches.push({
                batchNumber: `RESTORED-${order.orderNumber}`,
                quantity: item.quantity,
                expiryDate: new Date(Date.now() + 90 * 86400000),
                costPrice: 0,
                receivedDate: new Date(),
              });
            }
          }
          inv.lastAuditedAt = new Date();
          await inv.save();
        }
      }
    }

    // Restore coupon usage count
    if (order.couponCode) {
      await Discount.findOneAndUpdate(
        { code: order.couponCode, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
      );
    }
  }

  order.orderStatus = status;
  await order.save();

  await AuditLog.create({
    userId: actingUserId,
    action: 'ORDER_STATUS_UPDATED',
    module: AUDIT_MODULES.ORDERS,
    recordId: order._id.toString(),
    ipAddress,
    previousState: { orderStatus: previousStatus },
    newState: { orderStatus: status },
    notes: `Order ${order.orderNumber} status changed from ${previousStatus} to ${status}${status === ORDER_STATUS.CANCELLED ? ' (stock restored)' : ''}`,
  });

  // Emit status change notification directly to the customer
  if (order.customer) {
    try {
      const custId = order.customer._id ? order.customer._id.toString() : order.customer.toString();
      emitNotification({ userId: custId }, 'order_status', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status,
        title: `Order #${order.orderNumber} Status: ${status.toUpperCase().replace('_', ' ')}`,
        message: `Your supermarket order fulfillment status has been updated to ${status}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.error('[Notification Error]:', notifErr.message);
    }
  }

  // Also notify administrative monitoring
  try {
    emitNotification({ role: 'admin' }, 'order_status', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status,
      title: `Order #${order.orderNumber} Fulfillment Update`,
      message: `Status updated to ${status.toUpperCase().replace('_', ' ')}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (notifErr) {
    console.error('[Notification Error]:', notifErr.message);
  }

  return order;
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
