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

module.exports = {
  getProductReviews,
  addReview,
};
