import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, Package, CreditCard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import Button from '../../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      
      // Determine redirection path based on role or previous location state
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      switch (user.role) {
        case ROLES.ADMIN:
          navigate('/admin');
          break;
        case ROLES.INVENTORY_MANAGER:
          navigate('/inventory');
          break;
        case ROLES.CASHIER:
          navigate('/cashier');
          break;
        default:
          navigate('/customer');
          break;
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 mb-6 group">
          <img
            src="/logo.png"
            alt="NexCart Logo"
            className="w-12 h-12 rounded-2xl object-contain drop-shadow-md group-hover:scale-105 transition-transform"
          />
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Nex<span className="text-emerald-600 dark:text-emerald-400">Cart</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Sign In to Your Workspace
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Supermarket automation with role-based access control
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexcart.com"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full py-3.5 text-sm font-bold shadow-md"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  Sign In to Workspace
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          {/* Quick-Fill Demonstration Selector */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Demo Credentials (1-Click Fill)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@nexcart.com', 'Admin@123')}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 dark:hover:bg-purple-900/40 text-left transition-all"
              >
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">admin@nexcart.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('inventory@nexcart.com', 'Inventory@123')}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 dark:hover:bg-amber-900/40 text-left transition-all"
              >
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Inv Manager
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">inventory@nexcart.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('cashier@nexcart.com', 'Cashier@123')}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 dark:hover:bg-blue-900/40 text-left transition-all"
              >
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Cashier
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">cashier@nexcart.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('customer@nexcart.com', 'Customer@123')}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 dark:hover:bg-emerald-900/40 text-left transition-all"
              >
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Customer
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">customer@nexcart.com</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Register as Customer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
