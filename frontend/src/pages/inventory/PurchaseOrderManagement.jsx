import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  PackageCheck, 
  Layers, 
  IndianRupee,
  Trash2,
  Loader2
} from 'lucide-react';
import purchaseOrderService from '../../services/purchaseOrderService';
import supplierService from '../../services/supplierService';
import productService from '../../services/productService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';

export default function PurchaseOrderManagement() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);

  // New PO Form
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState([{ productId: '', orderedQty: 20, unitCost: 20.0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [receivingId, setReceivingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancelPO = async (poId, poNumber) => {
    const reason = window.prompt(`Please enter cancellation reason for ${poNumber} (optional):`, 'Order placed in error / supplier unavailable');
    if (reason === null) return;
    setCancellingId(poId);
    setMessage(null);
    try {
      await purchaseOrderService.cancelPurchaseOrder(poId, reason);
      setMessage({
        type: 'success',
        text: `Successfully cancelled Purchase Order ${poNumber}.`,
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'PO cancellation failed' });
    } finally {
      setCancellingId(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, prodRes] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(),
        supplierService.getSuppliers(),
        productService.getProducts({ limit: 100 }),
      ]);
      setPurchaseOrders(poRes?.purchaseOrders || poRes?.data?.purchaseOrders || []);
      setSuppliers(supRes?.suppliers || supRes?.data?.suppliers || []);
      setProducts(prodRes?.data?.products || prodRes?.products || []);
      if ((supRes?.suppliers || supRes?.data?.suppliers)?.length > 0 && !selectedSupplier) {
        setSelectedSupplier((supRes?.suppliers || supRes?.data?.suppliers)[0]._id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load purchase orders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItemRow = () => {
    const firstProd = products[0];
    setPoItems([
      ...poItems,
      {
        productId: firstProd?._id || '',
        orderedQty: 25,
        unitCost: firstProd?.costPrice || 20.0,
      },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...poItems];
    updated[index][field] = value;
    if (field === 'productId') {
      const selectedProd = products.find((p) => p._id === value);
      if (selectedProd) {
        updated[index].unitCost = selectedProd.costPrice;
      }
    }
    setPoItems(updated);
  };

  const calculateTotal = () => {
    return poItems.reduce((sum, item) => sum + (Number(item.orderedQty) || 0) * (Number(item.unitCost) || 0), 0);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedSupplier) {
      setMessage({ type: 'error', text: 'Please select a registered supplier before generating a purchase order.' });
      return;
    }

    if (!poItems || poItems.length === 0 || poItems.some((i) => !i.productId || Number(i.orderedQty) <= 0 || Number(i.unitCost) < 0)) {
      setMessage({ type: 'error', text: 'All PO items must have a valid product selected with quantity > 0 and valid unit cost.' });
      return;
    }

    setSubmitting(true);

    try {
      await purchaseOrderService.createPurchaseOrder({
        supplierId: selectedSupplier,
        items: poItems,
      });
      setMessage({ type: 'success', text: 'Purchase Order generated successfully!' });
      setShowModal(false);
      setPoItems([{ productId: products[0]?._id || '', orderedQty: 20, unitCost: 20.0 }]);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'PO Creation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveStock = async (poId, poNumber) => {
    setReceivingId(poId);
    setMessage(null);
    try {
      await purchaseOrderService.receivePurchaseOrder(poId);
      setMessage({
        type: 'success',
        text: `Successfully received ${poNumber}! All batches deposited into FEFO inventory.`,
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Stock receipt failed' });
    } finally {
      setReceivingId(null);
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
              <span className="text-xs text-slate-500">Procurement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              Purchase Orders & Stock Receiving
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Procure goods from Indian FMCG suppliers & automatically deposit batches into FEFO inventory
            </p>
          </div>

          <Button
            onClick={() => {
              if (products.length > 0 && !poItems[0].productId) {
                poItems[0].productId = products[0]._id;
                poItems[0].unitCost = products[0].costPrice;
              }
              setShowModal(true);
            }}
            variant="primary"
            className="shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Purchase Order
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

        {/* PO Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-center">Items Ordered</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => {
                    const isReceived = po.status === 'received';

                    return (
                      <tr key={po._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {po.poNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {po.supplierId?.name || 'Authorized Supplier'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {po.supplierId?.contactPerson || 'Vendor Rep'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">{po.items?.length || 0} Products</span>
                          <div className="text-[10px] text-slate-400">
                            {po.items?.reduce((s, i) => s + (i.orderedQty || 0), 0)} total units
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(po.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(po.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isReceived ? (
                            <span className="text-xs text-slate-400 font-mono">
                              Deposited into FEFO
                            </span>
                          ) : po.status === 'cancelled' ? (
                            <span className="text-xs text-rose-500 font-mono">
                              Cancelled
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleReceiveStock(po._id, po.poNumber)}
                                disabled={receivingId === po._id || cancellingId === po._id}
                                size="sm"
                                variant="success"
                              >
                                <PackageCheck className="w-3.5 h-3.5 mr-1" />
                                {receivingId === po._id ? 'Receiving...' : 'Receive'}
                              </Button>
                              <Button
                                onClick={() => handleCancelPO(po._id, po.poNumber)}
                                disabled={receivingId === po._id || cancellingId === po._id}
                                size="sm"
                                variant="danger"
                              >
                                {cancellingId === po._id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Purchase Order Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Generate New Purchase Order
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Select FMCG Supplier *
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.paymentTerms})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Items */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Ordered Products Line Items
                    </span>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line Item
                    </button>
                  </div>

                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} (Cost: ₹{p.costPrice?.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.orderedQty}
                          onChange={(e) => handleItemChange(idx, 'orderedQty', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          required
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                          placeholder="Unit Cost"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={poItems.length === 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Subtotal Footer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Purchase Commitment:</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(calculateTotal())}
                  </span>
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
                    {submitting ? 'Placing Order...' : 'Dispatch Purchase Order'}
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
