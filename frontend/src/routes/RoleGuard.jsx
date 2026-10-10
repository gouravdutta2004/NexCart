import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { ROLE_LABELS } from '../utils/constants';

export default function RoleGuard({ allowedRoles, children }) {
  const { user, hasRole, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(allowedRoles)) {
    const isKnownRole = ['admin', 'cashier', 'inventory_manager', 'customer'].includes(user.role);

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/50 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your current role is <span className="font-semibold text-rose-300">{ROLE_LABELS[user.role] || user.role}</span>.
            This module requires authorization for: {allowedRoles.map(r => ROLE_LABELS[r] || r).join(', ')}.
          </p>
          <div className="flex flex-col gap-3">
            {isKnownRole && (
              <Link
                to={
                  user.role === 'admin'
                    ? '/admin'
                    : user.role === 'cashier'
                    ? '/cashier'
                    : user.role === 'inventory_manager'
                    ? '/inventory'
                    : '/customer'
                }
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Your Role Workspace
              </Link>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
