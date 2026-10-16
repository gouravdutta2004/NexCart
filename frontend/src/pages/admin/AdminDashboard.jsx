import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  BarChart3, 
  ShieldCheck, 
  Package, 
  TrendingUp, 
  Sliders, 
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Sparkles,
  Layers,
  ArrowRight,
  ShoppingBag,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import analyticsService from '../../services/analyticsService';
import inventoryService from '../../services/inventoryService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import useSocket from '../../hooks/useSocket';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const [overview, setOverview] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState(null);

  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const loadDashboardTelemetry = async () => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const [ovRes, topRes, lowRes] = await Promise.all([
        analyticsService.getOverview().catch(() => ({ data: null })),
        analyticsService.getTopProducts(4).catch(() => ({ data: [] })),
        inventoryService.getLowStockAlerts().catch(() => ({ data: { alerts: [] } })),
      ]);

      setOverview(ovRes?.data || ovRes || null);
      setTopProducts(topRes?.data || topRes || []);
      setLowStockAlerts(lowRes?.alerts || lowRes?.data?.alerts || []);
    } catch (err) {
      setMetricsError(err.message || 'Failed to load executive telemetry');
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadDashboardTelemetry();

    const handleTelemetryEvent = () => {
      loadDashboardTelemetry();
    };

    on('new_order', handleTelemetryEvent);
    on('order_status', handleTelemetryEvent);
    on('pos_completed', handleTelemetryEvent);
    on('low_stock', handleTelemetryEvent);
    on('po_received', handleTelemetryEvent);

    return () => {
      off('new_order', handleTelemetryEvent);
      off('order_status', handleTelemetryEvent);
      off('pos_completed', handleTelemetryEvent);
      off('low_stock', handleTelemetryEvent);
      off('po_received', handleTelemetryEvent);
    };
  }, [on, off]);

  const testRbacEndpoint = async (roleType) => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await api.get(`/auth/rbac-test/${roleType}`);
      setTestResult({
        success: true,
        message: res.message || 'Access successfully authorized',
        data: res.data,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Access restricted',
      });
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold uppercase tracking-wider">
                Admin Console
              </span>
              <span className="text-slate-500 text-xs font-mono">RBAC Level: Tier 1 (Super Admin)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good morning, {user?.name || 'Administrator'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Here is what is happening with NexCart supermarket operations today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadDashboardTelemetry}
              loading={loadingMetrics}
            >
              Refresh Data
            </Button>
            <span className="text-xs text-slate-400 font-mono bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              Session: {user?._id?.slice(-6) || 'MASTER'}
            </span>
          </div>
        </div>

        {/* Executive KPI Overview Cards */}
        {loadingMetrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Gross Revenue"
              value={formatCurrency(overview?.totalRevenue || 0)}
              subtitle={`Tax collected: ${formatCurrency(overview?.totalTaxCollected || 0)}`}
              icon={TrendingUp}
              variant="emerald"
            />
            <StatCard
              title="Total Store Orders"
              value={overview?.totalOrders ?? 0}
              subtitle="Online, POS & Self-checkout"
              icon={ShoppingBag}
              variant="blue"
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(overview?.averageOrderValue || 0)}
              subtitle={`Discounts given: ${formatCurrency(overview?.totalDiscountsGiven || 0)}`}
              icon={BarChart3}
              variant="purple"
            />
            <StatCard
              title="Warehouse Stock Units"
              value={overview?.totalStockUnits ?? 0}
              subtitle={`${overview?.lowStockCount ?? 0} SKUs below reorder level`}
              icon={Package}
              variant={overview?.lowStockCount > 0 ? 'warning' : 'default'}
            />
          </div>
        )}

        {/* Top Products & Inventory Alerts Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling FMCG Products */}
          <Card className="p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top-Selling Products</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">By quantity sold across all channels</p>
                  </div>
                </div>
                <Link to="/admin/analytics" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Full Analytics →
                </Link>
              </div>

              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sales recorded yet. Process orders via Storefront or POS to see leaders.
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 4).map((p, idx) => (
                    <div
                      key={p.productId || idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.barcode || 'EAN-890'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white">{p.totalQuantitySold} units</span>
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(p.totalRevenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Low Stock & Warehouse Alerts */}
          <Card className="p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Inventory Attention Items</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Stock below reorder threshold</p>
                  </div>
                </div>
                <Link to="/inventory" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                  Logistics Hub →
                </Link>
              </div>

              {lowStockAlerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All warehouse inventory stock levels are healthy!
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockAlerts.slice(0, 4).map((al, idx) => (
                    <div
                      key={al._id || idx}
                      className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {al.productId?.name || 'Supermarket Product'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Reorder trigger: {al.reorderLevel} units
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="warning" size="xs">
                          {al.totalStock} remaining
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Catalog & Operations Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Link
            to="/admin/products"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Product Master Catalog
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage 20+ supermarket items, barcode scanner simulator & INR pricing
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Open Master Catalog <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/categories"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Category Taxonomy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Aisle taxonomy, department groupings & supermarket layout
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
              Open Categories <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/orders"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Orders & Fulfillment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Online deliveries, POS walk-in lanes & Self-Checkout GST tax invoices
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              Manage Orders <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Business Intelligence & Governance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Link
            to="/admin/analytics"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Sales Analytics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visual revenue time-series, 7-day sales forecast & category share
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              View Analytics <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/discounts"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Discounts & Vouchers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage promotional coupon codes (WELCOME50) & minimum cart amounts
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
              Manage Coupons <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/users"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                User Governance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Staff onboarding, role-based privileges & account activation
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              Manage Users <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/audit"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Audit Trail & Compliance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Immutable logs of product adjustments, checkout transactions & staff actions
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              Inspect Audit Log <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Live RBAC Live Inspector */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Live Role-Based Access Control (RBAC) Inspector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify backend endpoint authorization live as <strong>{user?.name}</strong> ({user?.role})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button
              onClick={() => testRbacEndpoint('admin')}
              disabled={loadingTest}
              variant="primary"
              size="sm"
            >
              Test Admin Route (/api/v1/auth/rbac-test/admin)
            </Button>
            <Button
              onClick={() => testRbacEndpoint('inventory')}
              disabled={loadingTest}
              variant="secondary"
              size="sm"
            >
              Test Inventory Route (/api/v1/auth/rbac-test/inventory)
            </Button>
            <Button
              onClick={() => testRbacEndpoint('cashier')}
              disabled={loadingTest}
              variant="secondary"
              size="sm"
            >
              Test Cashier Route (/api/v1/auth/rbac-test/cashier)
            </Button>
          </div>

          {loadingTest && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 py-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
              Evaluating RBAC Token Permission against Backend Middleware...
            </div>
          )}

          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 mt-3 text-sm ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold">{testResult.message}</div>
                {testResult.data && (
                  <pre className="text-xs mt-1 bg-white/70 dark:bg-slate-950/60 p-2.5 rounded-lg font-mono text-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
