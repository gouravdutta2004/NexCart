const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

// Only Tier 1 Administrator can inspect audit logs
router.get('/', protect, authorize(ROLES.ADMIN), auditController.getAuditLogs);

module.exports = router;
