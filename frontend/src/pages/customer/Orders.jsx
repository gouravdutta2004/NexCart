import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import { 
  ShoppingBag, 
  Receipt, 
  Download, 
  ExternalLink, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Eye,
  CreditCard,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Tag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import useSocket from '../../hooks/useSocket';

export default function Orders() {
  const { user } = useAuth();
  const toast = useToast();
  const { on, off } = useSocket();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [downloadingId, setDownloadingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchOrders(page);

    const handleOrderStatusUpdate = () => {
      fetchOrders(page);
    };

    on('order_status', handleOrderStatusUpdate);
    return () => {
      off('order_status', handleOrderStatusUpdate);
    };
  }, [page, on, off]);

  const fetchOrders = async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getMyOrders(pageNum, 10);
      setOrders(res.data || []);
      setPagination(res.meta || { total: 0, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId, orderNumber) => {
    try {
      setDownloadingId(invoiceId);
      await orderService.downloadInvoicePdf(invoiceId, orderNumber);
      toast.success(`Tax Invoice #${orderNumber} downloaded successfully.`, 'Invoice PDF');
    } catch (err) {
      toast.error(err.message || 'Could not download invoice PDF. Please try again.', 'Download Error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancelOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to cancel order #${orderNumber}? Any reserved stock will be automatically returned to inventory.`)) {
      return;
    }
    try {
      setCancellingId(orderId);
      await orderService.updateOrderStatus(orderId, 'cancelled');
      toast.success(`Order #${orderNumber} cancelled successfully.`, 'Order Cancelled');
      fetchOrders(page);
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: 'cancelled' }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order.', 'Cancellation Error');
    } finally {
      setCancellingId(null);
    }
  };

  const getOrderTypeBadge = (type) => {
    switch (type) {
      case 'online':
        return <Badge variant="emerald" size="sm">Online Delivery</Badge>;
      case 'pos_walkin':
        return <Badge variant="info" size="sm">POS In-Store</Badge>;
      case 'self_checkout':
        return <Badge variant="purple" size="sm">Self-Checkout</Badge>;
      default:
        return <Badge size="sm">{type}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Order History & Digital Invoices
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Itemized billing, FEFO batch allocations, and GST tax invoice receipts
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={ShoppingBag}
            onClick={() => navigate('/catalog')}
          >
            Explore Catalog
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Table */}
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Your completed purchases and supermarket self-checkout orders will be displayed here."
            actionLabel="Start Shopping Now"
            onAction={() => navigate('/catalog')}
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Order Ref</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {orders.map((ord) => (
                  <TableRow key={ord._id}>
                    <TableCell>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {ord.orderNumber}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(ord.createdAt)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {getOrderTypeBadge(ord.orderType)}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {ord.items?.length || 0} {ord.items?.length === 1 ? 'item' : 'items'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono font-bold text-slate-900 dark:text-emerald-400">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={ord.orderStatus} type="order" size="sm" />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Eye}
                          onClick={() => setSelectedOrder(ord)}
                        >
                          View
                        </Button>

                        {ord.orderStatus === 'pending' && (
                          <Button
                            variant="danger"
                            size="xs"
                            disabled={cancellingId === ord._id}
                            onClick={() => handleCancelOrder(ord._id, ord.orderNumber)}
                          >
                            {cancellingId === ord._id ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}

                        {(ord.invoiceId || ord.invoice?._id) && (
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(ord.invoiceId || ord.invoice?._id, ord.orderNumber)}
                            disabled={downloadingId === (ord.invoiceId || ord.invoice?._id)}
                            title="Download Tax Invoice PDF"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors disabled:opacity-50"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* ORDER DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          size="lg"
          title={`Order #${selectedOrder.orderNumber}`}
          description={`Placed on ${formatDateTime(selectedOrder.createdAt)} • ${selectedOrder.orderType.toUpperCase()}`}
        >
          <div className="space-y-6">
            {/* Status & Delivery Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Fulfillment Status</span>
                <div><StatusBadge status={selectedOrder.orderStatus} type="order" size="sm" /></div>
                <div className="mt-2 text-slate-500">
                  Payment: <strong className="text-slate-900 dark:text-white uppercase">{selectedOrder.paymentStatus}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Shipping Destination</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedOrder.shippingAddress?.fullName || 'Counter Collection'}
                </p>
                <p className="text-slate-500">
                  {selectedOrder.shippingAddress?.addressLine1 || 'Storefront POS Lane'}
                </p>
              </div>
            </div>

            {/* Line Items with FEFO Batch Allocation Display */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Purchased Items & FEFO Allocations
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {it.name || it.product?.name}
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Qty: {it.quantity} × {formatCurrency(it.unitPrice)} • {it.taxRate}% GST
                      </p>
                      {/* Batch allocation breakdown */}
                      {it.batchAllocations && it.batchAllocations.length > 0 && (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-semibold">Batches:</span>
                          {it.batchAllocations.map((alloc, bIdx) => (
                            <span
                              key={bIdx}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            >
                              {alloc.batchNumber}: {alloc.deductedQty} units
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(it.subtotal || it.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount ({selectedOrder.couponCode}):</span>
                  <span className="font-mono">-{formatCurrency(selectedOrder.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Total Tax (GST):</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(selectedOrder.taxTotal)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-baseline font-bold text-sm">
                <span className="text-slate-900 dark:text-white">Grand Total:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {selectedOrder.orderStatus === 'pending' ? (
                <Button
                  variant="danger"
                  size="md"
                  disabled={cancellingId === selectedOrder._id}
                  onClick={() => handleCancelOrder(selectedOrder._id, selectedOrder.orderNumber)}
                >
                  {cancellingId === selectedOrder._id ? 'Cancelling Order...' : 'Cancel This Order'}
                </Button>
              ) : <div />}

              {(selectedOrder.invoiceId || selectedOrder.invoice?._id) && (
                <Button
                  variant="primary"
                  size="md"
                  icon={Download}
                  disabled={downloadingId === (selectedOrder.invoiceId || selectedOrder.invoice?._id)}
                  onClick={() => handleDownloadInvoice(selectedOrder.invoiceId || selectedOrder.invoice?._id, selectedOrder.orderNumber)}
                >
                  Download Official Tax Invoice (PDF)
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
