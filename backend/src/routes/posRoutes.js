const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { posValidationRateLimiter } = require('../middleware/rateLimiter');
const { ROLES } = require('../utils/constants');

// Fast barcode lookup for scanner (role-aware inventory disclosure)
router.get('/barcode/:code', optionalProtect, posController.scanBarcode);

// Pre-flight stock availability validator (rate-limited, role-aware disclosure)
router.post('/validate', posValidationRateLimiter, optionalProtect, posController.validateCheckout);

// Cart holding & recalling (Protected for Cashier & Admin)
router.post('/hold', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.holdCart);
router.get('/held', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.getHeldCarts);
router.delete('/held/:id', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.recallCart);

// API.md blueprint aliases for recall
router.get('/recall/:id', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.recallCart);
router.delete('/recall/:id', protect, authorize(ROLES.CASHIER, ROLES.ADMIN), posController.recallCart);

module.exports = router;
