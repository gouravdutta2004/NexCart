const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

// Validate code during checkout (Any authenticated user)
router.post('/validate', protect, discountController.validateDiscountCode);

// Admin / Inventory Manager management
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.INVENTORY_MANAGER), discountController.getAllDiscounts);
router.post('/', protect, authorize(ROLES.ADMIN), discountController.createDiscount);
router.patch('/:id/toggle', protect, authorize(ROLES.ADMIN), discountController.toggleDiscountStatus);

module.exports = router;
