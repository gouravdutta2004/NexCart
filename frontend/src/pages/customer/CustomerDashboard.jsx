import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  Store, 
  ShoppingCart, 
  ScanLine, 
  Tag, 
  Heart, 
  History, 
  Sparkles, 
  ArrowRight,
  Receipt,
  Download,
  Package,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await orderService.getMyOrders(1, 3);
        setRecentOrders(res.data || []);
      } catch (err) {
        console.error('Failed to load recent customer orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchRecentOrders();
  }, []);

  const totalSpent = recentOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Customer Welcome Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-100 via-white to-emerald-50 dark:from-emerald-950/70 dark:via-slate-900 dark:to-slate-950 border border-emerald-200 dark:border-emerald-800/40 p-6 sm:p-8 shadow-sm">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-200/60 dark:bg-emerald-950/80 rounded-full border border-emerald-300 dark:border-emerald-800 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Customer Shopping Experience
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Hello, {user?.name || 'Shopper'}!
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
              Welcome to the NexCart smart shopping hub. Browse the catalog, track digital GST invoices, or launch the interactive in-store Self-Checkout terminal.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link to="/catalog">
                <Button variant="primary" size="sm" iconRight={ArrowRight}>
                  Start Shopping
                </Button>
              </Link>
              <Link to="/self-checkout">
                <Button variant="outline" size="sm" icon={ScanLine}>
                  In-Store Scanner
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/catalog"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors mb-2">
                Product Catalog & Storefront
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Explore supermarket aisles, filter by dairy, bakery, snacks, and add items to your basket.
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              Browse Storefront Now <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/self-checkout"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors mb-2">
                Self-Checkout Terminal
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Walk into the supermarket, scan barcodes directly with your phone/terminal, and complete instant express checkout.
              </p>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
              Launch Self-Checkout Now <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/customer/orders"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors mb-2">
                Digital Invoices & Orders
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Zero paper waste. All receipts, order histories, and itemized GST breakdowns are instantly downloadable as PDFs.
              </p>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
              View Order History & PDFs <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Recent Purchases Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Supermarket Orders</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your latest shopping trips and digital receipts</p>
              </div>
            </div>

            <Link to="/customer/orders" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              View All ({recentOrders.length}) →
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading order records...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No orders placed yet</p>
              <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                Add groceries from our storefront or scan items at an in-store express kiosk.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          #{ord.orderNumber}
                        </span>
                        <Badge variant="emerald" size="xs">
                          {ord.orderType?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(ord.createdAt)} • {ord.items?.length || 0} items
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block sm:hidden">Total:</span>
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                    </div>

                    {ord.invoiceId && (
                      <button
                        type="button"
                        onClick={() => orderService.downloadInvoicePdf(ord.invoiceId, ord.orderNumber)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                        title="Download GST Invoice PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
