const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { generateInvoicePdf } = require('../services/pdfInvoiceService');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');
const { ROLES, ORDER_TYPES } = require('../utils/constants');

/**
 * Validates invoice access according to enterprise supermarket access policy:
 * - Customer: Only invoices belonging to their own orders (IDOR protection)
 * - Cashier: Invoices within authorized operational lane scope (POS walk-in, self-checkout, or assigned register)
 * - Admin: Full access permitted by administrative policy
 * - Inventory Manager & others: Denied by default
 * - Anonymous user: Strictly denied
 */
const validateInvoiceAccess = (user, order) => {
  if (!user) {
    throw AppError.unauthorized('Authentication required to access invoice');
  }

  if (user.role === ROLES.ADMIN) {
    return true;
  }

  if (user.role === ROLES.CUSTOMER) {
    const customerId = order?.customer?._id?.toString() || order?.customer?.toString();
    if (!customerId || customerId !== user._id.toString()) {
      throw AppError.forbidden('Access denied to this invoice');
    }
    return true;
  }

  if (user.role === ROLES.CASHIER) {
    const cashierId = order?.cashier?._id?.toString() || order?.cashier?.toString();
    const isAssignedCashier = cashierId && cashierId === user._id.toString();
    if (cashierId && !isAssignedCashier) {
      throw AppError.forbidden('Cashiers cannot access invoices processed by other cashiers');
    }
    if (!cashierId && order?.orderType !== ORDER_TYPES.SELF_CHECKOUT) {
      throw AppError.forbidden('Cashiers are not authorized to access invoices outside their operational lane scope');
    }
    return true;
  }

  throw AppError.forbidden(`Role '${user.role}' is not authorized to access invoices`);
};

const getInvoiceByOrderId = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ order: req.params.orderId })
      .populate('order')
      .populate('payment');

    if (!invoice) {
      throw AppError.notFound('Invoice not found for this order');
    }

    validateInvoiceAccess(req.user, invoice.order);

    return ApiResponse.success(res, {
      message: 'Invoice retrieved',
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('order')
      .populate('payment');

    if (!invoice) {
      throw AppError.notFound('Invoice record not found');
    }

    validateInvoiceAccess(req.user, invoice.order);

    return ApiResponse.success(res, {
      message: 'Invoice record retrieved',
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw AppError.notFound('Invoice record not found');
    }

    const order = await Order.findById(invoice.order);
    if (!order) {
      throw AppError.notFound('Associated order record not found for invoice');
    }

    validateInvoiceAccess(req.user, order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="NexCart-Invoice-${invoice.invoiceNumber}.pdf"`
    );

    await generateInvoicePdf(invoice, order, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoiceByOrderId,
  getInvoiceById,
  downloadInvoicePdf,
};
