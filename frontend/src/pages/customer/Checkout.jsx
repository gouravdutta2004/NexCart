import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import orderService from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { 
  CreditCard, 
  MapPin, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  ArrowLeft,
  Truck,
  ShieldCheck,
  QrCode,
  Tag,
  X,
  Clock,
  Sparkles,
  Layers,
  Banknote
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, estimatedTax, grandTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1); // 1: Delivery Address, 2: Payment Method, 3: Confirmation
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '+91 98765 43210',
    addressLine1: 'Flat 402, Green Valley Towers',
    addressLine2: 'Baner Main Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411045',
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4111 2222 3333 4444',
    expiry: '12/28',
    cvv: '999',
    cardHolder: user?.name || 'Customer Name',
  });
  const [upiId, setUpiId] = useState(user?.email ? `${user.email.split('@')[0]}@okaxis` : 'customer@okaxis');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Promotional Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await api.post('/discounts/validate', {
        code: couponInput.trim(),
        orderSubtotal: subtotal,
      });
      setAppliedCoupon(res.data);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const couponDiscountAmount = appliedCoupon ? appliedCoupon.calculatedDiscount : 0;
  const finalPayableTotal = Math.max(0, Math.round((subtotal - couponDiscountAmount + estimatedTax) * 100) / 100);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Your shopping cart is empty');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        orderType: 'online',
        items: items.map((it) => ({
          productId: it.productId._id || it.productId,
          quantity: it.quantity,
        })),
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        shippingAddress,
        paymentDetails: {
          method: paymentMethod,
          customerName: shippingAddress.fullName,
          customerEmail: user?.email,
          customerPhone: shippingAddress.phone,
          tenderDetails: {
            cardLast4: paymentMethod === 'card' ? cardDetails.cardNumber.slice(-4) : '',
            upiId: paymentMethod === 'upi' ? upiId : '',
            terminalLane: 'WEB-PORTAL',
          },
        },
        notes: 'Online Supermarket Home Delivery Order',
      };

      const res = await orderService.createOrder(payload);
      const data = res?.data || res || {};

      setCompletedOrder({
        order: data.order,
        invoice: data.invoice,
        payment: data.payment,
      });

      // Clear the local shopping cart
      clearCart();
    } catch (err) {
      setError(err.message || 'Failed to complete order checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {!completedOrder ? (
          <div>
            {/* Header & Steps Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
              <div>
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
                </Link>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Checkout & Payment
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm shipping address, select simulated payment tender, and generate GST invoice
                </p>
              </div>

              {/* Multi-step indicator */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  1. Address
                </span>
                <span className="text-slate-400">→</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  2. Payment
                </span>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-sm mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your Basket is Empty</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Add products from our supermarket aisles before checking out</p>
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowLeft}
                  onClick={() => navigate('/catalog')}
                >
                  Browse Supermarket Catalog
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Multi-Step Accordion / Cards */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Step 1: Delivery Address */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Delivery Shipping Address
                        </h3>
                      </div>
                      <Badge variant="emerald" size="sm">Home Delivery</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={shippingAddress.fullName}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Contact Phone (+91)
                        </label>
                        <input
                          type="text"
                          name="phone"
                          required
                          value={shippingAddress.phone}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Flat / Street Address
                        </label>
                        <input
                          type="text"
                          name="addressLine1"
                          required
                          value={shippingAddress.addressLine1}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={shippingAddress.city}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Postal PIN Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          required
                          value={shippingAddress.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Step 2: Payment Method (Clearly labeled Simulated Payment) */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Payment Method
                        </h3>
                      </div>
                      <Badge variant="purple" size="sm">Simulated Demo Mode</Badge>
                    </div>

                    {/* Clear Academic / Portfolio Simulation Notice */}
                    <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5 mb-5">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Demo Payment Simulation:</strong> This platform is designed for academic demonstration. No real credit card or bank account will ever be charged.
                      </span>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`
                          p-3 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all
                          ${
                            paymentMethod === 'card'
                              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }
                        `}
                      >
                        <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold leading-none">Card</p>
                          <p className="text-[10px] text-slate-500 mt-1">Visa / RuPay</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`
                          p-3 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all
                          ${
                            paymentMethod === 'upi'
                              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }
                        `}
                      >
                        <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs font-bold leading-none">UPI / QR</p>
                          <p className="text-[10px] text-slate-500 mt-1">Instant Pay</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`
                          p-3 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all
                          ${
                            paymentMethod === 'cash'
                              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }
                        `}
                      >
                        <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-xs font-bold leading-none">Cash on Del.</p>
                          <p className="text-[10px] text-slate-500 mt-1">Pay at Door</p>
                        </div>
                      </button>
                    </div>

                    {/* Simulated Inputs based on method */}
                    {paymentMethod === 'card' && (
                      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Simulated Card Number
                          </label>
                          <input
                            type="text"
                            value={cardDetails.cardNumber}
                            onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Virtual Payment Address (VPA / UPI ID)
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                        />
                      </div>
                    )}

                    {paymentMethod === 'cash' && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        Please keep exact cash ready upon delivery. The delivery agent will generate a digital settlement receipt upon cash handover.
                      </div>
                    )}
                  </Card>
                </div>

                {/* Right Column: Sticky Order Summary & Coupon */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                  
                  {/* Coupon Code Card */}
                  <Card className="p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                      <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Promotional Coupon
                    </h3>

                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="e.g. WELCOME10"
                          className="flex-1 px-3 py-2 text-xs uppercase font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={couponLoading}
                          onClick={handleApplyCoupon}
                        >
                          Apply
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {appliedCoupon.code}
                          </span>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Coupon Applied: Saved {formatCurrency(appliedCoupon.calculatedDiscount)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs font-bold text-slate-400 hover:text-rose-500"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-[11px] text-rose-500 mt-2 font-medium">{couponError}</p>
                    )}
                  </Card>

                  {/* Order Financial Summary */}
                  <Card className="p-6">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Order Summary ({items.length} items)
                    </h3>

                    {/* Compact Item List */}
                    <div className="max-h-48 overflow-y-auto space-y-2.5 mb-4 pr-1 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((it) => (
                        <div key={it._id || it.productId._id} className="pt-2 flex justify-between gap-2">
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {it.productId?.name}
                            </span>
                            <span className="text-slate-400 block text-[11px]">
                              Qty: {it.quantity} × {formatCurrency(it.price)}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white font-mono shrink-0">
                            {formatCurrency(it.itemTotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatCurrency(subtotal)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span>Coupon Discount ({appliedCoupon.code}):</span>
                          <span className="font-mono">-{formatCurrency(couponDiscountAmount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Estimated GST (CGST + SGST):</span>
                        <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatCurrency(estimatedTax)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Standard Delivery:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">Free</span>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline font-bold">
                        <span className="text-sm text-slate-900 dark:text-white">Payable Total:</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(finalPayableTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-5">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={submitting}
                        iconRight={ArrowRight}
                      >
                        {submitting ? 'Allocating Stock & Authorizing...' : 'Place Order & Get Invoice'}
                      </Button>
                    </div>
                  </Card>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* ORDER CONFIRMATION & SUCCESS SCREEN (Section 14) */
          /* ========================================================================= */
          <div className="max-w-2xl mx-auto py-6 sm:py-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <Badge variant="success" size="md" dot>
                Order Confirmed
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
                Order #{completedOrder.order.orderNumber}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Your supermarket order has been atomically recorded with FEFO batch allocations and an official GST tax invoice.
              </p>
            </div>

            {/* Simple Order Progress Timeline */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Fulfillment Timeline
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white block">Order Placed</span>
                  <span className="text-slate-400 text-[10px] block">Just now</span>
                </div>

                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white block">FEFO Allocated</span>
                  <span className="text-slate-400 text-[10px] block">Earliest batches</span>
                </div>

                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white block">GST Invoice</span>
                  <span className="text-slate-400 text-[10px] block">{completedOrder.invoice.invoiceNumber}</span>
                </div>

                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <span className="font-medium text-slate-500 block">Out for Delivery</span>
                  <span className="text-slate-400 text-[10px] block">Packing in bay</span>
                </div>
              </div>
            </div>

            {/* Summary Details Box */}
            <Card className="p-6 text-left space-y-3">
              <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs text-slate-500">Delivering To:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {completedOrder.order.shippingAddress?.fullName} ({completedOrder.order.shippingAddress?.city})
                </span>
              </div>

              <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs text-slate-500">Payment Method:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                  {completedOrder.payment.paymentMethod} (Simulated)
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount Paid:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(completedOrder.order.totalAmount)}
                </span>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={Download}
                  onClick={() => orderService.downloadInvoicePdf(completedOrder.invoice._id, completedOrder.invoice.invoiceNumber || completedOrder.order.orderNumber)}
                >
                Download Invoice (PDF)
              </Button>

              <Button
                variant="secondary"
                size="md"
                icon={ShoppingBag}
                onClick={() => navigate('/customer/orders')}
              >
                View Order History
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate('/catalog')}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
