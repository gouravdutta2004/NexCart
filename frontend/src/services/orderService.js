import api from './api';

const orderService = {
  // Create order (Customer online, Cashier POS, or Self-checkout)
  createOrder: async (orderPayload) => {
    return api.post('/orders', orderPayload);
  },

  // Get current logged-in customer's orders
  getMyOrders: async (page = 1, limit = 10) => {
    return api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
  },

  // Get order by ID
  getOrderById: async (id) => {
    return api.get(`/orders/${id}`);
  },

  // Supermarket-wide orders list (Cashier / Admin)
  getAllOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/orders?${query}`);
  },

  // Update order status (Admin)
  updateOrderStatus: async (id, status) => {
    return api.patch(`/orders/${id}/status`, { status });
  },

  // Get invoice details by order ID
  getInvoiceByOrderId: async (orderId) => {
    return api.get(`/invoices/order/${orderId}`);
  },

  // Download invoice PDF securely via authenticated Axios Blob stream (No JWT in URL)
  downloadInvoicePdf: async (invoiceId, invoiceNumber = '') => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `NexCart-Invoice-${invoiceNumber || invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
      return { success: true };
    } catch (error) {
      console.error('Failed to download invoice PDF:', error);
      throw error;
    }
  },

  // Legacy helper redirected to authenticated blob download
  getInvoicePdfUrl: (invoiceId) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseURL}/invoices/${invoiceId}/pdf`;
  },
};

export default orderService;
