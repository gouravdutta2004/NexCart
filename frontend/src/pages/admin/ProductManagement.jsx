import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  X, 
  ArrowLeft,
  Sparkles,
  Tag,
  IndianRupee,
  Trash2,
  RotateCcw
} from 'lucide-react';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';

export default function ProductManagement() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // active | archived | all
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    categoryId: '',
    brand: 'Generic',
    unit: 'pcs',
    costPrice: '',
    sellingPrice: '',
    taxRate: 5,
    isExpiryTracked: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Scanner Simulator State
  const [simBarcode, setSimBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts({
          search: debouncedSearch,
          categoryId: selectedCategory,
          includeInactive: statusFilter !== 'active',
          page,
          limit: 15,
        }),
        categoryService.getCategories(),
      ]);

      const cats = catRes?.categories || catRes?.data?.categories || [];
      let prods = prodRes?.data?.products || prodRes?.products || [];
      if (statusFilter === 'archived') {
        prods = prods.filter((p) => p.isActive === false);
      }
      setProducts(prods);
      setPagination(prodRes?.meta?.pagination || { page: 1, totalPages: 1, total: 0 });
      setCategories(cats);
      if (cats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0]._id }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch catalog' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [debouncedSearch, selectedCategory, statusFilter]);

  const handleRestoreProduct = async (prod) => {
    try {
      await productService.updateProduct(prod._id, { isActive: true });
      setMessage({ type: 'success', text: `Product '${prod.name}' restored and marked active.` });
      loadData(pagination.page);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to restore product' });
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: `890103${Math.floor(1000000 + Math.random() * 9000000)}`,
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      categoryId: categories[0]?._id || '',
      brand: 'NexCart Quality',
      unit: 'pcs',
      costPrice: '',
      sellingPrice: '',
      taxRate: 5,
      isExpiryTracked: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      barcode: prod.barcode,
      sku: prod.sku,
      categoryId: prod.categoryId?._id || prod.categoryId,
      brand: prod.brand,
      unit: prod.unit,
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      taxRate: prod.taxRate,
      isExpiryTracked: prod.isExpiryTracked,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, formData);
        setMessage({ type: 'success', text: `Product '${formData.name}' updated successfully!` });
      } else {
        await productService.createProduct(formData);
        setMessage({ type: 'success', text: `Product '${formData.name}' created successfully!` });
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to remove '${prod.name}' from the supermarket catalog?`)) return;
    try {
      await productService.deleteProduct(prod._id);
      setMessage({ type: 'success', text: `Product '${prod.name}' removed successfully.` });
      loadData(pagination.page);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove product' });
    }
  };

  const handleBarcodeScanTest = async (codeToTest) => {
    const code = codeToTest || simBarcode;
    if (!code) return;
    setScanLoading(true);
    setScanResult(null);

    const startTime = performance.now();
    try {
      const res = await productService.getProductByBarcode(code);
      const elapsed = Math.round(performance.now() - startTime);
      setScanResult({
        success: true,
        product: res.product,
        latencyMs: elapsed,
      });
    } catch (err) {
      setScanResult({
        success: false,
        error: err.message || 'Barcode not found',
      });
    } finally {
      setScanLoading(false);
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
              <Link
                to={user?.role === 'inventory_manager' ? '/inventory' : '/admin'}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {user?.role === 'inventory_manager' ? 'Inventory Hub' : 'Admin Console'}
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs text-slate-500">Inventory Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Package className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              Product Master Catalog
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Indian FMCG EAN Barcodes, retail shelf pricing, margins, SKU management & perishable flags
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenAdd}
              variant="primary"
              className="shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Product
            </Button>
          </div>
        </div>

        {/* Global Feedback Banner */}
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

        {/* Interactive Barcode Scanner Simulator Panel */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm mb-8">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live POS Barcode Scanner Simulator
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Indexed B-Tree Barcode Lookup</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={simBarcode}
                onChange={(e) => setSimBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScanTest()}
                placeholder="Enter or paste EAN barcode (e.g. 8901030001011)..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Button
              onClick={() => handleBarcodeScanTest()}
              disabled={scanLoading}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Scan className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Simulate Scan
            </Button>
          </div>

          {/* Quick-Scan Sample Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-600 dark:text-slate-400">Quick Test Samples:</span>
            <button
              type="button"
              onClick={() => {
                setSimBarcode('8901030001011');
                handleBarcodeScanTest('8901030001011');
              }}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-300 font-mono transition-colors"
            >
              Amul Milk (8901030001011)
            </button>
            <button
              type="button"
              onClick={() => {
                setSimBarcode('8901030002018');
                handleBarcodeScanTest('8901030002018');
              }}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-300 font-mono transition-colors"
            >
              Apples (8901030002018)
            </button>
            <button
              type="button"
              onClick={() => {
                setSimBarcode('8901030003015');
                handleBarcodeScanTest('8901030003015');
              }}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-300 font-mono transition-colors"
            >
              Aashirvaad Atta (8901030003015)
            </button>
            <button
              type="button"
              onClick={() => {
                setSimBarcode('8901030004012');
                handleBarcodeScanTest('8901030004012');
              }}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-300 font-mono transition-colors"
            >
              Real Juice (8901030004012)
            </button>
          </div>

          {/* Scan Result Card */}
          {scanResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {scanResult.success ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {scanResult.product.name}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold">
                        {scanResult.latencyMs}ms index resolution
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Brand: <span className="text-slate-800 dark:text-slate-200 font-medium">{scanResult.product.brand}</span> | 
                      Price: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(scanResult.product.sellingPrice)}</span> | 
                      GST: {scanResult.product.taxRate}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Scan Failure: {scanResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, barcode, or brand..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-52 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <option value="">All Categories ({pagination.total})</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
              <option value="all">All Products</option>
            </select>
          </div>
        </div>

        {/* Products Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Barcode & SKU</th>
                  <th className="py-3.5 px-4">Product Name & Brand</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-center">Margin</th>
                  <th className="py-3.5 px-4 text-center">GST Tax</th>
                  <th className="py-3.5 px-4 text-center">Perishable</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No products found matching criteria.
                    </td>
                  </tr>
                ) : (
                  products.map((prod) => {
                    const margin =
                      prod.sellingPrice > 0
                        ? (((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100).toFixed(1)
                        : 0;

                    return (
                      <tr key={prod._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="text-slate-900 dark:text-white font-semibold flex items-center gap-1.5">
                            <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {prod.barcode}
                          </div>
                          <div className="text-[10px] text-slate-400">{prod.sku}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {prod.name}
                            {prod.isActive === false && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{prod.brand} • {prod.unit}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {prod.categoryId?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          {formatCurrency(prod.costPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(prod.sellingPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              margin > 30
                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {margin}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                          {prod.taxRate}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              prod.isExpiryTracked
                                ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {prod.isExpiryTracked ? 'Tracked' : 'Non-perishable'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {user?.role === 'admin' && (
                            prod.isActive === false ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreProduct(prod)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                                title="Restore Product"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                title="Archive / Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={15}
            onPageChange={(p) => loadData(p)}
          />
        </div>

        {/* Product Modal Dialog (Add / Edit) */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  {editingProduct ? 'Edit Product Details' : 'Add New Supermarket Item'}
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
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aashirvaad Superior MP Sharbati Atta 5kg"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Barcode (EAN-13) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. ITC"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Cost Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="180.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      placeholder="245.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      GST %
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="28"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isExpiryTracked"
                    checked={formData.isExpiryTracked}
                    onChange={(e) => setFormData({ ...formData, isExpiryTracked: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-950"
                  />
                  <label htmlFor="isExpiryTracked" className="text-xs text-slate-700 dark:text-slate-300 select-none">
                    Track Perishable Expiration (Enable for FEFO & Smart Markdown Radar)
                  </label>
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
                    {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
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
