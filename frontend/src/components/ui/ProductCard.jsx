import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Star, 
  Heart, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle,
  Sparkles,
  Tag
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import Badge from './Badge';

export default function ProductCard({
  product,
  onAddToCart,
  onClick,
  badgeText,
  badgeVariant = 'emerald',
  className = '',
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const {
    name,
    brand,
    sellingPrice = 0,
    costPrice = 0,
    category,
    categoryId,
    totalStock = 0,
    barcode,
    unit = 'pcs',
    imageUrl,
  } = product;

  const categoryName = category?.name || categoryId?.name || (typeof category === 'string' ? category : 'Grocery');

  // Estimate a realistic MRP for discount display if not given
  const hasDiscount = Boolean(badgeText?.includes('DEAL') || badgeText?.includes('OFF') || product.isSmartDeal);
  const originalPrice = hasDiscount ? Math.round(sellingPrice * 1.2) : null;
  const discountPercent = originalPrice ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  const isLowStock = totalStock > 0 && totalStock <= 5;
  const isOutOfStock = totalStock === 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onAddToCart) {
      onAddToCart(product._id, quantity);
    }
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  // Deterministic subtle image placeholder if no image provided
  const placeholderBg = 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-850';

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex flex-col justify-between
        bg-white dark:bg-slate-900
        border border-slate-200/90 dark:border-slate-800
        rounded-2xl sm:rounded-3xl p-4 sm:p-5
        shadow-xs hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700
        hover:-translate-y-1 transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Top Badges & Wishlist */}
      <div className="relative w-full aspect-4/3 rounded-xl sm:rounded-2xl overflow-hidden mb-3.5 flex items-center justify-center bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        {/* Dynamic Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          {badgeText && (
            <Badge variant={badgeVariant} size="sm">
              {badgeText}
            </Badge>
          )}
          {discountPercent > 0 && !badgeText && (
            <Badge variant="emerald" size="sm">
              {discountPercent}% OFF
            </Badge>
          )}
          {isLowStock && (
            <Badge variant="warning" size="sm" dot>
              Only {totalStock} left
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="danger" size="sm">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`
            absolute top-2.5 right-2.5 z-10 p-2 rounded-xl backdrop-blur-md
            transition-all duration-150
            ${
              isWishlisted
                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-500 scale-110'
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:scale-105'
            }
          `}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Product Image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${placeholderBg}`}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6 stroke-[1.75]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {brand || 'NexCart'}
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span className="font-medium truncate max-w-[140px] uppercase text-[10px] tracking-wider text-emerald-600 dark:text-emerald-400">
            {categoryName}
          </span>
          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-semibold text-xs">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>4.8</span>
          </div>
        </div>

        {/* Product Name */}
        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
          {name}
        </h4>

        {/* Unit / Pack Size */}
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          Pack size: {unit} • Barcode: {barcode?.slice(-6) || '890103'}
        </p>

        {/* Price & Action */}
        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(sellingPrice)}
              </span>
              {originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Save {formatCurrency(originalPrice - sellingPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            aria-label={`Add ${name} to cart`}
            className={`
              inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
              transition-all duration-150 active:scale-95 shadow-xs
              ${
                isOutOfStock
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:shadow-emerald-600/20'
              }
            `}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
