import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  ShoppingBag, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  Zap,
  Printer
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function CashierDashboard() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const testRbacEndpoint = async (roleType) => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await api.get(`/auth/rbac-test/${roleType}`);
      setTestResult({
        success: true,
        message: res.message || 'Access Authorized',
        data: res.data,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Access Forbidden',
      });
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cashier Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold uppercase tracking-wider">
                Cashier Lane Terminal
              </span>
              <span className="text-slate-500 text-xs font-mono">Terminal #01 (Active)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Operator: {user?.name || 'Cashier User'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              High-speed barcode checkout, basket parking, GST-compliant thermal invoicing & role enforcement
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cashier/pos">
              <Button variant="primary" className="shadow-md">
                <CreditCard className="w-4 h-4 mr-2" />
                Open POS Terminal
              </Button>
            </Link>
          </div>
        </div>

        {/* Shift Stats & Quick Action */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Shift</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Online</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Terminal #01 active & synced</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-300 dark:border-emerald-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">POS Billing Terminal</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">Active Checkout Lane</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Barcode reader, split tender, held carts & GST thermal receipts</p>
            </div>
            <Link
              to="/cashier/pos"
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all shadow-md"
            >
              <Zap className="w-4 h-4" />
              Launch POS Terminal Lane →
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cart Park / Hold</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">Persistent Parking</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hold & recall multi-customer baskets</p>
          </div>
        </div>

        {/* RBAC Verification for Cashier */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Cashier RBAC Enforcement Audit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify that this Cashier session can access Cashier routes, but is forbidden from Admin routes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button
              onClick={() => testRbacEndpoint('cashier')}
              disabled={loadingTest}
              variant="primary"
              size="sm"
            >
              Test Allowed Route (/api/v1/auth/rbac-test/cashier)
            </Button>
            <Button
              onClick={() => testRbacEndpoint('admin')}
              disabled={loadingTest}
              variant="danger"
              size="sm"
            >
              Attempt Admin Route (Expect 403 Forbidden)
            </Button>
          </div>

          {loadingTest && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 py-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
              Evaluating RBAC Token Permission...
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
