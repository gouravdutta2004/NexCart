const User = require('../models/User');
const Order = require('../models/Order');
const AppError = require('../utils/apiError');
const { ROLES } = require('../utils/constants');
const { escapeRegex } = require('../utils/sanitize');

// 10 Loyalty Points = ₹1.00 (1 Point = ₹0.10)
const POINTS_TO_CURRENCY_RATIO = 0.10;
const MIN_REDEEM_POINTS = 50; // Minimum ₹5.00 discount
const MAX_REDEMPTION_PERCENT = 50; // Max 50% of subtotal

const TIERS = [
  { name: 'Bronze', minSpend: 0, multiplier: 1.0, perks: '1.0x Points Accrual (1% Value Back)' },
  { name: 'Silver', minSpend: 5000, multiplier: 1.25, perks: '1.25x Points Accrual + Priority Support' },
  { name: 'Gold', minSpend: 20000, multiplier: 1.5, perks: '1.5x Points Accrual + Free Home Delivery' },
  { name: 'Platinum', minSpend: 50000, multiplier: 2.0, perks: '2.0x Points Accrual + VIP Express Checkout' },
];

/**
 * Determine loyalty tier and progression based on total lifetime spend
 */
const calculateTier = (lifetimeSpend = 0) => {
  const spend = Number(lifetimeSpend) || 0;
  let currentTier = TIERS[0];

  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (spend >= TIERS[i].minSpend) {
      currentTier = TIERS[i];
      break;
    }
  }

  const currentIndex = TIERS.findIndex((t) => t.name === currentTier.name);
  const nextTier = currentIndex < TIERS.length - 1 ? TIERS[currentIndex + 1] : null;

  let progressPercentage = 100;
  let remainingSpend = 0;

  if (nextTier) {
    const tierRange = nextTier.minSpend - currentTier.minSpend;
    const progressInRange = Math.max(0, spend - currentTier.minSpend);
    progressPercentage = Math.min(100, Math.round((progressInRange / tierRange) * 100));
    remainingSpend = Math.max(0, nextTier.minSpend - spend);
  }

  return {
    tierName: currentTier.name,
    multiplier: currentTier.multiplier,
    perks: currentTier.perks,
    nextTier: nextTier ? nextTier.name : null,
    nextTierMinSpend: nextTier ? nextTier.minSpend : null,
    remainingSpend,
    progressPercentage,
  };
};

/**
 * Retrieve current customer's loyalty profile, tier status, and transaction history
 */
const getLoyaltyProfile = async (userId) => {
  const user = await User.findById(userId).select('name email phone loyaltyPoints loyaltyTier lifetimeSpend loyaltyHistory');
  if (!user) {
    throw AppError.notFound('Customer profile not found');
  }

  const tierInfo = calculateTier(user.lifetimeSpend);
  const points = Math.max(0, user.loyaltyPoints || 0);
  const currencyValue = Math.round(points * POINTS_TO_CURRENCY_RATIO * 100) / 100;

  // Sync user tier if lifetime spend moved them to a higher tier
  if (user.loyaltyTier !== tierInfo.tierName) {
    user.loyaltyTier = tierInfo.tierName;
    await user.save({ validateBeforeSave: false });
  }

  const history = (user.loyaltyHistory || [])
    .slice(-30)
    .reverse();

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    loyaltyPoints: points,
    currencyValue,
    tier: tierInfo.tierName,
    multiplier: tierInfo.multiplier,
    perks: tierInfo.perks,
    nextTier: tierInfo.nextTier,
    nextTierMinSpend: tierInfo.nextTierMinSpend,
    remainingSpend: tierInfo.remainingSpend,
    progressPercentage: tierInfo.progressPercentage,
    lifetimeSpend: user.lifetimeSpend || 0,
    allTiers: TIERS,
    history,
  };
};

/**
 * Validate and calculate discount from loyalty points redemption
 */
const calculateRedemption = async ({ userId, pointsToRedeem = 0, subtotal = 0 }) => {
  const points = Math.max(0, Math.floor(Number(pointsToRedeem) || 0));
  const orderSubtotal = Math.max(0, Number(subtotal) || 0);

  if (points === 0) {
    return {
      isValid: true,
      pointsToRedeem: 0,
      discountAmount: 0,
      currencyValue: 0,
      maxRedeemablePoints: 0,
      netSubtotal: orderSubtotal,
    };
  }

  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('Customer not found for loyalty redemption');
  }

  const availablePoints = Math.max(0, user.loyaltyPoints || 0);

  if (points > availablePoints) {
    throw AppError.badRequest(
      `Insufficient loyalty points. Requested: ${points}, Available: ${availablePoints}`
    );
  }

  if (points < MIN_REDEEM_POINTS) {
    throw AppError.badRequest(
      `Minimum ${MIN_REDEEM_POINTS} points required for redemption (worth ₹${(MIN_REDEEM_POINTS * POINTS_TO_CURRENCY_RATIO).toFixed(2)})`
    );
  }

  // Ceiling: up to MAX_REDEMPTION_PERCENT of order subtotal
  const maxAllowableDiscount = Math.round(((orderSubtotal * MAX_REDEMPTION_PERCENT) / 100) * 100) / 100;
  const maxRedeemablePoints = Math.min(
    availablePoints,
    Math.floor(maxAllowableDiscount / POINTS_TO_CURRENCY_RATIO)
  );

  const discountAmount = Math.round(points * POINTS_TO_CURRENCY_RATIO * 100) / 100;

  if (discountAmount > maxAllowableDiscount) {
    throw AppError.badRequest(
      `Points redemption cannot exceed ${MAX_REDEMPTION_PERCENT}% of order subtotal (Max: ₹${maxAllowableDiscount.toFixed(2)} or ${maxRedeemablePoints} points)`
    );
  }

  const netSubtotal = Math.max(0, Math.round((orderSubtotal - discountAmount) * 100) / 100);

  return {
    isValid: true,
    pointsToRedeem: points,
    discountAmount,
    maxRedeemablePoints,
    netSubtotal,
  };
};

/**
 * Fast customer lookup for Cashier POS lane
 */
const lookupCustomer = async (query = '') => {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw AppError.badRequest('Search query (phone, email, or name) is required');
  }

  const cleanQuery = query.trim();
  const escaped = escapeRegex(cleanQuery);
  const regex = new RegExp(escaped, 'i');

  const searchConditions = [{ email: regex }, { name: regex }, { phone: regex }];

  // Allow cashiers to type digits without worrying about spaces, parentheses, or dashes
  const digitsOnly = cleanQuery.replace(/\D/g, '');
  if (digitsOnly.length >= 4) {
    const flexiblePattern = digitsOnly.split('').join('[\\s\\-\\(\\)\\+]*');
    searchConditions.push({ phone: new RegExp(flexiblePattern, 'i') });
  }

  const users = await User.find({
    status: 'active',
    $or: searchConditions,
  })
    .select('name email phone loyaltyPoints loyaltyTier lifetimeSpend')
    .limit(10)
    .lean();

  return users.map((u) => {
    const tierInfo = calculateTier(u.lifetimeSpend);
    const points = Math.max(0, u.loyaltyPoints || 0);
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || 'N/A',
      loyaltyPoints: points,
      currencyValue: Math.round(points * POINTS_TO_CURRENCY_RATIO * 100) / 100,
      loyaltyTier: tierInfo.tierName,
      multiplier: tierInfo.multiplier,
      lifetimeSpend: u.lifetimeSpend || 0,
    };
  });
};

/**
 * Deduct redeemed points from customer account
 */
const redeemOrderPoints = async ({ userId, orderId, orderNumber, pointsToRedeem, discountAmount }) => {
  if (!userId || !pointsToRedeem || pointsToRedeem <= 0) return null;

  const user = await User.findById(userId);
  if (!user) return null;

  user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - pointsToRedeem);
  user.loyaltyHistory.push({
    points: -pointsToRedeem,
    type: 'redeemed',
    reason: `Redeemed on Order #${orderNumber} (-₹${discountAmount.toFixed(2)})`,
    orderNumber,
    orderId,
    createdAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });
  return user.loyaltyPoints;
};

/**
 * Award earned points to customer based on completed order and tier multiplier
 */
const awardOrderPoints = async ({ userId, orderId, orderNumber, netSubtotal }) => {
  if (!userId || !netSubtotal || netSubtotal <= 0) return 0;

  const user = await User.findById(userId);
  if (!user) return 0;

  const currentSpend = user.lifetimeSpend || 0;
  const newSpend = Math.round((currentSpend + netSubtotal) * 100) / 100;
  user.lifetimeSpend = newSpend;

  const tierInfo = calculateTier(newSpend);
  user.loyaltyTier = tierInfo.tierName;

  // 1 point per ₹10 * tier multiplier
  const basePoints = Math.floor(netSubtotal / 10);
  const pointsEarned = Math.max(1, Math.floor(basePoints * tierInfo.multiplier));

  user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsEarned;
  user.loyaltyHistory.push({
    points: pointsEarned,
    type: 'earned',
    reason: `Earned on Order #${orderNumber} (${tierInfo.tierName} Tier ${tierInfo.multiplier}x)`,
    orderNumber,
    orderId,
    createdAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });
  return pointsEarned;
};

/**
 * Revert loyalty points when an order is cancelled
 */
const revertOrderPoints = async (order) => {
  if (!order || !order.customer) return;

  const user = await User.findById(order.customer);
  if (!user) return;

  let modified = false;

  // 1. Refund redeemed points
  if (order.loyaltyPointsRedeemed && order.loyaltyPointsRedeemed > 0) {
    user.loyaltyPoints = (user.loyaltyPoints || 0) + order.loyaltyPointsRedeemed;
    user.loyaltyHistory.push({
      points: order.loyaltyPointsRedeemed,
      type: 'refunded',
      reason: `Refunded from cancelled Order #${order.orderNumber}`,
      orderNumber: order.orderNumber,
      orderId: order._id,
      createdAt: new Date(),
    });
    modified = true;
  }

  // 2. Claw back earned points
  if (order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0) {
    user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - order.loyaltyPointsEarned);
    user.lifetimeSpend = Math.max(0, (user.lifetimeSpend || 0) - (order.totalAmount || 0));
    const tierInfo = calculateTier(user.lifetimeSpend);
    user.loyaltyTier = tierInfo.tierName;

    user.loyaltyHistory.push({
      points: -order.loyaltyPointsEarned,
      type: 'adjusted',
      reason: `Clawed back from cancelled Order #${order.orderNumber}`,
      orderNumber: order.orderNumber,
      orderId: order._id,
      createdAt: new Date(),
    });
    modified = true;
  }

  if (modified) {
    await user.save({ validateBeforeSave: false });
  }
};

module.exports = {
  POINTS_TO_CURRENCY_RATIO,
  MIN_REDEEM_POINTS,
  MAX_REDEMPTION_PERCENT,
  calculateTier,
  getLoyaltyProfile,
  calculateRedemption,
  lookupCustomer,
  awardOrderPoints,
  redeemOrderPoints,
  revertOrderPoints,
};
