const Review = require('../models/Review');
const Product = require('../models/Product');
const AppError = require('../utils/apiError');

const getProductReviews = async (productId) => {
  const reviews = await Review.find({ productId })
    .populate('customerId', 'name')
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  return {
    reviews,
    summary: {
      averageRating: avgRating,
      totalReviews,
    },
  };
};

const Order = require('../models/Order');

const addReview = async (customerId, { productId, rating, comment }) => {
  if (!rating || isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
    throw AppError.badRequest('Rating must be a valid number between 1 and 5');
  }

  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    throw AppError.badRequest('Review comment is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw AppError.notFound(`Product with ID '${productId}' not found`);
  }

  // Check if customer has genuinely purchased this product in a completed order
  const verifiedOrder = await Order.findOne({
    customer: customerId,
    orderStatus: 'completed',
    'items.product': productId,
  });

  const isVerifiedPurchase = Boolean(verifiedOrder);

  // Upsert review (update if customer already reviewed this item)
  const review = await Review.findOneAndUpdate(
    { productId, customerId },
    {
      rating: Number(rating),
      comment: comment.trim(),
      isVerifiedPurchase,
      updatedAt: new Date(),
    },
    { new: true, upsert: true, runValidators: true }
  ).populate('customerId', 'name');

  return review;
};

const { ROLES } = require('../utils/constants');

const deleteReview = async (reviewId, userId, userRole) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw AppError.notFound('Review not found');
  }

  const isOwner = review.customerId && review.customerId.toString() === userId.toString();
  const isAdmin = userRole === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw AppError.forbidden('You are not authorized to delete this review');
  }

  await Review.findByIdAndDelete(reviewId);
  return { id: reviewId };
};

module.exports = {
  getProductReviews,
  addReview,
  deleteReview,
};
