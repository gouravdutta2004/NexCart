import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  AlertTriangle,
  Package
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import Button from '../ui/Button';

export default function CartDrawer() {
  const { 
    items, 
    itemCount, 
    subtotal, 
    estimatedTax, 
    grandTotal, 
    isDrawerOpen, 
    closeDrawer, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Shopping Cart</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in basket
                </p>
              </div>
            </div>

            <button
              onClick={closeDrawer}
              aria-label="Close cart"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-slate-700">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                  Explore fresh dairy, bakery, beverages, and grocery deals from our supermarket catalog!
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    closeDrawer();
                    navigate('/catalog');
                  }}
                >
                  Explore Product Catalog
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item._id || item.productId._id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {item.productId.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatCurrency(item.price)} each • {item.productId.unit}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId._id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock Warning Banner */}
                  {item.isOutOfStock && (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Only {item.availableStock} available in warehouse stock!
                    </div>
                  )}

                  {/* Quantity & Item Subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-xs text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-emerald-400">
                      {formatCurrency(item.itemTotal)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Checkout Commitment */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (GST):</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(estimatedTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconRight={ArrowRight}
                  onClick={() => {
                    closeDrawer();
                    if (!isAuthenticated) {
                      navigate('/login');
                    } else {
                      navigate('/checkout');
                    }
                  }}
                >
                  Proceed to Checkout
                </Button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full py-2 text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors text-center"
                >
                  Empty Shopping Basket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
