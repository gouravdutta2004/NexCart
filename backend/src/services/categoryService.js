const Category = require('../models/Category');
const AppError = require('../utils/apiError');
const { escapeRegex } = require('../utils/sanitize');

const getAllCategories = async ({ includeInactive = false } = {}) => {
  const query = includeInactive ? {} : { isActive: true };
  return Category.find(query).sort({ name: 1 });
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw AppError.notFound('Category not found');
  }
  return category;
};

const createCategory = async ({ name, slug, description, icon }) => {
  const safeName = escapeRegex(name.trim());
  const existingName = await Category.findOne({ name: { $regex: new RegExp(`^${safeName}$`, 'i') } });
  if (existingName) {
    throw AppError.conflict(`Category with name '${name}' already exists`);
  }

  const newCategory = await Category.create({
    name: name.trim(),
    slug: slug ? slug.trim().toLowerCase() : undefined,
    description: description ? description.trim() : '',
    icon: icon || 'Package',
  });

  return newCategory;
};

const updateCategory = async (id, updateData) => {
  const category = await Category.findById(id);
  if (!category) {
    throw AppError.notFound('Category not found');
  }

  if (updateData.name && updateData.name.trim() !== category.name) {
    const safeUpdatedName = escapeRegex(updateData.name.trim());
    const existing = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${safeUpdatedName}$`, 'i') },
    });
    if (existing) {
      throw AppError.conflict(`Category with name '${updateData.name}' already exists`);
    }
    category.name = updateData.name.trim();
  }

  if (updateData.slug) category.slug = updateData.slug.trim().toLowerCase();
  if (updateData.description !== undefined) category.description = updateData.description.trim();
  if (updateData.icon) category.icon = updateData.icon;
  if (updateData.isActive !== undefined) category.isActive = Boolean(updateData.isActive);

  await category.save();
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw AppError.notFound('Category not found');
  }

  // Soft-delete by setting isActive to false
  category.isActive = false;
  await category.save();
  return category;
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
