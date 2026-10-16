const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/apiError');
const { emitNotification } = require('../config/socket');
const { AUDIT_MODULES, NOTIFICATION_TYPES } = require('../utils/constants');

const getInventoryOverview = async () => {
  const inventoryRecords = await Inventory.find()
    .populate({
      path: 'productId',
      populate: { path: 'categoryId', select: 'name slug' },
    })
    .sort({ totalStock: 1 });

  let totalItems = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  inventoryRecords.forEach((inv) => {
    totalItems += inv.totalStock;
    if (inv.totalStock === 0) {
      outOfStockCount++;
    } else if (inv.totalStock <= inv.reorderLevel) {
      lowStockCount++;
    }
  });

  return {
    inventory: inventoryRecords,
    summary: {
      totalSKUs: inventoryRecords.length,
      totalUnits: totalItems,
      lowStockCount,
      outOfStockCount,
    },
  };
};

const getInventoryByProductId = async (productId) => {
  const inventory = await Inventory.findOne({ productId }).populate('productId');
  if (!inventory) {
    throw AppError.notFound(`Inventory record not found for product '${productId}'`);
  }
  return inventory;
};

const getLowStockAlerts = async () => {
  const alerts = await Inventory.find({
    $expr: { $lte: ['$totalStock', '$reorderLevel'] },
  }).populate({
    path: 'productId',
    populate: { path: 'categoryId', select: 'name' },
  });

  return alerts;
};

const getExpiryAlerts = async (daysThreshold = 30) => {
  const now = new Date();
  const futureThreshold = new Date();
  futureThreshold.setDate(now.getDate() + Number(daysThreshold));

  const records = await Inventory.find({
    'batches.quantity': { $gt: 0 },
  }).populate('productId');

  const expiringBatches = [];

  records.forEach((inv) => {
    if (!inv.productId || !inv.productId.isActive) return;

    inv.batches.forEach((batch) => {
      if (batch.quantity <= 0) return;

      const expiry = new Date(batch.expiryDate);
      if (expiry <= futureThreshold) {
        const diffTime = expiry.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let urgency = 'notice';
        if (daysRemaining <= 0) urgency = 'expired';
        else if (daysRemaining <= 7) urgency = 'critical';
        else if (daysRemaining <= 15) urgency = 'warning';

        expiringBatches.push({
          inventoryId: inv._id,
          productId: inv.productId._id,
          productName: inv.productId.name,
          barcode: inv.productId.barcode,
          sku: inv.productId.sku,
          brand: inv.productId.brand,
          sellingPrice: inv.productId.sellingPrice,
          batchNumber: batch.batchNumber,
          batchQuantity: batch.quantity,
          expiryDate: batch.expiryDate,
          daysRemaining,
          urgency,
        });
      }
    });
  });

  // Sort by earliest expiration first
  expiringBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  return expiringBatches;
};

const adjustStock = async (userId, { productId, newQuantity, reason, ipAddress = '' }) => {
  let inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.notFound(`Product with ID '${productId}' not found`);
    }
    // Auto-initialize inventory record if missing
    inventory = new Inventory({
      productId,
      totalStock: 0,
      reorderLevel: 10,
      optimalStock: 50,
      shelfLocation: 'General Shelf',
      batches: [],
    });
  }

  const previousState = {
    totalStock: inventory.totalStock,
    batches: inventory.batches.map((b) => ({ ...b.toObject() })),
  };

  const targetQty = Math.max(0, Number(newQuantity) || 0);

  if (targetQty === 0) {
    // Zero out all active batches
    inventory.batches.forEach((b) => {
      b.quantity = 0;
    });
  } else if (inventory.batches.length === 0) {
    // Create new baseline batch
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 90);
    inventory.batches.push({
      batchNumber: `ADJ-${Date.now().toString().slice(-6)}`,
      quantity: targetQty,
      expiryDate: defaultExpiry,
      costPrice: 0,
      receivedDate: new Date(),
    });
  } else {
    const currentTotal = inventory.batches.reduce((sum, b) => sum + Math.max(0, b.quantity), 0);
    const diff = targetQty - currentTotal;

    if (diff > 0) {
      // Allocate additional stock to the latest batch
      const targetBatch = inventory.batches[inventory.batches.length - 1];
      targetBatch.quantity += diff;
    } else if (diff < 0) {
      // Drain reduction sequentially across batches from newest backwards
      let remainingToDrain = Math.abs(diff);
      for (let i = inventory.batches.length - 1; i >= 0 && remainingToDrain > 0; i--) {
        const batchQty = Math.max(0, inventory.batches[i].quantity);
        const drain = Math.min(batchQty, remainingToDrain);
        inventory.batches[i].quantity -= drain;
        remainingToDrain -= drain;
      }
    }
  }

  inventory.lastAuditedAt = new Date();
  await inventory.save();

  const newState = {
    totalStock: inventory.totalStock,
    batches: inventory.batches.map((b) => ({ ...b.toObject() })),
  };

  // Record Immutable Audit Log
  await AuditLog.create({
    userId,
    action: 'STOCK_ADJUSTMENT',
    module: AUDIT_MODULES.INVENTORY,
    recordId: inventory._id.toString(),
    ipAddress,
    previousState,
    newState,
    notes: reason,
  });

  // Check if now low stock
  if (inventory.totalStock <= inventory.reorderLevel) {
    const alertData = {
      productId: inventory.productId,
      totalStock: inventory.totalStock,
      reorderLevel: inventory.reorderLevel,
      message: `Stock adjusted to low level: ${inventory.totalStock} units`,
    };
    emitNotification({ role: 'inventory_manager' }, NOTIFICATION_TYPES.LOW_STOCK, alertData);
    emitNotification({ role: 'admin' }, NOTIFICATION_TYPES.LOW_STOCK, alertData);
  }

  return inventory;
};

const deductStockFEFO = async (productId, requestedQuantity, session = null) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const query = Inventory.findOne({ productId });
    if (session) query.session(session);
    const inventory = await query;

    if (!inventory) {
      throw AppError.notFound(`No inventory record found for product '${productId}'`);
    }

    if (inventory.totalStock < requestedQuantity) {
      throw AppError.badRequest(
        `Insufficient inventory for item. Available: ${inventory.totalStock}, Requested: ${requestedQuantity}`
      );
    }

    // Sort batches by earliest expiry date (FEFO)
    inventory.batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    let remainingToDeduct = requestedQuantity;
    const allocations = [];

    for (const batch of inventory.batches) {
      if (batch.quantity <= 0) continue;

      const deductAmount = Math.min(batch.quantity, remainingToDeduct);
      batch.quantity -= deductAmount;
      remainingToDeduct -= deductAmount;

      allocations.push({
        batchNumber: batch.batchNumber,
        deductedQty: deductAmount,
        expiryDate: batch.expiryDate,
      });

      if (remainingToDeduct === 0) break;
    }

    try {
      if (session) {
        await inventory.save({ session });
      } else {
        await inventory.save();
      }

      const isLowStock = inventory.totalStock <= inventory.reorderLevel;
      const lowStockAlert = isLowStock
        ? {
            productId: inventory.productId,
            totalStock: inventory.totalStock,
            reorderLevel: inventory.reorderLevel,
            timestamp: new Date().toISOString(),
          }
        : null;

      // Defer notification if in active transaction; emit immediately only in non-transactional caller
      if (!session && isLowStock) {
        emitNotification({ role: 'inventory_manager' }, NOTIFICATION_TYPES.LOW_STOCK, lowStockAlert);
        emitNotification({ role: 'admin' }, NOTIFICATION_TYPES.LOW_STOCK, lowStockAlert);
      }

      return {
        remainingStock: inventory.totalStock,
        allocations,
        lowStockAlert,
      };
    } catch (saveError) {
      // If version error (optimistic concurrency conflict from concurrent request), retry with fresh stock
      if (saveError.name === 'VersionError' && attempt < maxRetries) {
        continue;
      }
      throw saveError;
    }
  }
};

module.exports = {
  getInventoryOverview,
  getInventoryByProductId,
  getLowStockAlerts,
  getExpiryAlerts,
  adjustStock,
  deductStockFEFO,
};
