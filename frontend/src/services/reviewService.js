import api from './api';

export const reviewService = {
  getProductReviews: async (productId) => {
    const response = await api.get(`/reviews/product/${productId}`);
    return response.data;
  },

  addReview: async ({ productId, rating, comment }) => {
    const response = await api.post('/reviews', { productId, rating, comment });
    return response.data;
  },

  createReview: async ({ productId, rating, comment }) => {
    const response = await api.post('/reviews', { productId, rating, comment });
    return response.data;
  },
};

export default reviewService;
