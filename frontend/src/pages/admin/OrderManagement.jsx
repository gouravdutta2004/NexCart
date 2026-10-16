import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import orderService from '../../services/orderService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  TrendingUp, 
  Layers, 
  Smartphone,
  Store,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';

export default function OrderManagement() {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);
  const [statusActionMsg, setStatusActionMsg] = useState(null);

  useEffect(() => {
    fetchOrders();

    const handleOrderEvent = () => {
      fetchOrders();
    };

    on('new_order', handleOrderEvent);
    on('order_status', handleOrderEvent);
    on('pos_completed', handleOrderEvent);

    return () => {
      off('new_order', handleOrderEvent);
      off('order_status', handleOrderEvent);
      off('pos_completed', handleOrderEvent);
    };
  }, [page, statusFilter, channelFilter, on, off]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (channelFilter) params.orderType = channelFilter;

      const res = await orderService.getAllOrders(params);
      setOrders(res.data || []);
      setPagination(res.meta || { total: 0, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch supermarket orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setStatusActionMsg(null);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setStatusActionMsg(`Order status successfully updated to ${newStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: newStatus }));
      }
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getOrderTypeBadge = (type) => {
    switch (type) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <Smartphone className="w-3 h-3" /> Online Web
          </span>
        );
      case 'pos_walkin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            <Store className="w-3 h-3" /> POS Lane
          </span>
        );
      case 'self_checkout':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
            <Layers className="w-3 h-3" /> Self-Checkout
          </span>
        );
      default:
        return <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{type}</span>;
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
                to={user?.role === 'cashier' ? '/cashier' : '/admin'}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {user?.role === 'cashier' ? 'Cashier Hub' : 'Admin Console'}
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs text-slate-500">Order Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Supermarket Orders & Fulfillment
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Live unified transactions across Online Delivery, POS Lanes, and Express Self-Checkout
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchOrders}
              variant="secondary"
              size="sm"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            <Link to="/cashier/pos">
              <Button variant="primary" size="sm" className="shadow-md">
                Launch POS Lane →
              </Button>
            </Link>
          </div>
        </div>

        {statusActionMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{statusActionMsg}</span>
            </div>
            <button onClick={() => setStatusActionMsg(null)} className="text-emerald-600 hover:text-emerald-800 dark:hover:text-white">
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

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or customer name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Channels</option>
              <option value="online">Online Web Store</option>
              <option value="pos_walkin">Cashier POS Lane</option>
              <option value="self_checkout">Self-Checkout Kiosk</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400">Loading order registry...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Orders Match Query</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Try modifying search filters or place a new order from POS.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Order / Invoice #</th>
                      <th className="px-6 py-4">Customer & Cashier</th>
                      <th className="px-6 py-4">Channel & Time</th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Status & Update</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {orders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {ord.orderNumber}
                          </div>
                          {ord.invoice && (
                            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {ord.invoice.invoiceNumber}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {ord.customer?.name || ord.shippingAddress?.fullName || 'Walk-in / Guest'}
                          </div>
                          {ord.cashier && (
                            <div className="text-[10px] text-slate-500">
                              Cashier: {ord.cashier.name}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div>{getOrderTypeBadge(ord.orderType)}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            {formatDateTime(ord.createdAt)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-800 dark:text-white font-medium">
                            {ord.items?.length || 0} line items
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatCurrency(ord.totalAmount)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={ord.orderStatus} />
                            <select
                              value={ord.orderStatus}
                              disabled={updatingId === ord._id}
                              onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-700 dark:text-slate-400 focus:text-slate-900 dark:focus:text-white"
                            >
                              <option value="completed">Completed</option>
                              <option value="processing">Processing</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="View Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {ord.invoice && (
                              <button
                                type="button"
                                onClick={() =>
                                  orderService.downloadInvoicePdf(ord.invoice._id, ord.invoice.invoiceNumber || ord.orderNumber)
                                }
                                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                                title="Download GST Tax Invoice PDF"
                              >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-4">
              <Pagination
                currentPage={page}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                pageSize={10}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
                      Order #{selectedOrder.orderNumber}
                    </span>
                    {getOrderTypeBadge(selectedOrder.orderType)}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Order Details & FEFO Allocations</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block">Customer</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedOrder.customer?.name || selectedOrder.shippingAddress?.fullName || 'Walk-in'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Order Status</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{selectedOrder.orderStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Status</span>
                    <span className="text-slate-900 dark:text-white font-mono uppercase">{selectedOrder.paymentStatus}</span>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Item Breakdown & FEFO Batches</h4>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-950 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            SKU: {item.sku} | Barcode: {item.barcode}
                          </div>
                          {item.batchAllocations?.length > 0 && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                              FEFO Batches: {item.batchAllocations.map((b) => `${b.batchNumber} (${b.deductedQty}u)`).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white font-mono">
                            {formatCurrency(item.subtotal)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>GST Tax Total:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(selectedOrder.taxTotal)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline font-bold">
                    <span className="text-slate-900 dark:text-white text-sm">Total Revenue:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-lg">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <Button
                  onClick={() => setSelectedOrder(null)}
                  variant="secondary"
                  size="sm"
                >
                  Close
                </Button>
                {selectedOrder.invoice && (
                  <Button
                    onClick={() =>
                      orderService.downloadInvoicePdf(selectedOrder.invoice._id, selectedOrder.invoice.invoiceNumber || selectedOrder.orderNumber)
                    }
                    variant="primary"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download Official Tax Invoice (PDF)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
