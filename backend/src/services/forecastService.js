const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

/**
 * Statistical 7-Day Moving-Average Demand Forecast Engine
 * Calculates true 7-day velocity, window-over-window trends, and replenishment thresholds.
 * Explainable, transparent mathematical modeling without false AI claims.
 */
const getDemandForecast = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Fetch all active products
  const products = await Product.find({ isActive: true }).populate('categoryId', 'name').lean();
  const productIds = products.map((p) => p._id);

  // 2. Fetch inventory on-hand
  const inventories = await Inventory.find({ productId: { $in: productIds } }).lean();
  const inventoryMap = new Map();
  inventories.forEach((inv) => inventoryMap.set(inv.productId.toString(), inv.totalStock));

  // 3. Aggregate true sales within the last 7 days (Window 1: T-7 to T-0)
  const recent7DaysSales = await OrderItem.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: '$product',
        unitsSold7d: { $sum: '$quantity' },
        revenue7d: { $sum: '$totalPrice' },
        orderCount7d: { $sum: 1 },
      },
    },
  ]);
  const recentSalesMap = new Map();
  recent7DaysSales.forEach((sa) => recentSalesMap.set(sa._id.toString(), sa));

  // 4. Aggregate prior 7 days sales (Window 2: T-14 to T-7) for trend comparison
  const prior7DaysSales = await OrderItem.aggregate([
    { $match: { createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
    {
      $group: {
        _id: '$product',
        unitsSoldPrior7d: { $sum: '$quantity' },
      },
    },
  ]);
  const priorSalesMap = new Map();
  prior7DaysSales.forEach((sa) => priorSalesMap.set(sa._id.toString(), sa));

  // 5. Aggregate lifetime sales per product for historical fallback
  const lifetimeSales = await OrderItem.aggregate([
    {
      $group: {
        _id: '$product',
        totalUnitsSold: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 },
        firstSaleDate: { $min: '$createdAt' },
        lastSaleDate: { $max: '$createdAt' },
      },
    },
  ]);
  const lifetimeMap = new Map();
  lifetimeSales.forEach((sa) => lifetimeMap.set(sa._id.toString(), sa));

  // 6. Compute forecast projections for each product
  const forecasts = products.map((prod) => {
    const pId = prod._id.toString();
    const currentStock = inventoryMap.get(pId) || 0;
    const recent = recentSalesMap.get(pId) || { unitsSold7d: 0, revenue7d: 0, orderCount7d: 0 };
    const prior = priorSalesMap.get(pId) || { unitsSoldPrior7d: 0 };
    const lifetime = lifetimeMap.get(pId) || { totalUnitsSold: 0, totalRevenue: 0, orderCount: 0 };

    const units7d = recent.unitsSold7d || 0;
    const priorUnits7d = prior.unitsSoldPrior7d || 0;
    const totalUnitsSold = lifetime.totalUnitsSold || 0;

    // Daily sales velocity calculation:
    // If recent 7-day sales exist, velocity = actual units / 7.
    // If no sales in last 7 days but lifetime sales exist, use smoothed lifetime velocity.
    // Otherwise fallback to initial baseline (0.2 units/day).
    let dailyVelocity = 0.2;
    let velocityBasis = 'baseline';

    if (units7d > 0) {
      dailyVelocity = Math.round((units7d / 7) * 100) / 100;
      velocityBasis = 'actual_7day_window';
    } else if (totalUnitsSold > 0) {
      dailyVelocity = Math.max(0.1, Math.round((totalUnitsSold / 30) * 100) / 100);
      velocityBasis = 'smoothed_historical_30day';
    }

    // Trend direction factor based on Window 1 vs Window 2 comparison
    let trendDirection = 'stable';
    let trendMultiplier = 1.0;

    if (priorUnits7d > 0 && units7d > 0) {
      const growthRatio = units7d / priorUnits7d;
      if (growthRatio >= 1.2) {
        trendDirection = 'accelerating';
        trendMultiplier = 1.15; // +15% forecast adjustment
      } else if (growthRatio <= 0.8) {
        trendDirection = 'decelerating';
        trendMultiplier = 0.85; // -15% forecast adjustment
      } else {
        trendDirection = 'stable';
        trendMultiplier = 1.0;
      }
    } else if (units7d > 0 && priorUnits7d === 0) {
      trendDirection = 'accelerating';
      trendMultiplier = 1.1;
    } else if (units7d === 0 && priorUnits7d > 0) {
      trendDirection = 'decelerating';
      trendMultiplier = 0.8;
    } else if (units7d === 0 && totalUnitsSold === 0) {
      trendDirection = 'slow_moving';
      trendMultiplier = 0.95;
    }

    // 7-day projected demand
    const projected7DayDemand = Math.max(1, Math.ceil(7 * dailyVelocity * trendMultiplier));

    // 14-day projected demand
    const projected14DayDemand = Math.ceil(projected7DayDemand * 2);

    // Recommended safety stock (25% buffer)
    const recommendedSafetyStock = Math.ceil(projected7DayDemand * 0.25);

    // Target replenishment stock = 14-day demand + safety stock
    const targetInventoryLevel = projected14DayDemand + recommendedSafetyStock;

    // Days of inventory remaining on shelf
    const daysOfStockRemaining =
      dailyVelocity > 0 ? Math.round((currentStock / dailyVelocity) * 10) / 10 : 99;

    // Reorder urgency
    let replenishmentUrgency = 'healthy';
    let suggestedReorderQty = 0;

    if (currentStock <= recommendedSafetyStock) {
      replenishmentUrgency = 'critical';
      suggestedReorderQty = Math.max(0, targetInventoryLevel - currentStock);
    } else if (currentStock <= projected7DayDemand) {
      replenishmentUrgency = 'reorder_soon';
      suggestedReorderQty = Math.max(0, targetInventoryLevel - currentStock);
    }

    return {
      productId: prod._id,
      productName: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      category: prod.categoryId?.name || 'General',
      currentStock,
      recent7DaySold: units7d,
      prior7DaySold: priorUnits7d,
      historicalTotalSold: totalUnitsSold,
      dailySalesVelocity: dailyVelocity,
      velocityBasis,
      trendDirection,
      projected7DayDemand,
      projected14DayDemand,
      recommendedSafetyStock,
      daysOfStockRemaining,
      replenishmentUrgency,
      suggestedReorderQty,
      explainability: {
        model: 'Recent 7-Day Sales Velocity with Comparative Trend Multiplier',
        calculation: `Velocity (${dailyVelocity} units/day [${velocityBasis}]) * 7 days * trend (${trendMultiplier}x) = ${projected7DayDemand} units`,
        stockStatus:
          currentStock <= projected7DayDemand
            ? `At velocity of ${dailyVelocity} units/day, current stock (${currentStock} units) will deplete in ~${daysOfStockRemaining} days. Recommended replenishment: ${suggestedReorderQty} units.`
            : `Stock level of ${currentStock} units is sufficient for ${daysOfStockRemaining} days of normal demand.`,
      },
    };
  });

  // Sort by urgency (critical reorders first)
  const urgencyWeight = { critical: 3, reorder_soon: 2, healthy: 1 };
  forecasts.sort(
    (a, b) => urgencyWeight[b.replenishmentUrgency] - urgencyWeight[a.replenishmentUrgency]
  );

  return {
    forecastWindowDays: 7,
    windowStart: sevenDaysAgo.toISOString(),
    windowEnd: now.toISOString(),
    criticalRestockCount: forecasts.filter((f) => f.replenishmentUrgency === 'critical').length,
    reorderSoonCount: forecasts.filter((f) => f.replenishmentUrgency === 'reorder_soon').length,
    forecasts,
  };
};

module.exports = {
  getDemandForecast,
};
