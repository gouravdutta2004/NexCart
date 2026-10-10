/**
 * Currency, Date, and Number Formatting Utilities
 */

export const formatCurrency = (amount, currency = 'INR') => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
};

export const formatDateTime = (dateString) => {
  return formatDate(dateString, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatBarcode = (barcode) => {
  if (!barcode) return 'N/A';
  return barcode.toString().trim();
};
