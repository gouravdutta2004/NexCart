const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Batch quantity is required'],
      min: [0, 'Batch quantity cannot be negative'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required for FEFO tracking'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Batch cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      unique: true,
      index: true,
    },
    totalStock: {
      type: Number,
      required: true,
      min: [0, 'Total stock cannot be negative'],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    optimalStock: {
      type: Number,
      default: 50,
      min: [0, 'Optimal stock cannot be negative'],
    },
    shelfLocation: {
      type: String,
      trim: true,
      default: 'General Shelf',
    },
    batches: [batchSchema],
    lastAuditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Pre-save hook: auto-calculate totalStock as the sum of all active batch quantities
inventorySchema.pre('save', function (next) {
  if (this.batches && Array.isArray(this.batches)) {
    this.totalStock = this.batches.reduce((sum, batch) => sum + Math.max(0, batch.quantity), 0);
  }
  next();
});

// Index for expiry queries
inventorySchema.index({ 'batches.expiryDate': 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
