const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Get authenticated customer's loyalty profile and tier status
router.get('/me', protect, loyaltyController.getMyProfile);

// Cashier & Admin POS lookup for customer by phone, email, or name
router.get('/lookup', protect, authorize('admin', 'cashier'), loyaltyController.lookupCustomer);

// Calculate point redemption discount against order subtotal
router.post('/calculate-redemption', protect, loyaltyController.calculateRedemption);

module.exports = router;
