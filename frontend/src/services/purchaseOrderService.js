import api from './api';

export const purchaseOrderService = {
  getPurchaseOrders: async () => {
    const response = await api.get('/purchase-orders');
    return response.data;
  },

  getPurchaseOrderById: async (id) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  createPurchaseOrder: async (poData) => {
    const response = await api.post('/purchase-orders', poData);
    return response.data;
  },

  receivePurchaseOrder: async (id) => {
    const response = await api.patch(`/purchase-orders/${id}/receive`);
    return response.data;
  },

  cancelPurchaseOrder: async (id, reason = '') => {
    const response = await api.patch(`/purchase-orders/${id}/cancel`, { reason });
    return response.data;
  },
};

export default purchaseOrderService;
