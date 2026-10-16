import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import discountService from '../../services/discountService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  Tag, 
  Plus, 
  Percent, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X,
  Search,
  Sparkles,
  Clock,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

export default function DiscountManagement() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 0,
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    usageLimit: 500,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discountService.getAllDiscounts();
      setDiscounts(res?.data?.discounts || res?.discounts || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await discountService.toggleDiscountStatus(id);
      setSuccessMsg(res.message || 'Discount status updated');
      fetchDiscounts();
    } catch (err) {
      setError(err.message || 'Failed to toggle status');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const val = Number(formData.discountValue);
    if (isNaN(val) || val <= 0 || (formData.discountType === 'percentage' && val > 100)) {
      setError('Discount value must be greater than 0, and percentage cannot exceed 100%');
      return;
    }

    setSubmitting(true);
    try {
      await discountService.createDiscount(formData);
      setSuccessMsg(`Discount code '${formData.code.toUpperCase()}' created successfully`);
      setShowCreateModal(false);
      setFormData({
        code: '',
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        minPurchaseAmount: 0,
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        usageLimit: 500,
      });
      fetchDiscounts();
    } catch (err) {
      setError(err.message || 'Failed to create discount');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                to={user?.role === 'inventory_manager' ? '/inventory' : '/admin'}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {user?.role === 'inventory_manager' ? 'Inventory Hub' : 'Admin Console'}
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs text-slate-500 font-mono">{discounts.length} Active Rules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Promotional Discounts & Coupons
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Manage supermarket voucher campaigns, minimum purchase thresholds, and clearance codes
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Discount Rule
          </Button>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Discounts List */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400">Loading discount vouchers...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto shadow-sm">
            <Tag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No Discounts Configured</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create promotional discount rules to attract shoppers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discounts.map((d) => (
              <div
                key={d._id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono font-black text-sm tracking-widest border border-purple-200 dark:border-purple-800">
                      {d.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(d._id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        d.isActive
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                      }`}
                    >
                      {d.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{d.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{d.description}</p>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 mb-4 font-mono">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Value:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {d.discountType === 'percentage' ? `${d.discountValue}% OFF` : `₹${d.discountValue} FLAT`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Min Purchase:</span>
                      <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(d.minPurchaseAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Valid Until:</span>
                      <span className="text-slate-700 dark:text-slate-300">{new Date(d.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Usage:</span>
                      <span className="text-slate-700 dark:text-slate-300">{d.usedCount} / {d.usageLimit}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleToggleStatus(d._id)}
                  variant={d.isActive ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                >
                  {d.isActive ? 'Deactivate Coupon' : 'Enable Coupon'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Create Discount Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Create Promotional Voucher
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Coupon Code (Uppercase) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVE20"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Diwali Supermarket Dhamaka"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. 20% off on all grocery orders above ₹500"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="primary"
                  >
                    {submitting ? 'Creating...' : 'Save Discount'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
