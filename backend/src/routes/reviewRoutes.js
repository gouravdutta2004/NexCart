const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { validateReview } = require('../validators/cartValidator');

// Public route to view reviews
router.get('/product/:productId', reviewController.getProductReviews);

// Protected route to post review
router.post('/', protect, validateReview, reviewController.addReview);

module.exports = router;
