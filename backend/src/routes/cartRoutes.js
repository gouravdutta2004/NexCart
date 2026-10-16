const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { validateAddToCart, validateUpdateCartItem } = require('../validators/cartValidator');

// All cart endpoints require user authentication
router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', validateAddToCart, cartController.addToCart);
router.put('/items/:productId', validateUpdateCartItem, cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

// API.md blueprint aliases
router.post('/add', validateAddToCart, cartController.addToCart);
router.put('/update', validateUpdateCartItem, cartController.updateCartItem);
router.delete('/item/:productId', cartController.removeFromCart);

module.exports = router;
