const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

// Download / stream PDF invoice (strictly protected: authenticated user only)
router.get('/:id/pdf', protect, invoiceController.downloadInvoicePdf);

// Get invoice metadata by Invoice ID
router.get('/:id', protect, invoiceController.getInvoiceById);

// Get invoice metadata by Order ID
router.get('/order/:orderId', protect, invoiceController.getInvoiceByOrderId);

module.exports = router;
