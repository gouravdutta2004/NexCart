const PDFDocument = require('pdfkit');

/**
 * Generate a professional A4 Supermarket Tax Invoice PDF
 * @param {Object} invoice - Invoice document from DB
 * @param {Object} order - Order document
 * @param {Stream} writeStream - Destination stream (e.g., Express response)
 */
const generateInvoicePdf = (invoice, order, writeStream) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: 'NexCart Supermarket Automation',
        Subject: 'Tax Invoice & Receipt',
      },
    });

    doc.pipe(writeStream);

    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
    doc.on('error', (err) => reject(err));

    // Colors
    const primaryColor = '#0f766e'; // teal-700
    const darkSlate = '#0f172a'; // slate-900
    const textMuted = '#475569'; // slate-600
    const lightBg = '#f1f5f9'; // slate-100
    const borderLine = '#cbd5e1'; // slate-300

    // Top Brand Banner
    doc
      .rect(40, 40, 515, 6)
      .fill(primaryColor);

    doc.moveDown(0.8);

    // Header Details
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('NexCart', 40, 55, { continued: true })
      .fillColor(darkSlate)
      .text(' SUPERMARKET');

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(textMuted)
      .text('Intelligent Supermarket Automation Platform', 40, 80)
      .text('GSTIN: 27AABCN1234F1Z8 | FSSAI Lic: 11521034000123', 40, 93)
      .text('Plot 42, Tech Park Avenue, Downtown Pune, MH 411057', 40, 106)
      .text('Helpline: +91 8000-NEX-CART | support@nexcart.com', 40, 119);

    // Right-aligned Invoice Title & Meta
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(darkSlate)
      .text('TAX INVOICE', 350, 55, { align: 'right' });

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text(`Invoice #: ${invoice.invoiceNumber}`, 350, 78, { align: 'right' });

    doc
      .font('Helvetica')
      .fillColor(textMuted)
      .text(`Date: ${new Date(invoice.issuedAt || invoice.createdAt).toLocaleString('en-IN')}`, 350, 92, { align: 'right' })
      .text(`Order Ref: ${order?.orderNumber || 'N/A'}`, 350, 106, { align: 'right' })
      .text(`Payment: ${(invoice.paymentMethod || 'CARD').toUpperCase()}`, 350, 120, { align: 'right' });

    // Divider
    doc
      .strokeColor(borderLine)
      .lineWidth(0.8)
      .moveTo(40, 138)
      .lineTo(555, 138)
      .stroke();

    // Bill To & Order Info Panels
    const panelY = 148;
    doc
      .rect(40, panelY, 250, 68)
      .fill(lightBg)
      .strokeColor(borderLine)
      .stroke();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(darkSlate)
      .text('BILLED TO (CUSTOMER):', 50, panelY + 8);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(darkSlate)
      .text(invoice.customerSnapshot?.name || 'Walk-in Customer / Self-Checkout', 50, panelY + 22)
      .fillColor(textMuted)
      .text(`Email: ${invoice.customerSnapshot?.email || 'walkin@nexcart.local'}`, 50, panelY + 35)
      .text(`Phone: ${invoice.customerSnapshot?.phone || 'N/A'}`, 50, panelY + 48);

    // Right Panel: Sale Details
    doc
      .rect(305, panelY, 250, 68)
      .fill(lightBg)
      .strokeColor(borderLine)
      .stroke();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(darkSlate)
      .text('POS / TRANSACTION DETAILS:', 315, panelY + 8);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(darkSlate)
      .text(`Type: ${(order?.orderType || 'IN-STORE').toUpperCase()}`, 315, panelY + 22)
      .fillColor(textMuted)
      .text(`Terminal: ${invoice.paymentReference || 'LANE-01'}`, 315, panelY + 35)
      .text(`Status: ${(invoice.status || 'PAID').toUpperCase()}`, 315, panelY + 48);

    // Item Table Header
    const tableTop = 230;
    doc
      .rect(40, tableTop, 515, 20)
      .fill(primaryColor);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('#', 45, tableTop + 5, { width: 25 })
      .text('ITEM DESCRIPTION', 75, tableTop + 5, { width: 200 })
      .text('SKU / BARCODE', 280, tableTop + 5, { width: 90 })
      .text('QTY', 375, tableTop + 5, { width: 35, align: 'center' })
      .text('RATE (Rs)', 415, tableTop + 5, { width: 60, align: 'right' })
      .text('AMOUNT (Rs)', 480, tableTop + 5, { width: 70, align: 'right' });

    // Table Rows
    let currentY = tableTop + 24;
    const items = invoice.itemsSnapshot || [];

    items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        doc.rect(40, currentY - 3, 515, 18).fill('#f8fafc');
      }

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(darkSlate)
        .text((index + 1).toString(), 45, currentY, { width: 25 })
        .text(item.name || 'Product', 75, currentY, { width: 200, ellipsis: true })
        .fillColor(textMuted)
        .text(item.barcode || item.sku || '-', 280, currentY, { width: 90 })
        .fillColor(darkSlate)
        .text(item.quantity.toString(), 375, currentY, { width: 35, align: 'center' })
        .text(item.unitPrice.toFixed(2), 415, currentY, { width: 60, align: 'right' })
        .font('Helvetica-Bold')
        .text(item.totalPrice.toFixed(2), 480, currentY, { width: 70, align: 'right' });

      currentY += 18;
    });

    // Table Bottom Line
    doc
      .strokeColor(borderLine)
      .lineWidth(0.8)
      .moveTo(40, currentY + 4)
      .lineTo(555, currentY + 4)
      .stroke();

    currentY += 12;

    // Summary Box (Right aligned)
    const summaryX = 330;
    const summaryWidth = 225;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(darkSlate)
      .text('Subtotal:', summaryX, currentY)
      .text(`Rs. ${invoice.subtotal.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: 'right' });

    currentY += 15;

    if (invoice.discountTotal > 0) {
      doc
        .fillColor('#dc2626')
        .text('Discount Applied:', summaryX, currentY)
        .text(`- Rs. ${invoice.discountTotal.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
      currentY += 15;
    }

    doc
      .fillColor(textMuted)
      .text(`CGST (Intra-state ${(invoice.taxBreakdown?.totalTax ? '2.5%' : '0%')}):`, summaryX, currentY)
      .text(`Rs. ${(invoice.taxBreakdown?.cgst || 0).toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: 'right' });

    currentY += 15;

    doc
      .text(`SGST (Intra-state ${(invoice.taxBreakdown?.totalTax ? '2.5%' : '0%')}):`, summaryX, currentY)
      .text(`Rs. ${(invoice.taxBreakdown?.sgst || 0).toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: 'right' });

    currentY += 18;

    // Grand Total Highlight Box
    doc
      .rect(summaryX - 10, currentY - 5, summaryWidth + 15, 26)
      .fill(primaryColor);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('GRAND TOTAL:', summaryX, currentY + 2)
      .text(`Rs. ${invoice.grandTotal.toFixed(2)}`, summaryX, currentY + 2, { width: summaryWidth, align: 'right' });

    currentY += 38;

    // Left Box: Payment Note & Terms
    const notesY = Math.max(currentY - 60, 480);
    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor(darkSlate)
      .text('DECLARATION & TERMS:', 40, notesY);

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(textMuted)
      .text('1. All items are inclusive of applicable GST laws in India.', 40, notesY + 12)
      .text('2. Return & replacement window is valid for 7 days against original digital invoice.', 40, notesY + 22)
      .text('3. Perishable grocery & dairy items are subject to in-store inspection upon purchase.', 40, notesY + 32)
      .text('4. This is a computer-authenticated digital invoice and requires no physical signature.', 40, notesY + 42);

    // Barcode Simulation at bottom
    const barcodeY = 700;
    doc
      .rect(40, barcodeY, 515, 45)
      .fill(lightBg)
      .strokeColor(borderLine)
      .stroke();

    doc
      .fontSize(14)
      .font('Courier-Bold')
      .fillColor(darkSlate)
      .text(`*${invoice.invoiceNumber}*`, 40, barcodeY + 10, { align: 'center', characterSpacing: 4 });

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(textMuted)
      .text('THANK YOU FOR SHOPPING AT NEXCART SUPERMARKET!', 40, barcodeY + 28, { align: 'center' });

    doc.end();
  });
};

module.exports = {
  generateInvoicePdf,
};
