const categoryService = require('../services/categoryService');
const ApiResponse = require('../utils/apiResponse');

const getCategories = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
    const categories = await categoryService.getAllCategories({ includeInactive });

    return ApiResponse.success(res, {
      message: 'Categories retrieved successfully',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    return ApiResponse.success(res, {
      message: 'Category retrieved successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);

    return ApiResponse.created(res, {
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);

    return ApiResponse.success(res, {
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryService.deleteCategory(req.params.id);

    return ApiResponse.success(res, {
      message: 'Category archived successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
