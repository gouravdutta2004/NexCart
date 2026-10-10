import api from './api';

export const posService = {
  lookupBarcode: async (barcode) => {
    const response = await api.get(`/pos/barcode/${barcode}`);
    return response.data;
  },

  holdCart: async ({ items, customerName, notes }) => {
    const response = await api.post('/pos/hold', { items, customerName, notes });
    return response.data;
  },

  getHeldCarts: async () => {
    const response = await api.get('/pos/held');
    return response.data;
  },

  recallCart: async (id) => {
    const response = await api.delete(`/pos/held/${id}`);
    return response.data;
  },

  validateCheckout: async (items) => {
    const response = await api.post('/pos/validate', { items });
    return response.data;
  },
};

export default posService;
