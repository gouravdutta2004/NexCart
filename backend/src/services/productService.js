const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/apiError');
const { escapeRegex } = require('../utils/sanitize');

const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'sellingPrice', 'costPrice', 'updatedAt', 'brand'];

const getAllProducts = async ({
  search = '',
  categoryId = '',
  minPrice,
  maxPrice,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  limit = 20,
  includeInactive = false,
}) => {
  const query = {};

  if (!includeInactive) {
    query.isActive = true;
  }

  // Filter by category
  if (categoryId) {
    query.categoryId = categoryId;
  }

  // Search filter across name, brand, barcode, or sku with ReDoS protection
  if (search && search.trim() !== '') {
    const safePattern = escapeRegex(search.trim());
    const searchRegex = new RegExp(safePattern, 'i');
    query.$or = [
      { name: searchRegex },
      { brand: searchRegex },
      { barcode: searchRegex },
      { sku: searchRegex },
    ];
  }

  // Price range filters
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.sellingPrice = {};
    if (minPrice !== undefined && !isNaN(minPrice)) query.sellingPrice.$gte = Number(minPrice);
    if (maxPrice !== undefined && !isNaN(maxPrice)) query.sellingPrice.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const validSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortCriteria = { [validSortBy]: sortDirection };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('categoryId', 'name slug icon')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1,
    },
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id).populate('categoryId', 'name slug icon');
  if (!product) {
    throw AppError.notFound(`Product with ID '${id}' not found`);
  }
  return product;
};

const getProductByBarcode = async (barcode) => {
  if (!barcode) {
    throw AppError.badRequest('Barcode is required for scan lookup');
  }

  const cleanBarcode = barcode.toString().trim();
  const product = await Product.findOne({ barcode: cleanBarcode, isActive: true }).populate(
    'categoryId',
    'name slug icon'
  );

  if (!product) {
    throw AppError.notFound(`No active product found matching barcode '${cleanBarcode}'`);
  }

  return product;
};

const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');
const { AUDIT_MODULES } = require('../utils/constants');

const createProduct = async (productData, userId = null, ipAddress = '') => {
  const { barcode, sku, categoryId } = productData;

  // Validate category existence
  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    throw AppError.badRequest(`Referenced category with ID '${categoryId}' does not exist`);
  }

  // Check unique barcode
  const existingBarcode = await Product.findOne({ barcode: barcode.trim() });
  if (existingBarcode) {
    throw AppError.conflict(`Product with barcode '${barcode}' already exists: ${existingBarcode.name}`);
  }

  // Check unique SKU
  const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
  if (existingSku) {
    throw AppError.conflict(`Product with SKU '${sku}' already exists: ${existingSku.name}`);
  }

  const newProduct = await Product.create({
    name: productData.name.trim(),
    barcode: barcode.trim(),
    sku: sku.trim().toUpperCase(),
    description: productData.description ? productData.description.trim() : '',
    categoryId,
    brand: productData.brand ? productData.brand.trim() : 'Generic',
    unit: productData.unit || 'pcs',
    costPrice: Number(productData.costPrice),
    sellingPrice: Number(productData.sellingPrice),
    taxRate: productData.taxRate !== undefined ? Number(productData.taxRate) : 5,
    imageUrl: productData.imageUrl || '',
    isExpiryTracked: productData.isExpiryTracked !== undefined ? Boolean(productData.isExpiryTracked) : true,
    isActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
  });

  // Automatically initialize baseline inventory record
  await Inventory.create({
    productId: newProduct._id,
    totalStock: 0,
    reorderLevel: 10,
    optimalStock: 50,
    shelfLocation: 'General Shelf',
    batches: [],
  });

  await AuditLog.create({
    userId,
    action: 'PRODUCT_CREATED',
    module: AUDIT_MODULES.PRODUCTS,
    recordId: newProduct._id.toString(),
    ipAddress,
    newState: {
      name: newProduct.name,
      sku: newProduct.sku,
      barcode: newProduct.barcode,
      sellingPrice: newProduct.sellingPrice,
      costPrice: newProduct.costPrice,
      taxRate: newProduct.taxRate,
      categoryId: newProduct.categoryId,
    },
    notes: `Product '${newProduct.name}' (${newProduct.sku}) created`,
  });

  return newProduct.populate('categoryId', 'name slug icon');
};

const updateProduct = async (id, updateData, userId = null, ipAddress = '') => {
  const product = await Product.findById(id);
  if (!product) {
    throw AppError.notFound(`Product with ID '${id}' not found`);
  }

  const previousState = {
    name: product.name,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice,
    taxRate: product.taxRate,
    isActive: product.isActive,
  };

  // Check barcode collision if barcode being modified
  if (updateData.barcode && updateData.barcode.trim() !== product.barcode) {
    const existing = await Product.findOne({
      _id: { $ne: id },
      barcode: updateData.barcode.trim(),
    });
    if (existing) {
      throw AppError.conflict(`Product with barcode '${updateData.barcode}' already exists`);
    }
    product.barcode = updateData.barcode.trim();
  }

  // Check SKU collision if SKU being modified
  if (updateData.sku && updateData.sku.trim().toUpperCase() !== product.sku) {
    const existing = await Product.findOne({
      _id: { $ne: id },
      sku: updateData.sku.trim().toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(`Product with SKU '${updateData.sku}' already exists`);
    }
    product.sku = updateData.sku.trim().toUpperCase();
  }

  if (updateData.categoryId) {
    const categoryExists = await Category.findById(updateData.categoryId);
    if (!categoryExists) {
      throw AppError.badRequest(`Category '${updateData.categoryId}' does not exist`);
    }
    product.categoryId = updateData.categoryId;
  }

  if (updateData.name) product.name = updateData.name.trim();
  if (updateData.description !== undefined) product.description = updateData.description.trim();
  if (updateData.brand) product.brand = updateData.brand.trim();
  if (updateData.unit) product.unit = updateData.unit;
  if (updateData.costPrice !== undefined) product.costPrice = Number(updateData.costPrice);
  if (updateData.sellingPrice !== undefined) product.sellingPrice = Number(updateData.sellingPrice);
  if (updateData.taxRate !== undefined) product.taxRate = Number(updateData.taxRate);
  if (updateData.imageUrl !== undefined) product.imageUrl = updateData.imageUrl;
  if (updateData.isExpiryTracked !== undefined) product.isExpiryTracked = Boolean(updateData.isExpiryTracked);
  if (updateData.isActive !== undefined) product.isActive = Boolean(updateData.isActive);

  await product.save();

  await AuditLog.create({
    userId,
    action: 'PRODUCT_UPDATED',
    module: AUDIT_MODULES.PRODUCTS,
    recordId: product._id.toString(),
    ipAddress,
    previousState,
    newState: {
      name: product.name,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      taxRate: product.taxRate,
      isActive: product.isActive,
    },
    notes: `Product '${product.name}' (${product.sku}) updated`,
  });

  return product.populate('categoryId', 'name slug icon');
};

const deleteProduct = async (id, userId = null, ipAddress = '') => {
  const product = await Product.findById(id);
  if (!product) {
    throw AppError.notFound(`Product with ID '${id}' not found`);
  }

  // Soft-delete
  product.isActive = false;
  await product.save();

  await AuditLog.create({
    userId,
    action: 'PRODUCT_ARCHIVED',
    module: AUDIT_MODULES.PRODUCTS,
    recordId: product._id.toString(),
    ipAddress,
    previousState: { isActive: true },
    newState: { isActive: false },
    notes: `Product '${product.name}' (${product.sku}) archived/deactivated`,
  });

  return product;
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
};
