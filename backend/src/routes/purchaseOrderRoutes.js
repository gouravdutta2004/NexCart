const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validatePurchaseOrder } = require('../validators/inventoryValidator');
const { ROLES } = require('../utils/constants');

// Guard all purchase order routes for Admin and Inventory Manager
router.use(protect, authorize(ROLES.ADMIN, ROLES.INVENTORY_MANAGER));

router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrder);
router.post('/', validatePurchaseOrder, purchaseOrderController.createPurchaseOrder);
router.patch('/:id/receive', purchaseOrderController.receivePurchaseOrder);
router.patch('/:id/cancel', purchaseOrderController.cancelPurchaseOrder);

module.exports = router;
