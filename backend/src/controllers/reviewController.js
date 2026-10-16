const reviewService = require('../services/reviewService');
const ApiResponse = require('../utils/apiResponse');

const getProductReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getProductReviews(req.params.productId);
    return ApiResponse.success(res, {
      message: 'Product reviews retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const review = await reviewService.addReview(req.user._id, { productId, rating, comment });

    return ApiResponse.created(res, {
      message: 'Product review submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(req.params.id, req.user._id, req.user.role);
    return ApiResponse.success(res, {
      message: 'Product review deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  addReview,
  deleteReview,
};
