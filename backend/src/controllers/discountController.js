const Discount = require('../models/Discount');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');
const { AUDIT_MODULES } = require('../utils/constants');

const getAllDiscounts = async (req, res, next) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    return ApiResponse.success(res, {
      message: 'Discounts list retrieved',
      data: { discounts },
    });
  } catch (error) {
    next(error);
  }
};

const createDiscount = async (req, res, next) => {
  try {
    const { code, title, discountType, discountValue, endDate, minPurchaseAmount } = req.body;

    if (!code || !title || !discountValue || !endDate) {
      throw AppError.badRequest('Code, title, discount value, and end date are required');
    }

    const existing = await Discount.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw AppError.badRequest(`Discount code '${code.toUpperCase()}' already exists`);
    }

    const discount = await Discount.create({
      code: code.toUpperCase(),
      title,
      description: req.body.description || '',
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      endDate: new Date(endDate),
      usageLimit: Number(req.body.usageLimit) || 1000,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'DISCOUNT_CREATED',
      module: AUDIT_MODULES.DISCOUNTS,
      recordId: discount._id.toString(),
      newState: discount.toObject(),
      notes: `Discount rule ${discount.code} created (${discount.discountValue}% / Rs)`,
    });

    return ApiResponse.created(res, {
      message: `Discount '${discount.code}' created successfully`,
      data: { discount },
    });
  } catch (error) {
    next(error);
  }
};

const validateDiscountCode = async (req, res, next) => {
  try {
    const { code, orderSubtotal = 0 } = req.body;
    if (!code) {
      throw AppError.badRequest('Please enter a coupon code');
    }

    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      isActive: true,
      endDate: { $gte: new Date() },
    });

    if (!discount) {
      throw AppError.notFound(`Coupon code '${code.toUpperCase()}' is invalid or expired`);
    }

    if (discount.usedCount >= discount.usageLimit) {
      throw AppError.badRequest(`Coupon code '${discount.code}' has reached maximum usage limit`);
    }

    if (orderSubtotal < discount.minPurchaseAmount) {
      throw AppError.badRequest(
        `Minimum order amount of Rs. ${discount.minPurchaseAmount} required for this coupon`
      );
    }

    let calculatedDiscount = 0;
    if (discount.discountType === 'percentage') {
      calculatedDiscount = (orderSubtotal * discount.discountValue) / 100;
      if (discount.maxDiscountAmount) {
        calculatedDiscount = Math.min(calculatedDiscount, discount.maxDiscountAmount);
      }
    } else {
      calculatedDiscount = discount.discountValue;
    }

    calculatedDiscount = Math.min(calculatedDiscount, orderSubtotal);

    return ApiResponse.success(res, {
      message: `Coupon '${discount.code}' applied successfully`,
      data: {
        discountId: discount._id,
        code: discount.code,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

const toggleDiscountStatus = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      throw AppError.notFound('Discount rule not found');
    }

    discount.isActive = !discount.isActive;
    await discount.save();

    return ApiResponse.success(res, {
      message: `Discount status updated to ${discount.isActive ? 'Active' : 'Inactive'}`,
      data: { discount },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDiscounts,
  createDiscount,
  validateDiscountCode,
  toggleDiscountStatus,
};
