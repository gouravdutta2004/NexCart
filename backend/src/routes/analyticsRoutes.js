const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

// Protect all analytics endpoints for Admin and Inventory Manager roles
router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.INVENTORY_MANAGER));

router.get('/overview', analyticsController.getOverview);
router.get('/sales-trend', analyticsController.getSalesTrend);
router.get('/category-breakdown', analyticsController.getCategoryBreakdown);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/channel-breakdown', analyticsController.getChannelBreakdown);
router.get('/demand-forecast', analyticsController.getDemandForecast);
router.get('/markdown-recommendations', analyticsController.getMarkdownRecommendations);

module.exports = router;
