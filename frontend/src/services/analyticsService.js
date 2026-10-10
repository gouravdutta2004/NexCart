import api from './api';

const analyticsService = {
  // Executive Overview KPIs
  getOverview: async () => {
    return api.get('/analytics/overview');
  },

  // Sales time-series (for Recharts)
  getSalesTrend: async (days = 7) => {
    return api.get(`/analytics/sales-trend?days=${days}`);
  },

  // Category revenue & units distribution
  getCategoryBreakdown: async () => {
    return api.get('/analytics/category-breakdown');
  },

  // Best-selling products leaderboard
  getTopProducts: async (limit = 5) => {
    return api.get(`/analytics/top-products?limit=${limit}`);
  },

  // Sales Channel breakdown (Online vs POS vs Self-Checkout)
  getChannelBreakdown: async () => {
    return api.get('/analytics/channel-breakdown');
  },

  // Explainable Statistical Demand Forecasting
  getDemandForecast: async () => {
    return api.get('/analytics/demand-forecast');
  },

  // Smart Expiry Clearance Markdown Recommendations
  getMarkdownRecommendations: async () => {
    return api.get('/analytics/markdown-recommendations');
  },
};

export default analyticsService;
