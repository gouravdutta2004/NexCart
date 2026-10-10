const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

// Fast barcode lookup for scanner (role-aware inventory disclosure)
router.get('/barcode/:code', optionalProtect, posController.scanBarcode);

// Pre-flight stock availability validator
router.post('/validate', posController.validateCheckout);

// Cart holding & recalling (Protected for Cashier & Admin)
router.post('/hold', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.holdCart);
router.get('/held', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.getHeldCarts);
router.delete('/held/:id', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.recallCart);

module.exports = router;
