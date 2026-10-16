const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateProduct } = require('../validators/productValidator');
const { ROLES } = require('../utils/constants');

// Public catalog routes (optionalProtect identifies Admins for includeInactive)
router.get('/', optionalProtect, productController.getProducts);

// Fast Barcode Scanner Lookup for POS & Self-Checkout
router.get('/barcode/:code', productController.getProductByBarcode);

router.get('/:id', productController.getProduct);

// Admin & Inventory Manager management routes
router.post(
  '/',
  protect,
  authorize(ROLES.ADMIN, ROLES.INVENTORY_MANAGER),
  validateProduct,
  productController.createProduct
);

router.put(
  '/:id',
  protect,
  authorize(ROLES.ADMIN, ROLES.INVENTORY_MANAGER),
  validateProduct,
  productController.updateProduct
);

// Admin-only deletion
router.delete(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  productController.deleteProduct
);

module.exports = router;
