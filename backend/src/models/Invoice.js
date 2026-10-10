const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    customerSnapshot: {
      name: { type: String, default: 'Walk-in Customer' },
      email: { type: String, default: 'walkin@nexcart.local' },
      phone: { type: String, default: 'N/A' },
      address: { type: String, default: 'In-Store Counter' },
    },
    sellerSnapshot: {
      name: { type: String, default: 'NexCart Supermarket Ltd.' },
      gstin: { type: String, default: '27AABCN1234F1Z8' },
      storeLocation: { type: String, default: 'Downtown Flagship, Lane 01' },
      address: { type: String, default: 'Plot 42, Tech Park Avenue, Pune, MH 411057' },
      contact: { type: String, default: '+91 8000-NEX-CART / support@nexcart.com' },
    },
    itemsSnapshot: [
      {
        name: String,
        sku: String,
        barcode: String,
        quantity: Number,
        unitPrice: Number,
        discountAmount: Number,
        taxRate: Number,
        taxAmount: Number,
        totalPrice: Number,
        batchNumber: String,
      },
    ],
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
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxBreakdown: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 },
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: 'card',
    },
    paymentReference: {
      type: String,
      default: 'TXN-SIM',
    },
    status: {
      type: String,
      enum: ['issued', 'paid', 'void'],
      default: 'paid',
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
