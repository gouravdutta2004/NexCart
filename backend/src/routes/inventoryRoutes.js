const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateStockAdjustment } = require('../validators/inventoryValidator');
const { ROLES } = require('../utils/constants');

// All inventory routes require Admin or Inventory Manager privileges
router.use(protect, authorize(ROLES.ADMIN, ROLES.INVENTORY_MANAGER));

router.get('/', inventoryController.getOverview);
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts);
router.get('/alerts/expiring', inventoryController.getExpiryAlerts);
router.get('/alerts/expiry', inventoryController.getExpiryAlerts);
router.get('/product/:productId', inventoryController.getProductInventory);
router.post('/adjust', validateStockAdjustment, inventoryController.adjustStock);

module.exports = router;
