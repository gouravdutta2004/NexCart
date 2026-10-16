const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const supplierRoutes = require('./supplierRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const cartRoutes = require('./cartRoutes');
const reviewRoutes = require('./reviewRoutes');
const posRoutes = require('./posRoutes');
const orderRoutes = require('./orderRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const discountRoutes = require('./discountRoutes');
const auditRoutes = require('./auditRoutes');
const userRoutes = require('./userRoutes');
const loyaltyRoutes = require('./loyaltyRoutes');

// Mount route modules
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/cart', cartRoutes);
router.use('/reviews', reviewRoutes);
router.use('/pos', posRoutes);
router.use('/orders', orderRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/discounts', discountRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/users', userRoutes);
router.use('/loyalty', loyaltyRoutes);

// Standardized health check endpoint
const { getDBStatus } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  return ApiResponse.success(res, {
    message: 'NexCart System is Operational',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    },
  });
});

module.exports = router;
