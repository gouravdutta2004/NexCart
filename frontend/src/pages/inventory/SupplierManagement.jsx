import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Plus, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck,
  CreditCard,
  Building
} from 'lucide-react';
import supplierService from '../../services/supplierService';
import categoryService from '../../services/categoryService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: 'Net 30',
    rating: 5,
    suppliedCategories: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [supRes, catRes] = await Promise.all([
        supplierService.getSuppliers(),
        categoryService.getCategories(),
      ]);
      setSuppliers(supRes?.suppliers || supRes?.data?.suppliers || []);
      setCategories(catRes?.categories || catRes?.data?.categories || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load suppliers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await supplierService.createSupplier(formData);
      setMessage({ type: 'success', text: `Supplier '${formData.name}' registered successfully!` });
      setShowModal(false);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        paymentTerms: 'Net 30',
        rating: 5,
        suppliedCategories: [],
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create supplier' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link to="/inventory" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs text-slate-500">Vendor Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Truck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              Supplier Directory
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Authorized wholesale distributors, Indian FMCG brands, payment terms & GST compliance
            </p>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            variant="primary"
            className="shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register Supplier
          </Button>
        </div>

        {/* Feedback Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 mb-6 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="font-semibold">{message.text}</div>
          </div>
        )}

        {/* Supplier Cards Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading supplier directory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliers.map((sup) => (
              <div
                key={sup._id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {sup.name}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Contact: <strong className="text-slate-800 dark:text-slate-200">{sup.contactPerson || 'General Agent'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                      {sup.rating.toFixed(1)} / 5.0
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200 font-mono">{sup.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200 font-mono">{sup.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{sup.address || 'Address on file'}</span>
                    </div>
                  </div>

                  {/* Supplied Categories */}
                  <div className="mb-4">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                      Supplied Departments
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sup.suppliedCategories && sup.suppliedCategories.length > 0 ? (
                        sup.suppliedCategories.map((c) => (
                          <span
                            key={c._id || c}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {c.name || 'Department'}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">General Wholesale</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Terms: <span className="text-slate-700 dark:text-slate-200 font-semibold">{sup.paymentTerms}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">GSTIN: {sup.taxId || '27AADCB2230M1Z2'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Supplier Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Register New Supplier
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Company / Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Gujarat Co-operative Milk Marketing Federation (Amul)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="orders@amul.coop"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98200 12345"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="27AADCB2230M1Z2"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Warehouse Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Plot 45, MIDC Industrial Area, Mumbai, MH"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                      <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                      <option value="Immediate">Advance / Immediate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Supplier Rating (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="primary"
                  >
                    {submitting ? 'Registering...' : 'Save Supplier'}
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
