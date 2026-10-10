const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      unique: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'Generic',
    },
    unit: {
      type: String,
      enum: ['pcs', 'kg', 'g', 'litre', 'ml', 'pack'],
      default: 'pcs',
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 5.0, // Default 5% GST/sales tax
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isExpiryTracked: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for catalog full-text search
productSchema.index({ name: 'text', brand: 'text', description: 'text' });
// Compound index for category filtering and active status
productSchema.index({ categoryId: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
