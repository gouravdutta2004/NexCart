const Supplier = require('../models/Supplier');
const AppError = require('../utils/apiError');

const getAllSuppliers = async ({ status = '' } = {}) => {
  const query = status ? { status } : {};
  return Supplier.find(query).populate('suppliedCategories', 'name slug').sort({ name: 1 });
};

const getSupplierById = async (id) => {
  const supplier = await Supplier.findById(id).populate('suppliedCategories', 'name slug');
  if (!supplier) {
    throw AppError.notFound(`Supplier with ID '${id}' not found`);
  }
  return supplier;
};

const createSupplier = async (supplierData) => {
  const existing = await Supplier.findOne({ email: supplierData.email.toLowerCase() });
  if (existing) {
    throw AppError.conflict(`Supplier with email '${supplierData.email}' already exists`);
  }

  const supplier = await Supplier.create({
    ...supplierData,
    email: supplierData.email.toLowerCase(),
  });

  return supplier.populate('suppliedCategories', 'name slug');
};

const updateSupplier = async (id, updateData) => {
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw AppError.notFound(`Supplier with ID '${id}' not found`);
  }

  if (updateData.email && updateData.email.toLowerCase() !== supplier.email) {
    const existing = await Supplier.findOne({
      _id: { $ne: id },
      email: updateData.email.toLowerCase(),
    });
    if (existing) {
      throw AppError.conflict(`Supplier with email '${updateData.email}' already exists`);
    }
    supplier.email = updateData.email.toLowerCase();
  }

  if (updateData.name) supplier.name = updateData.name.trim();
  if (updateData.contactPerson !== undefined) supplier.contactPerson = updateData.contactPerson;
  if (updateData.phone) supplier.phone = updateData.phone;
  if (updateData.address !== undefined) supplier.address = updateData.address;
  if (updateData.taxId !== undefined) supplier.taxId = updateData.taxId;
  if (updateData.paymentTerms) supplier.paymentTerms = updateData.paymentTerms;
  if (updateData.rating !== undefined) supplier.rating = Number(updateData.rating);
  if (updateData.status) supplier.status = updateData.status;
  if (updateData.suppliedCategories) supplier.suppliedCategories = updateData.suppliedCategories;

  await supplier.save();
  return supplier.populate('suppliedCategories', 'name slug');
};

const deleteSupplier = async (id) => {
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw AppError.notFound(`Supplier with ID '${id}' not found`);
  }

  supplier.status = 'inactive';
  await supplier.save();
  return supplier;
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
