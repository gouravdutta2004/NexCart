const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

// Create Order (Online customer, Cashier POS lane, or Express Self-Checkout)
router.post('/', optionalProtect, orderController.createOrder);

// Customer order history (Accessible to Customer & Admin)
router.get('/my-orders', protect, authorize(ROLES.CUSTOMER, ROLES.ADMIN), orderController.getMyOrders);

// Order details by ID (Owner customer, Admin, or authorized Cashier)
router.get('/:id', protect, authorize(ROLES.ADMIN, ROLES.CASHIER, ROLES.CUSTOMER), orderController.getOrderById);

// All orders across supermarket (Admin, Cashier)
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.CASHIER), orderController.getAllOrders);

// Update order fulfillment status (Admin, Cashier) or customer self-cancellation (Customer)
router.patch('/:id/status', protect, authorize(ROLES.ADMIN, ROLES.CASHIER, ROLES.CUSTOMER), orderController.updateOrderStatus);

module.exports = router;
