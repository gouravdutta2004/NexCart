const mongoose = require('mongoose');
const { ORDER_TYPES, ORDER_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
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
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 5, // percentage
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    batchAllocations: [
      {
        batchNumber: String,
        deductedQty: Number,
        expiryDate: Date,
      },
    ],
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      default: ORDER_TYPES.ONLINE,
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.COMPLETED,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.COMPLETED,
      index: true,
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
