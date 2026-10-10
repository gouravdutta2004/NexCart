const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateCategory } = require('../validators/categoryValidator');
const { ROLES } = require('../utils/constants');

// Public route: Browse categories
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

// Admin-only management
router.post(
  '/',
  protect,
  authorize(ROLES.ADMIN),
  validateCategory,
  categoryController.createCategory
);

router.put(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  validateCategory,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  categoryController.deleteCategory
);

module.exports = router;
