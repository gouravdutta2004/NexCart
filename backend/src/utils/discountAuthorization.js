const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('./apiError');
const { ROLES } = require('./constants');

const MAX_CASHIER_DISCOUNT_PERCENT = 20;

/**
 * Validate that a manager override is authentic and not forged
 * Requires a cryptographically signed JWT token belonging to an Admin or Inventory Manager
 */
function verifyManagerOverride(managerOverride) {
  if (!managerOverride) {
    throw AppError.forbidden(
      'Manager override validation failed: Manager authorization is required for discounts exceeding cashier ceiling.'
    );
  }

  let token = null;
  if (typeof managerOverride === 'string') {
    token = managerOverride.trim();
  } else if (typeof managerOverride === 'object') {
    token = managerOverride.token || managerOverride.managerToken || managerOverride.authorizationToken;
  }

  if (!token || typeof token !== 'string') {
    throw AppError.forbidden(
      'Forged manager override rejected: A cryptographically signed manager token is required to approve discretionary discounts.'
    );
  }

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();

  try {
    const decoded = jwt.verify(cleanToken, config.JWT_SECRET);
    if (!decoded || (decoded.role !== ROLES.ADMIN && decoded.role !== ROLES.INVENTORY_MANAGER)) {
      throw AppError.forbidden(
        `Manager override rejected: Approving account must have '${ROLES.ADMIN}' or '${ROLES.INVENTORY_MANAGER}' role.`
      );
    }
    return {
      isValid: true,
      approverId: decoded.id,
      approverRole: decoded.role,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.forbidden(`Manager override rejected: Invalid or expired manager token (${err.message})`);
  }
}

/**
 * Standardized Discount Authorization Engine
 * Single source of truth for POS Held Carts, Recalled Carts, Pre-Checkout Validation, and Final Order Placement.
 *
 * Rules:
 * 1. Discount must be non-negative and cannot exceed gross line total.
 * 2. Customer or anonymous shoppers cannot apply manual line discounts (must use approved coupons).
 * 3. Cashier role is strictly limited to 20% discretionary discount ceiling per line item.
 * 4. Manager override authorizes cashier discounts exceeding 20% (up to line gross), verified by signed token.
 * 5. Administrators and Inventory Managers have full override authority up to line gross.
 */
function validateLineDiscount({
  user = null,
  lineGross = 0,
  requestedDiscount = 0,
  productName = 'Item',
  managerOverride = null,
}) {
  const discount = Number(requestedDiscount) || 0;

  if (discount < 0) {
    throw AppError.badRequest(`Discount for '${productName}' cannot be negative`);
  }

  if (discount === 0) {
    return 0;
  }

  // 1. Discount cannot exceed gross line total
  if (discount > lineGross) {
    throw AppError.badRequest(
      `Discount for '${productName}' cannot exceed line total (₹${lineGross.toFixed(2)})`
    );
  }

  // 2. Customer or anonymous user cannot apply manual line discounts
  if (!user || user.role === ROLES.CUSTOMER) {
    throw AppError.forbidden(
      `Manual line discounts are not permitted for customer or public self-checkout sessions. Use promotional coupons.`
    );
  }

  // 3. Admin and Inventory Manager have inherent authorization
  if (user.role === ROLES.ADMIN || user.role === ROLES.INVENTORY_MANAGER) {
    return Number(discount.toFixed(2));
  }

  // 4. Cashier role: 20% ceiling unless authorized by cryptographically verified manager override
  if (user.role === ROLES.CASHIER) {
    const maxCashierDiscount = Number(((lineGross * MAX_CASHIER_DISCOUNT_PERCENT) / 100).toFixed(2));

    if (discount > maxCashierDiscount) {
      if (!managerOverride) {
        throw AppError.badRequest(
          `Unauthorized discount: Cashier role is not permitted to apply discounts exceeding ${MAX_CASHIER_DISCOUNT_PERCENT}% (₹${maxCashierDiscount.toFixed(2)}) for '${productName}' without manager/admin authorization`
        );
      }
      // Cryptographically verify manager authorization token to prevent forged approvals
      verifyManagerOverride(managerOverride);
    }

    return Number(discount.toFixed(2));
  }

  throw AppError.forbidden(`Role '${user.role}' is not authorized to grant discounts`);
}

module.exports = {
  MAX_CASHIER_DISCOUNT_PERCENT,
  validateLineDiscount,
  verifyManagerOverride,
};
