import api from './api';

const discountService = {
  getAllDiscounts: async () => {
    return api.get('/discounts');
  },

  createDiscount: async (discountData) => {
    return api.post('/discounts', discountData);
  },

  validateCoupon: async (code, orderSubtotal) => {
    return api.post('/discounts/validate', { code, orderSubtotal });
  },

  toggleDiscountStatus: async (id) => {
    return api.patch(`/discounts/${id}/toggle`);
  },
};

export default discountService;
