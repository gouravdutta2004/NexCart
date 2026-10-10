import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import analyticsService from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Package,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendDays, setTrendDays] = useState(7);
  const [categoryData, setCategoryData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [demandForecast, setDemandForecast] = useState(null);
  const [markdowns, setMarkdowns] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'forecast' | 'markdowns'

  useEffect(() => {
    loadAllAnalytics();
  }, [trendDays]);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        trendRes,
        categoryRes,
        channelRes,
        topProdRes,
        forecastRes,
        markdownRes,
      ] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getSalesTrend(trendDays),
        analyticsService.getCategoryBreakdown(),
        analyticsService.getChannelBreakdown(),
        analyticsService.getTopProducts(5),
        analyticsService.getDemandForecast(),
        analyticsService.getMarkdownRecommendations(),
      ]);

      setOverview(overviewRes.data);
      setTrendData(trendRes.data || []);
      setCategoryData(categoryRes.data || []);
      setChannelData(channelRes.data || []);
      setTopProducts(topProdRes.data || []);
      setDemandForecast(forecastRes.data);
      setMarkdowns(markdownRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadAllAnalytics();
  };

  const tooltipStyle = {
    backgroundColor: isDark ? '#090d16' : '#ffffff',
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold uppercase tracking-wider">
                Business Intelligence Engine
              </span>
              <span className="text-slate-500 text-xs font-mono">Live MongoDB Aggregation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Supermarket Analytics & Automation
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Sales performance, multi-channel distribution, statistical demand forecasting & expiry markdown radar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleManualRefresh}
              disabled={refreshing}
              variant="secondary"
              size="sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            {user?.role === 'inventory_manager' ? (
              <Link to="/inventory">
                <Button variant="primary" size="sm" className="shadow-md">
                  Inventory Hub →
                </Button>
              </Link>
            ) : (
              <Link to="/admin/orders">
                <Button variant="primary" size="sm" className="shadow-md">
                  Fulfillment Hub →
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Sales Performance & Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'forecast'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            Demand Forecast & Replenishment
            {demandForecast?.criticalRestockCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] flex items-center justify-center font-bold">
                {demandForecast.criticalRestockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('markdowns')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'markdowns'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            Smart Expiry Markdown Radar
            {markdowns?.totalFlaggedBatches > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] flex items-center justify-center font-bold">
                {markdowns.totalFlaggedBatches}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400">Aggregating real-time transactions & warehouse telemetry...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW & SALES */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Revenue</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(overview?.totalRevenue || 0)}
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      All transactions recorded
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Completed Orders</span>
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {overview?.totalOrders || 0} Orders
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Online + POS + Self-Checkout
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
                      <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(overview?.averageOrderValue || 0)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Mean basket size per checkout
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Warehouse Inventory</span>
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {overview?.totalStockUnits || 0} Units
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Across {overview?.totalActiveProducts || 0} active products
                    </p>
                  </div>
                </div>

                {/* Sales Trend Chart */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Revenue & Sales Velocity
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Daily gross revenue and order frequency
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      {[7, 14, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTrendDays(d)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            trendDays === d
                              ? 'bg-emerald-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {d} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#revenueGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category & Channel Breakdown Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Category Breakdown */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Revenue by Supermarket Department
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                        Product category sales distribution
                      </p>

                      {categoryData.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                          No category sales recorded yet
                        </div>
                      ) : (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryData}
                                dataKey="revenue"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={4}
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(val) => [formatCurrency(Number(val)), 'Sales']}
                              />
                              <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Channel Breakdown */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Sales Channel Contribution
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                        Online Web Store vs Cashier POS vs Express Self-Checkout
                      </p>

                      <div className="space-y-4">
                        {channelData.map((ch, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{ch.channelName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ch.orders} completed checkouts</div>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {formatCurrency(ch.revenue)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Products Leaderboard */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Top-Selling Products Leaderboard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    Ranked by total quantity dispatched and gross sales
                  </p>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-5 py-3">Rank & Product</th>
                          <th className="px-5 py-3">SKU / Barcode</th>
                          <th className="px-5 py-3">Units Sold</th>
                          <th className="px-5 py-3 text-right">Gross Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {topProducts.map((p, idx) => (
                          <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">{p.barcode || p.sku}</td>
                            <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{p.quantitySold} units</td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DEMAND FORECAST & REPLENISHMENT */}
            {activeTab === 'forecast' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-blue-50 dark:bg-gradient-to-r dark:from-blue-950/60 dark:to-slate-900 border border-blue-200 dark:border-blue-800/40 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        Statistical Demand Prediction Engine
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        NexCart utilizes explainable time-series moving averages and sales trend multipliers to forecast 7-day consumer demand. It dynamically calculates recommended safety stock buffers to eliminate stock-outs without holding excess capital.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">On-Hand Stock</th>
                          <th className="px-6 py-4">Daily Velocity</th>
                          <th className="px-6 py-4">7-Day Projected</th>
                          <th className="px-6 py-4">Safety Buffer</th>
                          <th className="px-6 py-4">Urgency & Suggestion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {demandForecast?.forecasts?.map((f) => (
                          <tr key={f.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{f.productName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {f.category} • SKU: {f.sku}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                                {f.currentStock} units
                              </span>
                              <div className="text-[10px] text-slate-400">
                                ~{f.daysOfStockRemaining} days left
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{f.dailySalesVelocity} units/day</span>
                              <span className={`block text-[10px] uppercase font-bold mt-0.5 ${
                                f.trendDirection === 'accelerating' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                              }`}>
                                {f.trendDirection}
                              </span>
                            </td>

                            <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                              {f.projected7DayDemand} units
                            </td>

                            <td className="px-6 py-4 font-mono text-purple-600 dark:text-purple-300 font-semibold">
                              +{f.recommendedSafetyStock} units
                            </td>

                            <td className="px-6 py-4">
                              {f.replenishmentUrgency === 'critical' ? (
                                <div>
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[10px] font-bold uppercase">
                                    Critical Restock
                                  </span>
                                  <div className="text-[11px] text-rose-600 dark:text-rose-300 font-semibold mt-1">
                                    Reorder {f.suggestedReorderQty} units immediately
                                  </div>
                                </div>
                              ) : f.replenishmentUrgency === 'reorder_soon' ? (
                                <div>
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 text-[10px] font-bold uppercase">
                                    Reorder Soon
                                  </span>
                                  <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                                    Reorder {f.suggestedReorderQty} units
                                  </div>
                                </div>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold uppercase">
                                  Healthy Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SMART EXPIRY MARKDOWN RADAR */}
            {activeTab === 'markdowns' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-950/60 dark:to-slate-900 border border-amber-200 dark:border-amber-800/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        Smart Expiry Clearance Radar
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Identifies supermarket batches approaching their expiration threshold and computes automated dynamic markdown discounts (10% to 50%) to accelerate inventory sell-through and protect supermarket margins.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-amber-300 dark:border-amber-700/40 text-right shrink-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Potential Recoverable Revenue</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrency(markdowns?.potentialRecoverableRevenue || 0)}
                    </span>
                  </div>
                </div>

                {markdowns?.recommendations?.length === 0 ? (
                  <div className="p-16 text-center bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Zero Expiring Batches Detected</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">All current supermarket stock is within safe shelf-life thresholds.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {markdowns?.recommendations?.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                m.priority === 'critical'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                  : m.priority === 'high'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                              }`}>
                                {m.strategy.replace(/_/g, ' ')}
                              </span>
                              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{m.productName}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                Batch #{m.batchNumber} • {m.batchQuantity} units on shelf
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {m.recommendedDiscountPercentage}% OFF
                              </span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-4 text-xs space-y-1.5">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                              <span>Standard Price:</span>
                              <span className="line-through">{formatCurrency(m.originalPrice)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                              <span>Recommended Clearance Price:</span>
                              <span className="font-mono text-sm">{formatCurrency(m.recommendedPrice)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-900">
                              <span>Days to Expiry:</span>
                              <span className="font-semibold text-rose-600 dark:text-rose-400">{m.daysRemaining} days</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                            "{m.explanation}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
