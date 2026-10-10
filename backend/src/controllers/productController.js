const productService = require('../services/productService');
const ApiResponse = require('../utils/apiResponse');

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      page,
      limit,
      includeInactive,
    } = req.query;

    const result = await productService.getAllProducts({
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      page,
      limit,
      includeInactive: includeInactive === 'true' && (req.user?.role === 'admin' || req.user?.role === 'inventory_manager'),
    });

    return ApiResponse.success(res, {
      message: 'Products retrieved successfully',
      data: { products: result.products },
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);

    return ApiResponse.success(res, {
      message: 'Product retrieved successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

const getProductByBarcode = async (req, res, next) => {
  try {
    const product = await productService.getProductByBarcode(req.params.code);

    return ApiResponse.success(res, {
      message: 'Product resolved by barcode',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const product = await productService.createProduct(req.body, req.user?._id, ipAddress);

    return ApiResponse.created(res, {
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const product = await productService.updateProduct(req.params.id, req.body, req.user?._id, ipAddress);

    return ApiResponse.success(res, {
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const product = await productService.deleteProduct(req.params.id, req.user?._id, ipAddress);

    return ApiResponse.success(res, {
      message: 'Product archived successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
};
