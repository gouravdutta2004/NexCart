const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

// Create Order (Online customer, Cashier POS lane, or Express Self-Checkout)
router.post('/', optionalProtect, orderController.createOrder);

// Customer order history
router.get('/my-orders', protect, authorize(ROLES.CUSTOMER), orderController.getMyOrders);

// Order details by ID (Owner customer or Admin/Cashier)
router.get('/:id', protect, orderController.getOrderById);

// All orders across supermarket (Admin, Cashier)
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.CASHIER), orderController.getAllOrders);

// Admin update order status
router.patch('/:id/status', protect, authorize(ROLES.ADMIN), orderController.updateOrderStatus);

module.exports = router;
