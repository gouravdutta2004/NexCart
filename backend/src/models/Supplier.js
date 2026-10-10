const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: [150, 'Supplier name cannot exceed 150 characters'],
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Supplier email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Supplier phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    taxId: {
      type: String,
      trim: true,
      default: '',
    },
    suppliedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    paymentTerms: {
      type: String,
      default: 'Net 30',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
