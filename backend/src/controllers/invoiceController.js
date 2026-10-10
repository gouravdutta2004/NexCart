const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { generateInvoicePdf } = require('../services/pdfInvoiceService');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');
const { ROLES } = require('../utils/constants');

const getInvoiceByOrderId = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ order: req.params.orderId })
      .populate('order')
      .populate('payment');

    if (!invoice) {
      throw AppError.notFound('Invoice not found for this order');
    }

    // Customer can only access their own invoice
    if (
      req.user.role === ROLES.CUSTOMER &&
      invoice.order?.customer?.toString() !== req.user._id.toString()
    ) {
      throw AppError.forbidden('Access denied to this invoice');
    }

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

    if (
      req.user.role === ROLES.CUSTOMER &&
      invoice.order?.customer?.toString() !== req.user._id.toString()
    ) {
      throw AppError.forbidden('Access denied to this invoice');
    }

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

    // If authenticated customer, verify ownership
    if (
      req.user &&
      req.user.role === ROLES.CUSTOMER &&
      order?.customer?.toString() !== req.user._id.toString()
    ) {
      throw AppError.forbidden('Access denied to this invoice');
    }

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
