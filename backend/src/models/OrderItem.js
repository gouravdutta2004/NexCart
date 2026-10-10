const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    barcode: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 5,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    batchAllocations: [
      {
        batchNumber: String,
        deductedQty: Number,
        expiryDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderItemSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
