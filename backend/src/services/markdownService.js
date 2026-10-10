const inventoryService = require('./inventoryService');

/**
 * Smart Discount Recommendation Engine for Products Approaching Expiry
 * Calculates explainable, configurable markdown percentages to accelerate sell-through.
 */
const getMarkdownRecommendations = async () => {
  const alerts = await inventoryService.getExpiryAlerts();

  const recommendations = alerts.map((item) => {
    let recommendedDiscount = 0;
    let strategy = '';
    let priority = 'low';

    if (item.daysRemaining <= 0) {
      recommendedDiscount = 0; // Perished: Must be quarantined/discarded, not sold
      strategy = 'QUARANTINE_DISCARD';
      priority = 'critical';
    } else if (item.daysRemaining <= 3) {
      recommendedDiscount = 50; // 50% Flash Clearance
      strategy = 'EMERGENCY_CLEARANCE_50';
      priority = 'critical';
    } else if (item.daysRemaining <= 7) {
      recommendedDiscount = 35; // 35% Deep Markdown
      strategy = 'EXPEDITE_SELLTHROUGH_35';
      priority = 'high';
    } else if (item.daysRemaining <= 15) {
      recommendedDiscount = 20; // 20% Mid Markdown
      strategy = 'DYNAMIC_MARKDOWN_20';
      priority = 'medium';
    } else if (item.daysRemaining <= 30) {
      recommendedDiscount = 10; // 10% Early Incentive
      strategy = 'PROMOTIONAL_INCENTIVE_10';
      priority = 'low';
    }

    const originalPrice = Number(item.sellingPrice) || 0;
    const discountAmount = Math.round(((originalPrice * recommendedDiscount) / 100) * 100) / 100;
    const recommendedPrice = Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100);
    const potentialWasteValue = Math.round(originalPrice * item.batchQuantity * 100) / 100;

    return {
      inventoryId: item.inventoryId,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      barcode: item.barcode,
      brand: item.brand,
      batchNumber: item.batchNumber,
      batchQuantity: item.batchQuantity,
      expiryDate: item.expiryDate,
      daysRemaining: item.daysRemaining,
      originalPrice,
      recommendedDiscountPercentage: recommendedDiscount,
      discountAmount,
      recommendedPrice,
      strategy,
      priority,
      potentialWasteValue,
      explanation: item.daysRemaining <= 0
        ? 'Batch has surpassed expiration threshold. Do not sell; quarantine for bio-safe disposal.'
        : `Product expires in ${item.daysRemaining} days. Applying a ${recommendedDiscount}% promotional markdown accelerates inventory sell-through before expiration, recovering up to Rs. ${(recommendedPrice * item.batchQuantity).toFixed(2)} in revenue.`,
    };
  });

  return {
    totalFlaggedBatches: recommendations.length,
    criticalClearanceCount: recommendations.filter((r) => r.priority === 'critical').length,
    highMarkdownCount: recommendations.filter((r) => r.priority === 'high').length,
    potentialRecoverableRevenue: Math.round(
      recommendations.reduce((sum, r) => sum + r.recommendedPrice * r.batchQuantity, 0) * 100
    ) / 100,
    recommendations,
  };
};

module.exports = {
  getMarkdownRecommendations,
};
