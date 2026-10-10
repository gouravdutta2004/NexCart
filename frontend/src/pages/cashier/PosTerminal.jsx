import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  ShoppingBag, 
  PauseCircle, 
  PlayCircle, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Printer, 
  ArrowLeft,
  Sparkles,
  Percent,
  Receipt,
  Download,
  Loader2,
  User,
  Zap,
  Info
} from 'lucide-react';
import posService from '../../services/posService';
import orderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function PosTerminal() {
  const { user } = useAuth();
  const barcodeInputRef = useRef(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [billingItems, setBillingItems] = useState([]);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Held Carts
  const [heldCarts, setHeldCarts] = useState([]);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [customerName, setCustomerName] = useState('Walk-in Shopper');

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
    loadHeldCarts();
  }, []);

  const loadHeldCarts = async () => {
    try {
      const res = await posService.getHeldCarts();
      setHeldCarts(res?.heldCarts || res?.data?.heldCarts || []);
    } catch {
      // Ignored
    }
  };

  const handleScan = async (codeToLookup) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setLoadingScan(true);
    setScanError(null);

    try {
      const res = await posService.lookupBarcode(code);
      const product = res?.product || res?.data?.product;
      if (!product) throw new Error('Product not found for scanned barcode');

      setBillingItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.productId === product._id);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx].quantity += 1;
          return updated;
        } else {
          return [
            ...prev,
            {
              productId: product._id,
              name: product.name,
              barcode: product.barcode,
              unit: product.unit,
              unitPrice: product.sellingPrice,
              taxRate: product.taxRate,
              quantity: 1,
              discount: 0,
            },
          ];
        }
      });

      setBarcodeInput('');
    } catch (err) {
      setScanError(err.message || 'Product not recognized');
    } finally {
      setLoadingScan(false);
      barcodeInputRef.current?.focus();
    }
  };

  const updateQuantity = (idx, newQty) => {
    if (newQty <= 0) {
      removeItem(idx);
      return;
    }
    const updated = [...billingItems];
    updated[idx].quantity = newQty;
    setBillingItems(updated);
  };

  const updateDiscount = (idx, disc) => {
    const updated = [...billingItems];
    updated[idx].discount = Math.max(0, Number(disc) || 0);
    setBillingItems(updated);
  };

  const removeItem = (idx) => {
    setBillingItems(billingItems.filter((_, i) => i !== idx));
  };

  const clearBillingCart = () => {
    setBillingItems([]);
    setScanError(null);
    barcodeInputRef.current?.focus();
  };

  // Calculations
  const subtotal = billingItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const totalDiscount = billingItems.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );
  const totalTax = billingItems.reduce((sum, item) => {
    const netItemPrice = Math.max(0, item.unitPrice * item.quantity - (item.discount || 0));
    return sum + (netItemPrice * (item.taxRate || 0)) / 100;
  }, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  const handleHoldCart = async () => {
    if (billingItems.length === 0) return;
    try {
      await posService.holdCart({
        items: billingItems,
        customerName: customerName || 'Walk-in Shopper',
        notes: 'Held by cashier at POS Terminal',
      });
      clearBillingCart();
      loadHeldCarts();
    } catch (err) {
      setScanError(err.message || 'Failed to hold cart');
    }
  };

  const handleRecallCart = async (heldId) => {
    try {
      const res = await posService.recallCart(heldId);
      const recalled = res?.recalledCart || res?.data?.recalledCart;
      if (recalled?.items) {
        setBillingItems(recalled.items);
        setCustomerName(recalled.customerName || 'Walk-in Shopper');
      }
      setShowHeldModal(false);
      loadHeldCarts();
    } catch (err) {
      setScanError(err.message || 'Failed to recall cart');
    }
  };

  const handleOpenPayment = () => {
    if (billingItems.length === 0) return;
    setTenderedAmount(grandTotal.toFixed(2));
    setPaymentSuccess(false);
    setCompletedReceipt(null);
    setOrderError(null);
    setShowPaymentModal(true);
  };

  const handleFinalizePayment = async () => {
    const tendered = Number(tenderedAmount) || grandTotal;
    const change = Math.max(0, tendered - grandTotal);
    setProcessingOrder(true);
    setOrderError(null);

    try {
      const payload = {
        orderType: 'pos_walkin',
        items: billingItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentDetails: {
          method: paymentMethod,
          customerName: customerName,
          tenderDetails: {
            cashTendered: tendered,
            changeDue: change,
            terminalLane: 'LANE-01',
          },
        },
      };

      const res = await orderService.createOrder(payload);
      const invoiceData = res?.data?.invoice || res?.invoice || {};
      const orderData = res?.data?.order || res?.order || {};

      setCompletedReceipt({
        invoiceId: invoiceData._id,
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        orderNumber: orderData.orderNumber,
        date: new Date(),
        cashier: user?.name || 'Cashier',
        customer: customerName,
        items: [...billingItems],
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        paymentMethod,
        tendered,
        change,
      });

      setPaymentSuccess(true);
    } catch (err) {
      setOrderError(err.message || 'Failed to process POS checkout transaction');
    } finally {
      setProcessingOrder(false);
    }
  };

  const handleResetForNextCustomer = () => {
    clearBillingCart();
    setShowPaymentModal(false);
    setPaymentSuccess(false);
    setCompletedReceipt(null);
    setOrderError(null);
    setCustomerName('Walk-in Shopper');
    barcodeInputRef.current?.focus();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if inside active modal or typing in customer name
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (billingItems.length > 0 && !showPaymentModal) {
          handleHoldCart();
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (!showPaymentModal) {
          setShowHeldModal(true);
        }
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (billingItems.length > 0 && !showPaymentModal) {
          handleOpenPayment();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billingItems, showPaymentModal]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link 
              to="/cashier" 
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"
              title="Return to Cashier Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  High-Speed POS Lane 01
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ready to Bill
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Point of Sale Terminal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowHeldModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 shadow-sm transition-colors flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-amber-500" />
              Held Carts ({heldCarts.length})
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">[F8]</span>
            </button>
            <button
              onClick={handleHoldCart}
              disabled={billingItems.length === 0}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40 shadow-sm flex items-center gap-2"
            >
              <PauseCircle className="w-4 h-4 text-blue-500" />
              Hold Basket
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">[F7]</span>
            </button>
          </div>
        </div>

        {/* 2-Column POS Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Barcode Scanner & Line Items Table (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Barcode Scanner Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScan();
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <Scan className="w-5 h-5 absolute left-3.5 top-3.5 text-emerald-500 dark:text-emerald-400" />
                  <input
                    ref={barcodeInputRef}
                    data-barcode-input="true"
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan EAN Barcode or type code... (Hot-key: F2)"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loadingScan}
                  variant="primary"
                  className="py-3 px-6 shadow-md"
                >
                  {loadingScan ? 'Reading...' : 'Add Item'}
                </Button>
              </form>

              {/* Sample Scan Hot-Buttons (Strict Indian FMCG Barcodes & Rupee Prices) */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mr-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Quick Add:
                </span>
                <button
                  type="button"
                  onClick={() => handleScan('8901030001011')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono transition-colors"
                >
                  Amul Milk (₹66)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan('8901030002018')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono transition-colors"
                >
                  Kashmir Apples (₹180)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan('8901030003015')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono transition-colors"
                >
                  Aashirvaad Atta (₹245)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan('8901030004012')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono transition-colors"
                >
                  Real Juice (₹120)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan('8901030005019')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono transition-colors"
                >
                  Lay's Chips (₹35)
                </button>
              </div>

              {scanError && (
                <div className="mt-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {scanError}
                </div>
              )}
            </div>

            {/* Billing Items Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4">Item & EAN Code</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Disc (₹)</th>
                      <th className="py-3 px-4 text-center">GST %</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                      <th className="py-3 px-4 text-center w-12">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {billingItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center text-slate-400 dark:text-slate-500">
                          <Scan className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-emerald-500" />
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active bill is empty</div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Scan a barcode or click sample buttons above to ring items.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      billingItems.map((item, idx) => {
                        const lineGross = item.unitPrice * item.quantity;
                        const lineNet = Math.max(0, lineGross - (item.discount || 0));

                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white leading-tight">{item.name}</div>
                              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{item.barcode}</div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, item.quantity - 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-bold font-mono text-xs text-slate-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, item.quantity + 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <input
                                type="number"
                                step="0.50"
                                min="0"
                                value={item.discount || ''}
                                onChange={(e) => updateDiscount(idx, e.target.value)}
                                placeholder="0.00"
                                className="w-16 px-1.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-right font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="py-3 px-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                              {item.taxRate}%
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(lineNet)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                title="Remove Line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {billingItems.length > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {billingItems.reduce((s, i) => s + i.quantity, 0)} total units across {billingItems.length} lines
                  </span>
                  <button
                    type="button"
                    onClick={clearBillingCart}
                    className="text-rose-600 dark:text-rose-400 hover:underline font-semibold transition-colors"
                  >
                    Clear Bill (Void All)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Financial Summary & Tender Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Customer Information Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Customer Name / Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Shopper"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                Billing Summary
              </h2>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Item Discounts:</span>
                  <span className="font-mono font-medium">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (CGST + SGST):</span>
                  <span className="font-mono text-slate-900 dark:text-white font-medium">{formatCurrency(totalTax)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Net Payable:</span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Big Tender Button */}
              <Button
                onClick={handleOpenPayment}
                disabled={billingItems.length === 0}
                variant="primary"
                className="w-full py-3.5 text-base font-black shadow-lg"
              >
                <Banknote className="w-5 h-5 mr-2" />
                Tender Payment [F12]
              </Button>
            </div>

            {/* Cashier Hotkeys Guide */}
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Cashier Keyboard Shortcuts
              </span>
              <div className="flex justify-between font-mono text-[11px]">
                <span>F2: Autofocus Barcode Input</span>
                <span className="text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>F7: Hold Active Basket</span>
                <span className="text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>F8: Open Parked Carts Modal</span>
                <span className="text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>F12: Tender Payment Modal</span>
                <span className="text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Held Carts Modal */}
        {showHeldModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-amber-500" />
                  Parked / Held Baskets
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHeldModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {heldCarts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No carts are currently on hold.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {heldCarts.map((c) => (
                    <div
                      key={c._id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{c.cartReference}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.customerName} • {c.items.length} items</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Parked: {formatDateTime(c.heldAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(c.subtotal)}
                        </span>
                        <Button
                          onClick={() => handleRecallCart(c._id)}
                          size="sm"
                          variant="primary"
                        >
                          Recall
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Settlement & Thermal Receipt Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              {!paymentSuccess ? (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-500" />
                      Tender Payment Settlement
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Explicit Simulated Payment Banner */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 mb-4 font-medium">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span><strong>Demo POS Terminal:</strong> This triggers automated stock allocation and transactional receipt generation. No actual bank card deduction occurs.</span>
                  </div>

                  {/* Total Due Callout */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-5 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Net Amount Due:</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {['cash', 'upi', 'card', 'wallet'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold uppercase tracking-wider transition-all ${
                          paymentMethod === m
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Tendered Cash Amount (₹) *
                        </label>
                        <input
                          type="number"
                          step="1"
                          min={grandTotal}
                          value={tenderedAmount}
                          onChange={(e) => setTenderedAmount(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Quick Cash Buttons (INR Denominations) */}
                      <div className="flex flex-wrap gap-2">
                        {[100, 200, 500, 1000, 2000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTenderedAmount(val.toString())}
                            className="flex-1 min-w-[50px] py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            ₹{val}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTenderedAmount(grandTotal.toFixed(2))}
                          className="flex-1 min-w-[60px] py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 transition-colors"
                        >
                          Exact
                        </button>
                      </div>

                      {Number(tenderedAmount) >= grandTotal && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Change to Return:</span>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                            {formatCurrency(Number(tenderedAmount) - grandTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {orderError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      {orderError}
                    </div>
                  )}

                  <Button
                    onClick={handleFinalizePayment}
                    disabled={processingOrder}
                    variant="primary"
                    className="w-full py-4 text-base font-black shadow-lg"
                  >
                    {processingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Allocating Stock & Authorizing...
                      </>
                    ) : (
                      'Confirm & Print Receipt'
                    )}
                  </Button>
                </div>
              ) : (
                /* Thermal Receipt View */
                <div>
                  <div className="p-6 bg-white text-slate-900 rounded-2xl shadow-inner font-mono text-xs max-w-sm mx-auto mb-5 border border-slate-200">
                    <div className="text-center pb-3 border-b border-dashed border-slate-400 mb-3">
                      <div className="text-base font-black tracking-tight text-slate-900">NexCart Supermarket</div>
                      <div className="text-[10px] text-slate-600">Automated Retail System • GST Regd</div>
                      <div className="text-[10px] text-slate-500 mt-1">Receipt #{completedReceipt.invoiceNumber}</div>
                      {completedReceipt.orderNumber && (
                        <div className="text-[10px] text-emerald-700 font-bold">Order #{completedReceipt.orderNumber}</div>
                      )}
                      <div className="text-[10px] text-slate-500">{formatDateTime(completedReceipt.date)}</div>
                    </div>

                    <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-400 mb-3">
                      {completedReceipt.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate max-w-[180px]">
                            {item.quantity}x {item.name}
                          </span>
                          <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1 pb-3 border-b border-dashed border-slate-400 mb-3 text-[11px]">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(completedReceipt.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discounts:</span>
                        <span>-{formatCurrency(completedReceipt.totalDiscount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Total (GST):</span>
                        <span>{formatCurrency(completedReceipt.totalTax)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                        <span>TOTAL PAID:</span>
                        <span>{formatCurrency(completedReceipt.grandTotal)}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-[10px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="uppercase">{completedReceipt.paymentMethod}</span>
                      </div>
                      {completedReceipt.paymentMethod === 'cash' && (
                        <>
                          <div className="flex justify-between">
                            <span>Tendered:</span>
                            <span>{formatCurrency(completedReceipt.tendered)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>Change Given:</span>
                            <span>{formatCurrency(completedReceipt.change)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="text-center pt-4 border-t border-dashed border-slate-400 mt-4 text-[10px] text-slate-600">
                      Thank you for shopping at NexCart!<br />
                      Visit again soon.
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => window.print()}
                      variant="secondary"
                      className="flex-1 py-3 text-xs"
                    >
                      <Printer className="w-4 h-4 mr-1.5" />
                      Print Receipt
                    </Button>
                    {completedReceipt.invoiceId && (
                      <Button
                        onClick={() => orderService.downloadInvoicePdf(completedReceipt.invoiceId, completedReceipt.invoiceNumber)}
                        variant="outline"
                        className="flex-1 py-3 text-xs"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        Download Tax PDF
                      </Button>
                    )}
                    <Button
                      onClick={handleResetForNextCustomer}
                      variant="primary"
                      className="flex-1 py-3 text-xs"
                    >
                      Next Customer →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
