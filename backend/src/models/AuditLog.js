const mongoose = require('mongoose');
const { AUDIT_MODULES } = require('../utils/constants');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      index: true,
    },
    module: {
      type: String,
      enum: Object.values(AUDIT_MODULES),
      required: [true, 'Audit module is required'],
      index: true,
    },
    recordId: {
      type: String,
      default: '',
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Enforce immutable append-only ledger properties: prevent modification or deletion
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable append-only records and cannot be modified.'));
  }
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  next();
});

auditLogSchema.pre(
  [
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'replaceOne',
    'deleteOne',
    'deleteMany',
    'findOneAndDelete',
    'findOneAndReplace',
    'findByIdAndUpdate',
    'findByIdAndDelete',
  ],
  function () {
    throw new Error('Audit logs are immutable append-only records. Updates and deletions are strictly prohibited.');
  }
);

// Compound index for querying audit history by module and date
auditLogSchema.index({ module: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
