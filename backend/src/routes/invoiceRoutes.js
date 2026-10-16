const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

// Download / stream PDF invoice (strictly protected: authorized roles only)
router.get('/:id/pdf', protect, authorize(ROLES.ADMIN, ROLES.CASHIER, ROLES.CUSTOMER), invoiceController.downloadInvoicePdf);

// Get invoice metadata by Invoice ID
router.get('/:id', protect, authorize(ROLES.ADMIN, ROLES.CASHIER, ROLES.CUSTOMER), invoiceController.getInvoiceById);

// Get invoice metadata by Order ID
router.get('/order/:orderId', protect, authorize(ROLES.ADMIN, ROLES.CASHIER, ROLES.CUSTOMER), invoiceController.getInvoiceByOrderId);

module.exports = router;
