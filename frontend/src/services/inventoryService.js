import api from './api';

export const inventoryService = {
  getOverview: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  getProductInventory: async (productId) => {
    const response = await api.get(`/inventory/product/${productId}`);
    return response.data;
  },

  getLowStockAlerts: async () => {
    const response = await api.get('/inventory/alerts/low-stock');
    return response.data;
  },

  getExpiryAlerts: async (days = 30) => {
    const response = await api.get('/inventory/alerts/expiring', { params: { days } });
    return response.data;
  },

  adjustStock: async ({ productId, newQuantity, reason }) => {
    const response = await api.post('/inventory/adjust', { productId, newQuantity, reason });
    return response.data;
  },
};

export default inventoryService;
