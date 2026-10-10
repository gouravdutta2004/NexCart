import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { 
  FolderPlus, 
  Layers, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowLeft,
  Package
} from 'lucide-react';
import categoryService from '../../services/categoryService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'Package' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories({ includeInactive: true });
      setCategories(res?.categories || res?.data?.categories || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await categoryService.createCategory(formData);
      setMessage({ type: 'success', text: `Category '${formData.name}' created successfully!` });
      setShowModal(false);
      setFormData({ name: '', description: '', icon: 'Package' });
      loadCategories();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create category' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link to="/admin" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs text-slate-500">Taxonomy Master</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              Category Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Organize supermarket aisles, merchandise groups, and department taxes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowModal(true)}
              variant="primary"
              className="shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Feedback Message */}
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

        {/* Categories Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading department categories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <Badge variant={cat.isActive ? 'success' : 'neutral'}>
                      {cat.isActive ? 'Active' : 'Archived'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{cat.name}</h3>
                  <div className="text-xs font-mono text-purple-600 dark:text-purple-300 mb-2 font-medium">slug: {cat.slug}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">ID: {cat._id.slice(-6)}</span>
                  <span>{new Date(cat.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Category Modal Dialog */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Add New Category
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dairy & Eggs"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of merchandise included in this category..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                    {submitting ? 'Creating...' : 'Save Category'}
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
