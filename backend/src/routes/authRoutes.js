const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { authRateLimiter } = require('../middleware/rateLimiter');
const ApiResponse = require('../utils/apiResponse');

// Public routes
router.post('/register', authRateLimiter, validateRegister, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);

// RBAC Test Verification Routes
router.get('/rbac-test/admin', protect, authorize('admin'), (req, res) => {
  return ApiResponse.success(res, {
    message: 'Authorized: Admin access confirmed',
    data: { role: req.user.role, user: req.user.name },
  });
});

router.get('/rbac-test/inventory', protect, authorize('admin', 'inventory_manager'), (req, res) => {
  return ApiResponse.success(res, {
    message: 'Authorized: Inventory manager or Admin access confirmed',
    data: { role: req.user.role, user: req.user.name },
  });
});

router.get('/rbac-test/cashier', protect, authorize('admin', 'cashier'), (req, res) => {
  return ApiResponse.success(res, {
    message: 'Authorized: Cashier or Admin access confirmed',
    data: { role: req.user.role, user: req.user.name },
  });
});

module.exports = router;
