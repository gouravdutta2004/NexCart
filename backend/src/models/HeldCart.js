const mongoose = require('mongoose');

const heldItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
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
    discount: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 5.0,
    },
  },
  { _id: true }
);

const heldCartSchema = new mongoose.Schema(
  {
    cartReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    items: [heldItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    heldAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const HeldCart = mongoose.model('HeldCart', heldCartSchema);

module.exports = HeldCart;
