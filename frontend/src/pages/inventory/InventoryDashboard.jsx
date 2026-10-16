import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, 
  AlertTriangle, 
  Truck, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  X,
  Radio,
  Search,
  ChevronRight,
  Info
} from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import useSocket from '../../hooks/useSocket';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function InventoryDashboard() {
  const { user } = useAuth();
  const { connected, notifications } = useSocket();

  const [summary, setSummary] = useState({ totalSKUs: 0, totalUnits: 0, lowStockCount: 0 });
  const [inventoryList, setInventoryList] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all | low | out | healthy

  // Adjustment Modal
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [submittingAdj, setSubmittingAdj] = useState(false);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [overviewRes, lowRes, expRes] = await Promise.all([
        inventoryService.getOverview(),
        inventoryService.getLowStockAlerts(),
        inventoryService.getExpiryAlerts(30),
      ]);

      setSummary(overviewRes?.summary || overviewRes?.data?.summary || { totalSKUs: 0, totalUnits: 0, lowStockCount: 0 });
      setInventoryList(overviewRes?.inventory || overviewRes?.data?.inventory || []);
      setLowStockAlerts(lowRes?.alerts || lowRes?.data?.alerts || []);
      setExpiringBatches(expRes?.expiringBatches || expRes?.data?.expiringBatches || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch inventory telemetry' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      loadInventoryData();
    }
  }, [notifications.length]);

  const handleOpenAdjust = (prodId, currentStock, prodName) => {
    setSelectedProduct({ id: prodId, name: prodName, currentStock });
    setAdjQuantity(currentStock);
    setAdjReason('Routine physical audit cycle count');
    setShowAdjModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmittingAdj(true);
    setMessage(null);

    try {
      await inventoryService.adjustStock({
        productId: selectedProduct.id,
        newQuantity: Number(adjQuantity),
        reason: adjReason,
      });

      setMessage({
        type: 'success',
        text: `Stock for ${selectedProduct.name} adjusted to ${adjQuantity} units (recorded in immutable audit trail).`,
      });
      setShowAdjModal(false);
      loadInventoryData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Stock adjustment failed' });
    } finally {
      setSubmittingAdj(false);
    }
  };

  // Filtered Inventory
  const filteredInventory = inventoryList.filter((inv) => {
    const prodName = inv.productId?.name?.toLowerCase() || '';
    const barcode = inv.productId?.barcode?.toLowerCase() || '';
    const matchesSearch = prodName.includes(searchTerm.toLowerCase()) || barcode.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (stockFilter === 'low') return inv.totalStock > 0 && inv.totalStock <= inv.reorderLevel;
    if (stockFilter === 'out') return inv.totalStock === 0;
    if (stockFilter === 'healthy') return inv.totalStock > inv.reorderLevel;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold uppercase tracking-wider">
                Logistics & Warehouse Operations
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                ></span>
                <span>{connected ? 'WebSocket Live' : 'Connecting WS...'}</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Inventory Command Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              First-Expiry First-Out (FEFO) batch intake, reorder thresholds, expiry warnings & vendor POs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/inventory/purchase-orders">
              <Button variant="secondary" size="sm" className="shadow-sm">
                <FileText className="w-4 h-4 mr-1.5 text-blue-500" />
                Purchase Orders
              </Button>
            </Link>
            <Link to="/inventory/suppliers">
              <Button variant="secondary" size="sm" className="shadow-sm">
                <Truck className="w-4 h-4 mr-1.5 text-emerald-500" />
                Suppliers Directory
              </Button>
            </Link>
            <Link to="/inventory/products">
              <Button variant="primary" size="sm" className="shadow-sm">
                <Package className="w-4 h-4 mr-1.5" />
                Product Master Catalog
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback message */}
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

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Units On-Hand
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {loading ? '...' : `${summary.totalUnits} Units`}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all tracked warehouse aisles</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Monitored SKUs
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {loading ? '...' : `${summary.totalSKUs} SKUs`}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">100% indexed with unique barcodes</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Low-Stock Alerts
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {loading ? '...' : `${summary.lowStockCount} Products`}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">At or below reorder threshold</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expiring in 30 Days
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {loading ? '...' : `${expiringBatches.length} Batches`}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">FEFO Radar active & monitoring</p>
          </div>
        </div>

        {/* 2-Column Dashboard Grid: Expiry Radar & Low Stock Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Expiry Radar Panel */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Smart Expiry Radar (FEFO)</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Batches sorted by earliest expiration date</p>
                  </div>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  {expiringBatches.length} items flagged
                </span>
              </div>

              {expiringBatches.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No batches approaching expiry within 30 days.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {expiringBatches.map((item, index) => {
                    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
                    if (item.urgency === 'critical') {
                      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80 animate-pulse';
                    } else if (item.urgency === 'warning') {
                      badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/80';
                    }

                    return (
                      <div
                        key={index}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.productName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Batch: <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.batchNumber}</span> • Qty:{' '}
                            <span className="text-slate-900 dark:text-white font-bold">{item.batchQuantity}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}`}
                          >
                            {item.daysRemaining <= 0
                              ? 'Expired'
                              : `${item.daysRemaining} days left`}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Exp: {formatDate(item.expiryDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-500" />
                First-Expiry First-Out (FEFO) enforces automated depletion
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">FEFO Priority #1</span>
            </div>
          </div>

          {/* Low Stock Alerts & Fast Adjustment */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Low-Stock Alert Center</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Items requiring immediate vendor replenishment</p>
                  </div>
                </div>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  {lowStockAlerts.length} stockout risks
                </span>
              </div>

              {lowStockAlerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                  All inventory stocks are above configured reorder levels.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {lowStockAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-rose-200 dark:border-rose-900/30 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{alert.productId?.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Location: <span className="text-slate-700 dark:text-slate-300">{alert.shelfLocation}</span> • Reorder Level:{' '}
                          {alert.reorderLevel}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                            {alert.totalStock} units
                          </div>
                          <div className="text-[10px] text-rose-500 uppercase font-semibold">
                            Critical Low
                          </div>
                        </div>

                        <Button
                          onClick={() =>
                            handleOpenAdjust(alert.productId?._id, alert.totalStock, alert.productId?.name)
                          }
                          size="sm"
                          variant="secondary"
                        >
                          Adjust
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Automatic notification dispatched via WebSocket</span>
              <Link to="/inventory/purchase-orders" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                Generate PO <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* FEFO Batch Master Visualizer & Inventory Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                FEFO Batch Pipeline & Stock Levels
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect physical shelf locations, active batch expiries, and reorder status
              </p>
            </div>

            {/* Filter buttons & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by product or barcode..."
                  className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    stockFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({inventoryList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    stockFilter === 'low'
                      ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('healthy')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    stockFilter === 'healthy'
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Healthy
                </button>
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name & Barcode</th>
                  <th className="py-3 px-4">Shelf Location</th>
                  <th className="py-3 px-4 text-center">Total Units</th>
                  <th className="py-3 px-4 text-center">Reorder Level</th>
                  <th className="py-3 px-4">Active Batches (FEFO Order)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No inventory records match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((inv) => {
                    const isLow = inv.totalStock > 0 && inv.totalStock <= inv.reorderLevel;
                    const isOut = inv.totalStock === 0;

                    return (
                      <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {inv.productId?.name || 'Unknown Product'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {inv.productId?.barcode || 'No barcode'} • ₹{inv.productId?.sellingPrice}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                          {inv.shelfLocation || 'Main Aisle'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono text-sm font-bold ${
                            isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {inv.totalStock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                          {inv.reorderLevel}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {inv.batches && inv.batches.length > 0 ? (
                              inv.batches.map((batch, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                  title={`Expires: ${formatDate(batch.expiryDate)} | Qty: ${batch.quantity}`}
                                >
                                  <span className="font-bold text-slate-900 dark:text-white">{batch.batchNumber}:</span>
                                  <span>{batch.quantity}u</span>
                                  <span className="text-slate-400 text-[9px]">({formatDate(batch.expiryDate)})</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">No batches</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            onClick={() => handleOpenAdjust(inv.productId?._id, inv.totalStock, inv.productId?.name)}
                            size="sm"
                            variant="secondary"
                          >
                            <Sliders className="w-3.5 h-3.5 mr-1" />
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Adjustment Modal with Mandatory Audit Reason */}
        {showAdjModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  Manual Inventory Adjustment
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Target Product:</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedProduct?.name}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-mono font-semibold">
                    Current Recorded Stock: {selectedProduct?.currentStock} units
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Verified Physical Stock Count *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mandatory Audit Justification *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    placeholder="e.g. Broken packaging write-off, Cycle count correction..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    * This action is permanently recorded in the Immutable System Audit Trail.
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    onClick={() => setShowAdjModal(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingAdj}
                    variant="primary"
                  >
                    {submittingAdj ? 'Logging Audit...' : 'Commit Adjustment'}
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
