const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const { ORDER_STATUS } = require('../utils/constants');

/**
 * Supermarket Executive Overview KPI Metrics
 */
const getOverview = async () => {
  const [
    orderStats,
    productCount,
    inventoryStats,
    lowStockCount,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { orderStatus: { $ne: ORDER_STATUS.CANCELLED } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTax: { $sum: '$taxTotal' },
          totalDiscount: { $sum: '$discountTotal' },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Product.countDocuments({ isActive: true }),
    Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalStockUnits: { $sum: '$totalStock' },
        },
      },
    ]),
    Inventory.countDocuments({
      $expr: { $lte: ['$totalStock', '$reorderLevel'] },
    }),
  ]);

  const stats = orderStats[0] || {
    totalRevenue: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalOrders: 0,
  };

  const totalStockUnits = inventoryStats[0]?.totalStockUnits || 0;
  const aov = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

  return {
    totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
    totalOrders: stats.totalOrders,
    averageOrderValue: Math.round(aov * 100) / 100,
    totalTaxCollected: Math.round(stats.totalTax * 100) / 100,
    totalDiscountsGiven: Math.round(stats.totalDiscount * 100) / 100,
    totalStockUnits,
    totalActiveProducts: productCount,
    lowStockAlertsCount: lowStockCount,
  };
};

/**
 * Daily Sales Time-Series for Recharts Area/Bar Chart
 */
const getSalesTrend = async (days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const rawTrend = await Order.aggregate([
    {
      $match: {
        orderStatus: { $ne: ORDER_STATUS.CANCELLED },
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const trendMap = new Map();
  rawTrend.forEach((t) => trendMap.set(t._id, t));

  // Build continuous timeline with all days represented
  const timeSeries = [];
  const curr = new Date(startDate);
  const now = new Date();

  while (curr <= now) {
    const dateKey = curr.toISOString().slice(0, 10);
    const dayData = trendMap.get(dateKey) || { revenue: 0, orders: 0 };
    timeSeries.push({
      date: dateKey,
      displayDate: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(dayData.revenue * 100) / 100,
      orders: dayData.orders,
    });
    curr.setDate(curr.getDate() + 1);
  }

  return timeSeries;
};

/**
 * Revenue and Quantity Breakdown by Category
 */
const getCategoryBreakdown = async () => {
  const categorySales = await OrderItem.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDoc',
      },
    },
    { $unwind: '$productDoc' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productDoc.categoryId',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: '$categoryDoc' },
    {
      $group: {
        _id: '$categoryDoc.name',
        revenue: { $sum: '$totalPrice' },
        unitsSold: { $sum: '$quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return categorySales.map((c) => ({
    category: c._id,
    revenue: Math.round(c.revenue * 100) / 100,
    unitsSold: c.unitsSold,
  }));
};

/**
 * Top 5 Best-Selling Products
 */
const getTopProducts = async (limit = 5) => {
  const topProducts = await OrderItem.aggregate([
    {
      $group: {
        _id: '$product',
        productName: { $first: '$name' },
        barcode: { $first: '$barcode' },
        sku: { $first: '$sku' },
        totalQuantitySold: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalPrice' },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limit },
  ]);

  return topProducts.map((p) => ({
    productId: p._id,
    name: p.productName,
    barcode: p.barcode,
    sku: p.sku,
    quantitySold: p.totalQuantitySold,
    revenue: Math.round(p.totalRevenue * 100) / 100,
  }));
};

/**
 * Sales Channel Breakdown (Online Delivery vs Cashier POS vs Self-Checkout)
 */
const getChannelBreakdown = async () => {
  const channels = await Order.aggregate([
    { $match: { orderStatus: { $ne: ORDER_STATUS.CANCELLED } } },
    {
      $group: {
        _id: '$orderType',
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
  ]);

  return channels.map((ch) => ({
    channel: ch._id,
    channelName:
      ch._id === 'online'
        ? 'Online Web Store'
        : ch._id === 'pos_walkin'
        ? 'Cashier POS Lane'
        : 'Express Self-Checkout',
    revenue: Math.round(ch.revenue * 100) / 100,
    orders: ch.orders,
  }));
};

module.exports = {
  getOverview,
  getSalesTrend,
  getCategoryBreakdown,
  getTopProducts,
  getChannelBreakdown,
};
