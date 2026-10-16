const loyaltyService = require('../services/loyaltyService');
const ApiResponse = require('../utils/apiResponse');

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await loyaltyService.getLoyaltyProfile(req.user._id);
    return ApiResponse.success(res, {
      message: 'Loyalty rewards profile retrieved',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const calculateRedemption = async (req, res, next) => {
  try {
    const { pointsToRedeem, subtotal, customerId } = req.body;
    const targetUserId = customerId || req.user._id;
    const calculation = await loyaltyService.calculateRedemption({
      userId: targetUserId,
      pointsToRedeem,
      subtotal,
    });
    return ApiResponse.success(res, {
      message: 'Loyalty redemption calculated successfully',
      data: calculation,
    });
  } catch (error) {
    next(error);
  }
};

const lookupCustomer = async (req, res, next) => {
  try {
    const query = req.query.query || req.query.q || '';
    const customers = await loyaltyService.lookupCustomer(query);
    return ApiResponse.success(res, {
      message: `Found ${customers.length} matching customer(s)`,
      data: { customers },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  calculateRedemption,
  lookupCustomer,
};
