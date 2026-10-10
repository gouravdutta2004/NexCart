import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Store, 
  BarChart3, 
  Package, 
  CreditCard, 
  Users, 
  Tag, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Truck, 
  AlertTriangle, 
  History, 
  ScanLine,
  Home,
  Sun,
  Moon,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import StatusBadge from '../ui/StatusBadge';
import CartDrawer from '../cart/CartDrawer';
import NotificationDrawer from '../ui/NotificationDrawer';

export default function AppLayout({ children, title, subtitle, actions }) {
  const { user, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('nexcart_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexcart_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build role-specific navigation menu items
  const getNavSections = () => {
    if (!user) return [];

    if (user.role === ROLES.ADMIN) {
      return [
        {
          title: 'Management',
          items: [
            { label: 'Admin Console', path: '/admin', icon: BarChart3 },
            { label: 'Analytics & Forecast', path: '/admin/analytics', icon: Layers },
            { label: 'User Governance', path: '/admin/users', icon: Users },
            { label: 'Audit Trail', path: '/admin/audit', icon: FileText },
          ],
        },
        {
          title: 'Operations',
          items: [
            { label: 'Products & SKUs', path: '/admin/products', icon: Package },
            { label: 'Categories', path: '/admin/categories', icon: Layers },
            { label: 'Discounts & Coupons', path: '/admin/discounts', icon: Tag },
            { label: 'Store Orders', path: '/admin/orders', icon: History },
          ],
        },
        {
          title: 'Logistics & POS',
          items: [
            { label: 'Inventory Hub', path: '/inventory', icon: Package },
            { label: 'Purchase Orders', path: '/inventory/purchase-orders', icon: Truck },
            { label: 'Suppliers', path: '/inventory/suppliers', icon: Truck },
            { label: 'POS Terminal', path: '/cashier/pos', icon: CreditCard },
          ],
        },
      ];
    }

    if (user.role === ROLES.INVENTORY_MANAGER) {
      return [
        {
          title: 'Inventory Hub',
          items: [
            { label: 'Stock & FEFO Radar', path: '/inventory', icon: Package },
            { label: 'Purchase Orders', path: '/inventory/purchase-orders', icon: Truck },
            { label: 'FMCG Suppliers', path: '/inventory/suppliers', icon: Truck },
            { label: 'Catalog Products', path: '/admin/products', icon: Package },
          ],
        },
      ];
    }

    if (user.role === ROLES.CASHIER) {
      return [
        {
          title: 'Counter POS',
          items: [
            { label: 'POS Terminal', path: '/cashier/pos', icon: CreditCard },
            { label: 'Cashier Dashboard', path: '/cashier', icon: BarChart3 },
            { label: 'Fulfilled Orders', path: '/admin/orders', icon: History },
          ],
        },
      ];
    }

    // Customer
    return [
      {
        title: 'Shopping',
        items: [
          { label: 'Storefront', path: '/catalog', icon: Store },
          { label: 'Express Self-Checkout', path: '/self-checkout', icon: ScanLine },
          { label: 'Order History & Invoices', path: '/customer/orders', icon: History },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname === path) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <CartDrawer />
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* DESKTOP SIDEBAR */}
        {/* ========================================================================= */}
        <aside
          className={`
            hidden md:flex flex-col shrink-0 border-r border-slate-200/90 dark:border-slate-800
            bg-white dark:bg-slate-900 transition-all duration-200 z-30 select-none
            ${collapsed ? 'w-20' : 'w-64'}
          `}
        >
          {/* Sidebar Header / Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800">
            <Link to="/" className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
                    Nex<span className="text-emerald-600 dark:text-emerald-400">Cart</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
                    Enterprise
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6">
            {navSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {!collapsed && (
                  <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    {sec.title}
                  </h4>
                )}
                {sec.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all
                        ${
                          active
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }
                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                    >
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* User Profile / Footer in Sidebar */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            {!collapsed && user && (
              <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                </div>
                <StatusBadge status={user.role} type="role" size="sm" />
              </div>
            )}

            <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : 'justify-between'}`}>
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN APPLICATION WORKSPACE */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Topbar Header */}
          <header className="h-16 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
            {/* Left: Mobile Drawer Trigger + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {title || 'NexCart Workspace'}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions, Notifications, Cart */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {actions}

              <button
                type="button"
                onClick={() => setShowNotifications(true)}
                aria-label="View notifications"
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4.5 h-4.5 stroke-[2]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </button>

              <button
                type="button"
                onClick={openDrawer}
                aria-label="Open cart"
                className="relative flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
              >
                <ShoppingCart className="w-4.5 h-4.5 stroke-[2.2]" />
                {itemCount > 0 && (
                  <span className="text-[10px] font-black h-4.5 min-w-4.5 px-1 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Main Body View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col p-4 animate-in slide-in-from-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">NexCart</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 overflow-y-auto space-y-4">
              {navSections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </h4>
                  {sec.items.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold
                          ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-500 flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
