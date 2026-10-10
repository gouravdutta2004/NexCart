const analyticsService = require('../services/analyticsService');
const forecastService = require('../services/forecastService');
const markdownService = require('../services/markdownService');
const ApiResponse = require('../utils/apiResponse');

const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview();
    return ApiResponse.success(res, {
      message: 'Overview KPI metrics retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesTrend = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const data = await analyticsService.getSalesTrend(days);
    return ApiResponse.success(res, {
      message: `Sales trend for last ${days} days retrieved`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await analyticsService.getCategoryBreakdown();
    return ApiResponse.success(res, {
      message: 'Category sales breakdown retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const data = await analyticsService.getTopProducts(limit);
    return ApiResponse.success(res, {
      message: 'Top-selling products retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getChannelBreakdown = async (req, res, next) => {
  try {
    const data = await analyticsService.getChannelBreakdown();
    return ApiResponse.success(res, {
      message: 'Sales channel breakdown retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDemandForecast = async (req, res, next) => {
  try {
    const data = await forecastService.getDemandForecast();
    return ApiResponse.success(res, {
      message: 'Statistical moving-average demand predictions generated',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMarkdownRecommendations = async (req, res, next) => {
  try {
    const data = await markdownService.getMarkdownRecommendations();
    return ApiResponse.success(res, {
      message: 'Smart expiry markdown recommendations generated',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getSalesTrend,
  getCategoryBreakdown,
  getTopProducts,
  getChannelBreakdown,
  getDemandForecast,
  getMarkdownRecommendations,
};
