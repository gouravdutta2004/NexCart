const mongoose = require('mongoose');
const { PAYMENT_METHODS, PAYMENT_STATUS } = require('../utils/constants');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
      default: PAYMENT_METHODS.CARD,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.COMPLETED,
      index: true,
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true,
    },
    tenderDetails: {
      cashTendered: { type: Number, default: 0 },
      changeDue: { type: Number, default: 0 },
      cardLast4: { type: String, default: '' },
      upiId: { type: String, default: '' },
      terminalLane: { type: String, default: 'LANE-01' },
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
