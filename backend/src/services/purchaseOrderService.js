const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/apiError');
const { PURCHASE_ORDER_STATUS, AUDIT_MODULES, NOTIFICATION_TYPES } = require('../utils/constants');
const { emitNotification } = require('../config/socket');

const getAllPurchaseOrders = async () => {
  return PurchaseOrder.find()
    .populate('supplierId', 'name contactPerson email phone')
    .populate('items.productId', 'name barcode sku')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

const getPurchaseOrderById = async (id) => {
  const po = await PurchaseOrder.findById(id)
    .populate('supplierId', 'name contactPerson email phone')
    .populate('items.productId', 'name barcode sku sellingPrice costPrice')
    .populate('createdBy', 'name email');

  if (!po) {
    throw AppError.notFound(`Purchase Order with ID '${id}' not found`);
  }
  return po;
};

const createPurchaseOrder = async (userId, { supplierId, items, expectedDeliveryDate }) => {
  const count = await PurchaseOrder.countDocuments();
  const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  let totalAmount = 0;
  const processedItems = items.map((item) => {
    const qty = Number(item.orderedQty);
    const cost = Number(item.unitCost);
    const subtotal = Number((qty * cost).toFixed(2));
    totalAmount += subtotal;

    return {
      productId: item.productId,
      orderedQty: qty,
      receivedQty: 0,
      unitCost: cost,
      subtotal,
    };
  });

  const newPO = await PurchaseOrder.create({
    poNumber,
    supplierId,
    items: processedItems,
    totalAmount: Number(totalAmount.toFixed(2)),
    status: PURCHASE_ORDER_STATUS.PLACED,
    expectedDeliveryDate: expectedDeliveryDate || undefined,
    createdBy: userId,
  });

  // Log Audit Entry
  await AuditLog.create({
    userId,
    action: 'PO_CREATED',
    module: AUDIT_MODULES.INVENTORY,
    recordId: newPO._id.toString(),
    notes: `Generated Purchase Order ${poNumber} for ₹${newPO.totalAmount}`,
  });

  return newPO.populate([
    { path: 'supplierId', select: 'name contactPerson' },
    { path: 'items.productId', select: 'name barcode' },
  ]);
};

const mongoose = require('mongoose');

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
      console.log('[TRANSACTION ENGINE]: Standalone MongoDB detected. Utilizing exact PO batch compensating rollback.');
    }
  } catch (err) {
    isReplicaSet = false;
    console.log('[TRANSACTION ENGINE]: Standalone MongoDB detected. Utilizing exact PO batch compensating rollback.');
  }
  return isReplicaSet;
};

const receivePurchaseOrder = async (userId, id, ipAddress = '') => {
  const useReplicaSetTxn = await supportsTransactions();
  const session = useReplicaSetTxn ? await mongoose.startSession() : null;
  if (session) {
    session.startTransaction();
  }

  const addedBatches = [];
  let isCommitted = false;

  try {
    const poQuery = PurchaseOrder.findById(id).populate('items.productId');
    if (session) poQuery.session(session);
    const po = await poQuery;

    if (!po) {
      throw AppError.notFound(`Purchase Order with ID '${id}' not found`);
    }

    if (po.status === PURCHASE_ORDER_STATUS.RECEIVED) {
      throw AppError.badRequest(`Purchase Order ${po.poNumber} has already been received.`);
    }

    // Iterate items and create new FEFO batches in Inventory atomically
    for (let i = 0; i < po.items.length; i++) {
      const item = po.items[i];
      const invQuery = Inventory.findOne({ productId: item.productId._id });
      if (session) invQuery.session(session);
      let inventory = await invQuery;

      // Auto-create inventory record if one doesn't exist yet
      if (!inventory) {
        inventory = new Inventory({
          productId: item.productId._id,
          totalStock: 0,
          reorderLevel: 10,
          optimalStock: 50,
          shelfLocation: 'Receiving Bay',
          batches: [],
        });
      }

      // Determine batch expiry (Perishable = 45 days, non-perishable = 180 days)
      const expiryDays = item.productId.isExpiryTracked ? 45 : 180;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const batchNumber = `BAT-${po.poNumber}-${i + 1}`;

      inventory.batches.push({
        batchNumber,
        quantity: item.orderedQty,
        expiryDate,
        costPrice: item.unitCost,
        receivedDate: new Date(),
      });

      inventory.lastAuditedAt = new Date();
      if (session) {
        await inventory.save({ session });
      } else {
        await inventory.save();
      }

      addedBatches.push({
        productId: item.productId._id,
        batchNumber,
      });

      item.receivedQty = item.orderedQty;
    }

    po.status = PURCHASE_ORDER_STATUS.RECEIVED;
    po.receivedDate = new Date();
    if (session) {
      await po.save({ session });
    } else {
      await po.save();
    }

    if (session) {
      await session.commitTransaction();
      await session.endSession();
      isCommitted = true;
    } else {
      isCommitted = true;
    }

    // Audit Log (Post-commit with isolated error handling)
    try {
      await AuditLog.create({
        userId,
        action: 'PO_RECEIVED',
        module: AUDIT_MODULES.INVENTORY,
        recordId: po._id.toString(),
        ipAddress,
        newState: {
          poNumber: po.poNumber,
          status: po.status,
          receivedDate: po.receivedDate,
          itemsCount: po.items.length,
        },
        notes: `Transactionally received and stocked all batches for ${po.poNumber}`,
      });
    } catch (auditErr) {
      console.error('[Post-Commit Audit Error]: Failed to create PO receipt audit log:', auditErr.message);
    }

    // Socket notification to inventory staff (Post-commit)
    try {
      emitNotification({ role: 'inventory_manager' }, NOTIFICATION_TYPES.PO_RECEIVED, {
        poNumber: po.poNumber,
        totalAmount: po.totalAmount,
        timestamp: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.error('[Post-Commit Notification Error]:', notifErr.message);
    }

    return po;
  } catch (error) {
    if (session && !isCommitted) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error('Failed to abort PO transaction:', abortErr);
      }
      try {
        await session.endSession();
      } catch (endErr) {
        console.error('Failed to end PO session:', endErr);
      }
    } else if (!isCommitted) {
      // Compensating rollback for standalone mode: remove added batches
      for (const batchInfo of addedBatches) {
        try {
          const inv = await Inventory.findOne({ productId: batchInfo.productId });
          if (inv) {
            inv.batches = inv.batches.filter((b) => b.batchNumber !== batchInfo.batchNumber);
            await inv.save();
          }
        } catch (rollbackErr) {
          console.error('Failed compensating PO batch rollback:', rollbackErr);
        }
      }
    }
    throw error;
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  receivePurchaseOrder,
};
