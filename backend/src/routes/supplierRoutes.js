const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateSupplier } = require('../validators/inventoryValidator');
const { ROLES } = require('../utils/constants');

// Guard all supplier routes for Admin and Inventory Manager
router.use(protect, authorize(ROLES.ADMIN, ROLES.INVENTORY_MANAGER));

router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplier);
router.post('/', validateSupplier, supplierController.createSupplier);
router.put('/:id', validateSupplier, supplierController.updateSupplier);
router.delete('/:id', authorize(ROLES.ADMIN), supplierController.deleteSupplier);

module.exports = router;
