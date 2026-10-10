import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Store, 
  ShieldCheck, 
  Package, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  Zap,
  TrendingDown,
  Star,
  Award,
  ChevronRight,
  ScanLine,
  Truck,
  HeartHandshake,
  CreditCard,
  BarChart3,
  Apple,
  Coffee
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ProductCard from '../../components/ui/ProductCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useCart } from '../../context/CartContext';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import axios from 'axios';

export default function HomeDashboard() {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);

  // Professional SVG Categories for supermarket display (No emojis per design system)
  const DEFAULT_CATEGORIES = [
    { name: 'Dairy & Eggs', icon: Package, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40', description: 'Fresh farm milk, butter, ghee & paneer' },
    { name: 'Bakery & Bread', icon: Store, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/40', description: 'Artisan sourdough, sliced breads & buns' },
    { name: 'Pantry & Staples', icon: Layers, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40', description: 'Flours, lentils, rice & cold-pressed oils' },
    { name: 'Snacks & Biscuits', icon: Sparkles, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/40', description: 'Cookies, roasted nuts & savories' },
    { name: 'Beverages', icon: Coffee, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40', description: 'Fresh juices, premium tea & filter coffee' },
    { name: 'Personal Care', icon: ShieldCheck, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/40', description: 'Hygiene essentials, soaps & grooming' },
    { name: 'Household', icon: HeartHandshake, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40', description: 'Eco cleaners, detergents & paperware' },
    { name: 'Fruits & Veg', icon: Apple, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/40', description: 'Seasonal organics picked at peak ripeness' },
  ];

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, healthRes] = await Promise.all([
          productService.getProducts({ limit: 8 }),
          categoryService.getCategories().catch(() => ({ categories: [] })),
          axios.get('/api/health').catch(() => null),
        ]);

        const availableCats = catRes?.categories || catRes?.data?.categories || [];
        setProducts(prodRes?.data?.products || prodRes?.products || []);
        if (availableCats.length > 0) {
          setCategories(availableCats);
        }
        if (healthRes?.data?.data) {
          setHealth(healthRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load home storefront data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
        
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative rounded-3xl sm:rounded-4xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-8 sm:p-12 lg:p-16 shadow-xl shadow-emerald-900/10">
          {/* Subtle background graphics */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase text-white mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Smarter Inventory. Faster Checkout. Better Shopping.
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Shop Smarter. <br />
              Checkout Faster. <br />
              <span className="text-emerald-200">Live Better.</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-emerald-50 max-w-2xl mb-8 leading-relaxed font-normal">
              Discover verified-fresh supermarket products, automated FEFO discounts, and an express self-checkout experience with transparent GST digital receipts.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <Button
                variant="secondary"
                size="lg"
                iconRight={ArrowRight}
                onClick={() => navigate('/catalog')}
                className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-lg shadow-black/10 font-bold"
              >
                Start Shopping
              </Button>

              <button
                type="button"
                onClick={() => {
                  const dealsEl = document.getElementById('smart-deals-section');
                  dealsEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-base backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                Explore Smart Deals
              </button>
            </div>

            {/* Live Backend Telemetry Pill */}
            {health && (
              <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs text-emerald-100 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  System Status: <strong className="text-white">Active ({health.status})</strong>
                </span>
                <span>•</span>
                <span>Database: <strong className="text-white">MongoDB ({health.database?.dbName})</strong></span>
                <span>•</span>
                <span>Pricing: <strong className="text-white">Authoritative INR (₹)</strong></span>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SMART CATEGORIES */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Aisles & Departments
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Smart Categories
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 group"
            >
              Browse All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {DEFAULT_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/catalog?category=${encodeURIComponent(cat.name)}`)}
                className="
                  group cursor-pointer p-5 rounded-2xl sm:rounded-3xl
                  bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800
                  hover:border-emerald-500/50 hover:shadow-md hover:-translate-y-1
                  transition-all duration-200 flex flex-col justify-between
                "
              >
                {(() => {
                  const IconComp = cat.icon;
                  return (
                    <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs`}>
                      <IconComp className="w-6 h-6 stroke-[2]" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SMART DEALS SECTION */}
        {/* ========================================================================= */}
        <section id="smart-deals-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Automated Clearance & Velocity Promotions
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Smart Deals & Fresh Arrivals
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 group"
            >
              View Full Catalog <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((prod, idx) => {
              // Assign realistic dynamic badges for rich visual merchandising
              const badgeOptions = ['SMART DEAL', 'BEST SELLER', 'NEW ARRIVAL', 'EXPIRING SOON'];
              const assignedBadge = badgeOptions[idx % badgeOptions.length];
              const badgeVariant = assignedBadge === 'EXPIRING SOON' ? 'warning' : 'emerald';

              return (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  badgeText={assignedBadge}
                  badgeVariant={badgeVariant}
                  onAddToCart={(id, qty) => addToCart(id, qty)}
                  onClick={() => navigate('/catalog')}
                />
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* WHY NEXCART — TRUST PILLARS */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl sm:rounded-4xl p-8 sm:p-12 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Enterprise Engineering
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Engineered for Modern Supermarket Automation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Combining First-Expiry First-Out logistics, high-speed POS scanning, and server-authoritative checkout guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800/40">
                <Clock className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                FEFO Batch Logistics
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                First-Expired, First-Out algorithmic stock allocation guarantees peak freshness, mitigates shrinkage, and auto-applies expiry clearance markdowns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800/40">
                <ScanLine className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Sub-Second POS & Self-Checkout
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Dual barcode engine supporting physical laser scanners and express camera scanning with instantaneous numeric tender calculation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-100 dark:border-purple-800/40">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                ACID Transactions & Audit Trail
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Atomic checkouts with optimistic concurrency version locks prevent overselling. Every price adjustment is captured in an immutable audit ledger.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ROLE WORKSPACES QUICK-LAUNCH (Academic & Evaluator Fast Links) */}
        {/* ========================================================================= */}
        <section className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white border border-slate-800">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Role Workspaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Explore NexCart by Role
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              The platform features 4 distinct permission workspaces tailored for Supermarket Owners, Cashiers, Storekeepers, and Customers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/catalog"
              className="p-5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <Store className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Customer Portal
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Product catalog, cart, express checkout, digital invoices.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 mt-4 flex items-center gap-1">
                Launch Portal →
              </span>
            </Link>

            <Link
              to="/cashier/pos"
              className="p-5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <CreditCard className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                  Cashier POS
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Barcode billing, held carts, thermal receipt printing.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-400 mt-4 flex items-center gap-1">
                Open POS Terminal →
              </span>
            </Link>

            <Link
              to="/inventory"
              className="p-5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <Package className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Inventory Hub
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  FEFO batch tracker, stock alerts, purchase order receiving.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 mt-4 flex items-center gap-1">
                View Logistics →
              </span>
            </Link>

            <Link
              to="/admin"
              className="p-5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <BarChart3 className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Admin Console
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  User governance, sales trends, coupons, immutable audit trail.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-400 mt-4 flex items-center gap-1">
                Access Console →
              </span>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <span>NexCart — Intelligent Supermarket Automation System</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/catalog" className="hover:text-emerald-600">Storefront</Link>
            <Link to="/self-checkout" className="hover:text-emerald-600">Self-Checkout</Link>
            <Link to="/login" className="hover:text-emerald-600">Employee Login</Link>
          </div>

          <p>© 2026 NexCart Systems. Built for academic & enterprise demonstration.</p>
        </div>
      </footer>
    </div>
  );
}
