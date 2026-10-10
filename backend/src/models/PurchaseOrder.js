const mongoose = require('mongoose');
const { PURCHASE_ORDER_STATUS } = require('../utils/constants');

const poItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    orderedQty: {
      type: Number,
      required: [true, 'Ordered quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    receivedQty: {
      type: Number,
      default: 0,
      min: [0, 'Received quantity cannot be negative'],
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  {
    _id: true,
  }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, 'PO Number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
      index: true,
    },
    items: [poItemSchema],
    totalAmount: {
      type: Number,
      required: [true, 'Total PO amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(PURCHASE_ORDER_STATUS),
      default: PURCHASE_ORDER_STATUS.PLACED,
      index: true,
    },
    expectedDeliveryDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
    },
    receivedDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
