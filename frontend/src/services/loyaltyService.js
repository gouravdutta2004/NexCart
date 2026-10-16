import api from './api';

const loyaltyService = {
  getMyProfile: async () => {
    return api.get('/loyalty/me');
  },

  lookupCustomer: async (query) => {
    return api.get(`/loyalty/lookup?query=${encodeURIComponent(query)}`);
  },

  calculateRedemption: async ({ pointsToRedeem, subtotal, customerId }) => {
    return api.post('/loyalty/calculate-redemption', {
      pointsToRedeem,
      subtotal,
      customerId,
    });
  },
};

export default loyaltyService;
