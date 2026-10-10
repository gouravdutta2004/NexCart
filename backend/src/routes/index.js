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

module.exports = router;
