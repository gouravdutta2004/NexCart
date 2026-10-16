import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  LogOut, 
  User as UserIcon, 
  Store, 
  BarChart3, 
  Package, 
  CreditCard,
  Bell,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  History,
  ScanLine,
  ShieldCheck,
  Tag,
  Users,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import CartDrawer from '../cart/CartDrawer';
import NotificationDrawer from '../ui/NotificationDrawer';
import { ROLE_LABELS, ROLES } from '../../utils/constants';
import StatusBadge from '../ui/StatusBadge';
import useSocket from '../../hooks/useSocket';

export default function Navbar() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);
  const [hasClearedNotifications, setHasClearedNotifications] = useState(false);
  const prevNotifCountRef = useRef(notifications.length);

  // Profile & Password modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleOpenProfile = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setProfileData({ name: user?.name || '', phone: user?.phone || '' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setProfileMsg(null);
    setShowProfileModal(true);
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setUpdatingDetails(true);
    setProfileMsg(null);
    try {
      const res = await authService.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
      });
      if (res?.data?.user) {
        updateUser(res.data.user);
      }
      setProfileMsg({ type: 'success', text: 'Personal details updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update details' });
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!passwordData.currentPassword) {
      setProfileMsg({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setProfileMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setProfileMsg({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    setUpdatingPassword(true);
    try {
      await authService.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfileMsg({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (notifications.length > prevNotifCountRef.current) {
      setHasViewedNotifications(false);
      setHasClearedNotifications(false);
    }
    prevNotifCountRef.current = notifications.length;
  }, [notifications.length]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setHasViewedNotifications(true);
  };

  const handleClearAll = () => {
    clearNotifications();
    setHasClearedNotifications(true);
    setHasViewedNotifications(true);
  };

  const roleScopedNotifications = notifications.filter((item) => {
    if (!user?.role || user.role === 'admin') return true;
    if (user.role === 'inventory_manager') return item.category === 'inventory' || item.category === 'procurement';
    if (user.role === 'cashier') return item.category === 'pos' || item.category === 'held_carts';
    if (user.role === 'customer') return item.category === 'orders' || item.category === 'promotions';
    return item.category === 'promotions' || item.category === 'store';
  });

  const unreadCount = hasClearedNotifications || hasViewedNotifications
    ? 0
    : roleScopedNotifications.length > 0
      ? roleScopedNotifications.filter((n) => n.unread !== false).length
      : 1; // 1 unread indicator for initial role-specific welcome feed

  return (
    <>
      <CartDrawer />
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={hasClearedNotifications ? [] : roleScopedNotifications}
        onClearAll={handleClearAll}
        role={user?.role}
        userName={user?.name}
      />

      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center space-x-3 group select-none">
              <img
                src="/logo.png"
                alt="NexCart Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
                  Nex<span className="text-emerald-600 dark:text-emerald-400">Cart</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 hidden sm:inline leading-none">
                  Smart Supermarket
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              to="/catalog"
              className={`
                px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors
                ${
                  isActive('/catalog')
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <Store className="w-4 h-4" />
              Storefront
            </Link>

            <Link
              to="/self-checkout"
              className={`
                px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors
                ${
                  isActive('/self-checkout')
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <ScanLine className="w-4 h-4" />
              Self-Checkout
            </Link>

            {isAuthenticated && (
              <>
                {/* Cashier / POS */}
                {(user.role === ROLES.ADMIN || user.role === ROLES.CASHIER) && (
                  <Link
                    to="/cashier/pos"
                    className={`
                      px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors
                      ${
                        isActive('/cashier')
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <CreditCard className="w-4 h-4" />
                    POS Terminal
                  </Link>
                )}

                {/* Inventory Manager */}
                {(user.role === ROLES.ADMIN || user.role === ROLES.INVENTORY_MANAGER) && (
                  <Link
                    to="/inventory"
                    className={`
                      px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors
                      ${
                        isActive('/inventory')
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <Package className="w-4 h-4" />
                    Inventory Hub
                  </Link>
                )}

                {/* Admin Console */}
                {user.role === ROLES.ADMIN && (
                  <Link
                    to="/admin"
                    className={`
                      px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors
                      ${
                        isActive('/admin')
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Admin
                  </Link>
                )}

                {/* Customer Orders */}
                {user.role === ROLES.CUSTOMER && (
                  <Link
                    to="/customer/orders"
                    className={`
                      px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors
                      ${
                        isActive('/customer/orders')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <History className="w-4 h-4" />
                    My Orders
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dark Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? (
                <Sun className="w-4.5 h-4.5 text-amber-400 stroke-[2.2]" />
              ) : (
                <Moon className="w-4.5 h-4.5 stroke-[2]" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={handleOpenNotifications}
              aria-label="View notifications"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4.5 h-4.5 stroke-[2]" />
              {unreadCount > 0 ? (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open shopping cart"
              className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 transition-colors"
            >
              <ShoppingCart className="w-4.5 h-4.5 stroke-[2.2]" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>
              {itemCount > 0 && (
                <span className="inline-flex items-center justify-center text-[10px] font-black h-5 w-5 rounded-full bg-emerald-600 text-white">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile / Login */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1.5">
                        <StatusBadge status={user.role} type="role" size="sm" />
                      </div>
                    </div>

                    {user.role === ROLES.ADMIN && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        Admin Console
                      </Link>
                    )}

                    {(user.role === ROLES.ADMIN || user.role === ROLES.INVENTORY_MANAGER) && (
                      <Link
                        to="/inventory"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Package className="w-4 h-4 text-amber-500" />
                        Inventory Hub
                      </Link>
                    )}

                    {(user.role === ROLES.ADMIN || user.role === ROLES.CASHIER) && (
                      <Link
                        to="/cashier/pos"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-blue-500" />
                        POS Terminal
                      </Link>
                    )}

                    {(user.role === ROLES.ADMIN || user.role === ROLES.CASHIER) && (
                      <Link
                        to="/admin/orders"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Receipt className="w-4 h-4 text-purple-500" />
                        Store Orders & Fulfillment
                      </Link>
                    )}

                    <Link
                      to="/customer/orders"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <History className="w-4 h-4 text-emerald-500" />
                      Order History & Invoices
                    </Link>

                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <UserIcon className="w-4 h-4 text-blue-500" />
                      Profile & Security
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
            <Link
              to="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Store className="w-4 h-4 text-emerald-500" />
              Storefront Catalog
            </Link>

            <Link
              to="/self-checkout"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ScanLine className="w-4 h-4 text-blue-500" />
              Express Self-Checkout
            </Link>

            {isAuthenticated && (
              <>
                {(user.role === ROLES.ADMIN || user.role === ROLES.CASHIER) && (
                  <Link
                    to="/cashier/pos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    POS Terminal
                  </Link>
                )}

                {(user.role === ROLES.ADMIN || user.role === ROLES.CASHIER) && (
                  <Link
                    to="/admin/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Receipt className="w-4 h-4 text-purple-500" />
                    Store Orders & Fulfillment
                  </Link>
                )}

                {(user.role === ROLES.ADMIN || user.role === ROLES.INVENTORY_MANAGER) && (
                  <Link
                    to="/inventory"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Package className="w-4 h-4 text-amber-500" />
                    Inventory Hub
                  </Link>
                )}

                {user.role === ROLES.ADMIN && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    Admin Console
                  </Link>
                )}

                <Link
                  to="/customer/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <History className="w-4 h-4 text-emerald-500" />
                  My Orders & Invoices
                </Link>

                <button
                  type="button"
                  onClick={handleOpenProfile}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                >
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  My Profile & Security
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Profile & Security Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    My Profile & Security
                  </h3>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {ROLE_LABELS[user?.role] || user?.role} Account
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 mb-4 text-xs font-semibold ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Profile Information Form */}
            <form onSubmit={handleUpdateDetails} className="space-y-3.5 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={updatingDetails}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {updatingDetails ? 'Saving...' : 'Update Details'}
              </button>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {updatingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
