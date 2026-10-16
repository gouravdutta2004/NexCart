import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Sparkles,
  QrCode,
  PackageCheck,
  Receipt,
  Download,
  Loader2,
  Info,
  Zap,
  Printer
} from 'lucide-react';
import posService from '../../services/posService';
import orderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Button from '../../components/ui/Button';

export default function SelfCheckout() {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItems, setScannedItems] = useState([]);
  const [lastScannedItem, setLastScannedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [checkoutComplete]);

  const playScanChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio playback restrictions fallback
    }
  };

  const handleScan = async (codeToLookup) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const res = await posService.lookupBarcode(code);
      const product = res?.product || res?.data?.product;
      if (!product) throw new Error('Product not found for scanned barcode');

      playScanChime();
      setLastScannedItem(product);

      setScannedItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === product._id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx].quantity += 1;
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
            },
          ];
        }
      });

      setBarcodeInput('');
    } catch (err) {
      setError(err.message || 'Product barcode not found');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const updateQuantity = (idx, newQty) => {
    if (newQty <= 0) {
      setScannedItems(scannedItems.filter((_, i) => i !== idx));
      return;
    }
    const updated = [...scannedItems];
    updated[idx].quantity = newQty;
    setScannedItems(updated);
  };

  const removeItem = (idx) => {
    setScannedItems(scannedItems.filter((_, i) => i !== idx));
  };

  const subtotal = scannedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const totalTax = scannedItems.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity * (item.taxRate || 0)) / 100,
    0
  );
  const grandTotal = subtotal + totalTax;

  const handleCompleteSelfCheckout = async () => {
    if (scannedItems.length === 0) return;
    setSubmittingOrder(true);
    setError(null);

    try {
      // 1. Pre-checkout stock and product availability validation
      await posService.validateCheckout(scannedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })));

      // 2. Atomic Order placement with server-authoritative pricing
      const payload = {
        orderType: 'self_checkout',
        items: scannedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentDetails: {
          method: 'upi',
          customerName: user?.name || 'In-Store Guest',
          tenderDetails: {
            terminalLane: 'SC-04',
            upiId: user?.email ? `${user.email.split('@')[0]}@okhdfcbank` : 'guest@okhdfcbank',
          },
        },
      };

      const res = await orderService.createOrder(payload);
      const invoiceData = res?.data?.invoice || res?.invoice || {};
      const orderData = res?.data?.order || res?.order || {};

      setReceiptData({
        invoiceId: invoiceData._id,
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        orderNumber: orderData.orderNumber,
        date: new Date(),
        customer: user?.name || 'In-Store Guest',
        items: [...scannedItems],
        subtotal,
        totalTax,
        grandTotal,
      });

      setCheckoutComplete(true);
    } catch (err) {
      setError(err.message || 'Failed to complete self-checkout order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleNewShopper = () => {
    setScannedItems([]);
    setLastScannedItem(null);
    setCheckoutComplete(false);
    setReceiptData(null);
    setBarcodeInput('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!checkoutComplete ? (
          <div>
            {/* Express Kiosk Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold uppercase tracking-wider">
                    Self-Checkout Express Kiosk
                  </span>
                  <span className="text-slate-500 text-xs font-mono">Terminal #SC-04</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Scan & Bag Your Groceries
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Point barcode at scanner or tap sample buttons to ring items immediately
                </p>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
              </Link>
            </div>

            {/* Supermarket Optical Scanner Viewport HUD */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-xl mb-6">
              {/* Telemetry Header */}
              <div className="px-4 sm:px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">Omni-Directional Laser Active</span>
                  <span className="text-slate-600 hidden sm:inline">|</span>
                  <span className="hidden sm:inline">60 FPS OPTICAL</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">SECURITY SCALE:</span>
                  <span className="text-emerald-300 font-bold font-mono">
                    {(scannedItems.reduce((acc, i) => acc + i.quantity * 0.45, 0)).toFixed(2)} KG BALANCED
                  </span>
                  <span className="text-slate-600 hidden sm:inline">|</span>
                  <span className="text-slate-400 hidden sm:inline">SLOT: SC-04</span>
                </div>
              </div>

              {/* Optical Scanning Chamber */}
              <div className="relative h-44 sm:h-48 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 select-none">
                {/* Precision Grid Dots */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none" 
                  style={{ 
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)', 
                    backgroundSize: '24px 24px' 
                  }} 
                />

                {/* Laser Sweep Beam */}
                <div className="absolute left-6 right-6 h-0.5 bg-red-500 shadow-[0_0_14px_3px_rgba(239,68,68,0.7)] animate-scan-laser pointer-events-none" />

                {/* Reticle Target Frame */}
                <div className="relative w-64 sm:w-80 h-28 border border-dashed border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br" />

                  <div className="w-12 h-0.5 bg-emerald-400/40 rounded-full" />

                  {lastScannedItem ? (
                    <div className="absolute inset-x-2 -bottom-3 translate-y-full text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Rung: {lastScannedItem.name} — {formatCurrency(lastScannedItem.sellingPrice || lastScannedItem.unitPrice)}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-x-0 -bottom-3 translate-y-full text-center">
                      <span className="text-[11px] text-slate-400 font-mono tracking-wide">
                        Point packaging barcode at glass scanner window
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scan Bar & Sample Buttons */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScan();
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <Scan className="w-6 h-6 absolute left-4 top-3.5 text-emerald-600 dark:text-emerald-400" />
                  <input
                    ref={inputRef}
                    data-barcode-input="true"
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan product barcode (EAN)..."
                    className="w-full pl-13 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-mono text-base placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="px-6 py-3.5 rounded-2xl shadow-md"
                >
                  {loading ? 'Reading...' : 'Scan Item'}
                </Button>
              </form>

              {/* Sample Quick Scan Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Touch to Scan:
                </span>
                <button
                  type="button"
                  onClick={() => handleScan('8901030001011')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
                >
                  Amul Milk (₹66)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan('8901030002018')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
                >
                  Kashmir Apples (₹180)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan('8901030003015')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
                >
                  Aashirvaad Atta (₹245)
                </button>
                <button
                  type="button"
                  onClick={() => handleScan('8901030005019')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
                >
                  Lay's Chips (₹35)
                </button>
              </div>

              {error && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  {error}
                </div>
              )}
            </div>

            {/* Scanned Bag Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Scanned Bag Contents ({scannedItems.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  {scannedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setScannedItems([])}
                      className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      Empty Bag
                    </button>
                  )}
                </div>

                {scannedItems.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 shadow-sm">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-500" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Your bagging area is empty</h3>
                    <p className="text-xs text-slate-500">Scan items using the barcode field or touch quick items above.</p>
                  </div>
                ) : (
                  scannedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{item.name}</h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {formatCurrency(item.unitPrice)} each • GST: {item.taxRate}%
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-bold font-mono text-sm text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 min-w-16 text-right">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Running Grand Total Card */}
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
                    Payment Summary
                  </h3>

                  <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-slate-900 dark:text-white font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (Estimated):</span>
                      <span className="font-mono text-slate-900 dark:text-white font-medium">{formatCurrency(totalTax)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Total Due:</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Demo Simulation Note */}
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span><strong>Simulated UPI Tender:</strong> Auto-authorizes instantly & releases stock.</span>
                  </div>

                  <Button
                    onClick={handleCompleteSelfCheckout}
                    disabled={scannedItems.length === 0 || submittingOrder}
                    variant="primary"
                    className="w-full py-4 text-base font-black shadow-lg"
                  >
                    {submittingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Authorizing & Generating Invoice...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay Now & Bag
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Checkout Complete Digital Slip */
          <div className="max-w-md mx-auto text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Payment Successful!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Thank you for using NexCart Express Self-Checkout</p>

            {/* Top Serrated Edge */}
            <div className="overflow-hidden leading-none text-white dark:text-slate-900 -mb-1">
              <svg className="w-full h-2.5 fill-current" preserveAspectRatio="none" viewBox="0 0 200 8">
                <polygon points="0,8 5,0 10,8 15,0 20,8 25,0 30,8 35,0 40,8 45,0 50,8 55,0 60,8 65,0 70,8 75,0 80,8 85,0 90,8 95,0 100,8 105,0 110,8 115,0 120,8 125,0 130,8 135,0 140,8 145,0 150,8 155,0 160,8 165,0 170,8 175,0 180,8 185,0 190,8 195,0 200,8" />
              </svg>
            </div>

            <div className="printable-receipt p-6 bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 text-left space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Slip #{receiptData.invoiceNumber}</div>
                  {receiptData.orderNumber && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                      Order #{receiptData.orderNumber}
                    </div>
                  )}
                </div>
                <span className="font-mono text-slate-400 dark:text-slate-500">{formatDateTime(receiptData.date)}</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                {receiptData.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>{it.quantity}x {it.name}</span>
                    <span className="font-mono font-semibold">{formatCurrency(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-medium">{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>GST:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-medium">{formatCurrency(receiptData.totalTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>TOTAL CHARGED:</span>
                  <span className="font-mono text-base">{formatCurrency(receiptData.grandTotal)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-slate-900 dark:text-white font-semibold block">Digital Exit Pass Verified</span>
                    <span className="text-[10px] text-slate-500">Scan at supermarket security gate</span>
                  </div>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                  PAID
                </span>
              </div>
            </div>

            {/* Bottom Serrated Edge */}
            <div className="overflow-hidden leading-none text-white dark:text-slate-900 -mt-1 mb-6">
              <svg className="w-full h-2.5 fill-current" preserveAspectRatio="none" viewBox="0 0 200 8">
                <polygon points="0,0 5,8 10,0 15,8 20,0 25,8 30,0 35,8 40,0 45,8 50,0 55,8 60,0 65,8 70,0 75,8 80,0 85,8 90,0 95,8 100,0 105,8 110,0 115,8 120,0 125,8 130,0 135,8 140,0 145,8 150,0 155,8 160,0 165,8 170,0 175,8 180,0 185,8 190,0 195,8 200,0" />
              </svg>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => window.print()}
                  variant="secondary"
                  className="flex-1 py-3.5 shadow-sm"
                >
                  <Printer className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-300" />
                  Print Exit Pass
                </Button>
                {receiptData.invoiceId && user && (
                  <Button
                    onClick={async () => {
                      try {
                        await orderService.downloadInvoicePdf(receiptData.invoiceId, receiptData.invoiceNumber || receiptData.orderNumber);
                      } catch (err) {
                        setError(err.message || 'Could not download invoice PDF.');
                      }
                    }}
                    variant="secondary"
                    className="flex-1 py-3.5 shadow-sm"
                  >
                    <Download className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                    Download PDF
                  </Button>
                )}
              </div>
              {!user && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-normal">
                  Exit pass above serves as verified proof of payment for door security. Sign in or register to access permanent PDF tax invoices.
                </p>
              )}
              <Button
                onClick={handleNewShopper}
                variant="primary"
                className="w-full py-3.5 shadow-md"
              >
                Start Next Customer Checkout →
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
