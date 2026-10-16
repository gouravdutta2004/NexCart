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
import { useToast } from '../../context/ToastContext';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import api from '../../services/api';
import axios from 'axios';

export default function HomeDashboard() {
  const { addToCart } = useCart();
  const toast = useToast();
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
          api.get('/health').catch(() => axios.get('/api/health').then((r) => r.data).catch(() => null)),
        ]);

        const availableCats = catRes?.categories || catRes?.data?.categories || [];
        setProducts(prodRes?.data?.products || prodRes?.products || []);
        if (availableCats.length > 0) {
          setCategories(availableCats);
        }
        const healthPayload = healthRes?.data?.data || healthRes?.data || healthRes;
        if (healthPayload?.status) {
          setHealth(healthPayload);
        }
      } catch (err) {
        console.error('Failed to load home storefront data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleAddToCart = async (prod, qty = 1) => {
    const res = await addToCart(prod._id, qty);
    if (res?.success) {
      toast.success(`${prod.name} (${qty}x) added to basket`, 'Added to Cart');
    } else {
      toast.error(res?.error || 'Could not add item to basket', 'Stock Notice');
    }
  };

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

          <div className="relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left 7 Columns: Hero Pitch */}
            <div className="lg:col-span-7">
              {/* Tagline Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase text-white mb-6">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                Smarter Inventory • Faster Checkout • Better Shopping
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                Shop Smarter. <br />
                Checkout Faster. <br />
                <span className="text-emerald-200">Live Better.</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-50 max-w-xl mb-8 leading-relaxed font-normal">
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
                <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-emerald-100 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    System: <strong className="text-white">Active ({health.status})</strong>
                  </span>
                  <span>•</span>
                  <span>DB: <strong className="text-white">MongoDB ({health.database?.dbName})</strong></span>
                  <span>•</span>
                  <span>Pricing: <strong className="text-white">Authoritative INR (₹)</strong></span>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Floating Supermarket Live Cart / Fresh Deal Showcase */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-white/20 p-6 shadow-2xl text-slate-100 ring-1 ring-white/10">
                {/* Floating Freshness Badge */}
                <div className="absolute -top-3.5 -right-3.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> FEFO Guard
                </div>

                {/* HUD Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-mono font-bold text-white tracking-wide">STORE #104 • LIVE HUD</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                    EXPRESS ACTIVE
                  </span>
                </div>

                {/* Live Showcase Items */}
                <div className="py-4 space-y-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <img 
                      src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80" 
                      alt="Amul Milk" 
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0" 
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-bold text-white truncate">Amul Taaza Homogenised Toned Milk</div>
                      <div className="text-[11px] text-emerald-300 font-mono">FEFO Batch #2026-B1 • Verified Fresh</div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="font-bold text-white">₹66</div>
                      <div className="text-[10px] text-slate-400">1 LTR</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <img 
                      src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120&auto=format&fit=crop&q=80" 
                      alt="Kashmir Apples" 
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0" 
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-bold text-white truncate">Fresh Kashmir Royal Delicious Apples</div>
                      <div className="text-[11px] text-amber-300 font-mono">10% Dynamic FEFO Deal Applied</div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="font-bold text-emerald-400">₹180</div>
                      <div className="text-[10px] text-slate-400 line-through">₹200</div>
                    </div>
                  </div>
                </div>

                {/* Live Basket Summary & Fast Action */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Instant Express Total</span>
                    <span className="text-lg font-black text-white font-mono">₹246 <span className="text-xs text-emerald-400 font-normal font-sans">(Save ₹20)</span></span>
                  </div>
                  <Link
                    to="/self-checkout"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    Try Kiosk <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
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
                  onAddToCart={(id, qty) => handleAddToCart(prod, qty)}
                  onClick={() => navigate('/catalog')}
                />
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
            <img src="/logo.png" alt="NexCart Logo" className="w-6 h-6 rounded-md object-contain" />
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
