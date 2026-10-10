import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import CartDrawer from '../../components/cart/CartDrawer';
import ProductCard from '../../components/ui/ProductCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Sparkles, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  MessageSquare, 
  Tag, 
  ShieldCheck, 
  Eye,
  Plus,
  Minus,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import reviewService from '../../services/reviewService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortOption, setSortOption] = useState('name_asc');

  // Product Detail & Review Modal State
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [reviewsData, setReviewsData] = useState({ reviews: [], summary: { averageRating: 0, totalReviews: 0 } });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [sortByField, sortOrderDir] = sortOption.split('_');

      const [prodRes, catRes] = await Promise.all([
        productService.getProducts({
          search,
          categoryId: selectedCategory,
          sortBy: sortByField || 'name',
          sortOrder: sortOrderDir || 'asc',
          limit: 60,
        }),
        categoryService.getCategories().catch(() => ({ categories: [] })),
      ]);

      setProducts(prodRes?.data?.products || prodRes?.products || []);
      setCategories(catRes?.categories || catRes?.data?.categories || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [search, selectedCategory, sortOption]);

  const handleOpenProductDetail = async (prod) => {
    setActiveModalProduct(prod);
    setModalQty(1);
    setReviewFeedback(null);
    setReviewComment('');
    setLoadingReviews(true);

    try {
      const res = await reviewService.getProductReviews(prod._id);
      const data = res?.reviews ? res : (res?.data || { reviews: [], summary: { averageRating: 0, totalReviews: 0 } });
      setReviewsData(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewFeedback({ type: 'error', text: 'Please sign in to write a verified customer review.' });
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback(null);

    try {
      await reviewService.addReview({
        productId: activeModalProduct._id,
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviewFeedback({
        type: 'success',
        text: 'Review published successfully! Verified status evaluated from your completed order history.',
      });
      setReviewComment('');

      // Reload reviews
      const updatedRes = await reviewService.getProductReviews(activeModalProduct._id);
      const updatedData = updatedRes?.reviews ? updatedRes : (updatedRes?.data || { reviews: [], summary: { averageRating: 0, totalReviews: 0 } });
      setReviewsData(updatedData);
    } catch (err) {
      setReviewFeedback({ type: 'error', text: err.message || 'Failed to submit review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBuyNow = (prod, qty = 1) => {
    addToCart(prod._id, qty);
    setActiveModalProduct(null);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Header & Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Supermarket Storefront
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Fresh produce, dairy, bakery, snacks, and household essentials
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search products, brands, barcodes..."
              className="w-full sm:w-72"
            />

            <div className="w-full sm:w-48">
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                options={[
                  { value: 'name_asc', label: 'Name (A to Z)' },
                  { value: 'name_desc', label: 'Name (Z to A)' },
                  { value: 'sellingPrice_asc', label: 'Price: Low to High' },
                  { value: 'sellingPrice_desc', label: 'Price: High to Low' },
                  { value: 'totalStock_desc', label: 'Stock Availability' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Category Pill Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`
              px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-xs
              ${
                selectedCategory === ''
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }
            `}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => setSelectedCategory(cat._id)}
              className={`
                px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-xs
                ${
                  selectedCategory === cat._id
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="We couldn't find items matching your search criteria. Try resetting filters or searching with a different term."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setSelectedCategory('');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard
                key={prod._id}
                product={prod}
                onAddToCart={(id, qty) => addToCart(id, qty)}
                onClick={() => handleOpenProductDetail(prod)}
              />
            ))}
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* PRODUCT DETAILS & VERIFIED REVIEWS MODAL */}
      {/* ========================================================================= */}
      {activeModalProduct && (
        <Modal
          isOpen={!!activeModalProduct}
          onClose={() => setActiveModalProduct(null)}
          size="lg"
          title={activeModalProduct.name}
          description={`${activeModalProduct.brand || 'Supermarket'} • ${activeModalProduct.unit || 'Standard Pack'}`}
        >
          <div className="space-y-6">
            {/* Top Showcase: Pricing, Stock, Quantity, Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="emerald" size="sm">
                      {activeModalProduct.categoryId?.name || 'Grocery'}
                    </Badge>
                    {activeModalProduct.isExpiryTracked && (
                      <Badge variant="warning" size="sm" dot>
                        Perishable (FEFO Tracked)
                      </Badge>
                    )}
                  </div>

                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(activeModalProduct.sellingPrice)}
                    <span className="text-xs text-slate-400 font-normal ml-1.5">
                      / {activeModalProduct.unit}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {activeModalProduct.description || 'Premium supermarket grocery item adhering to Indian Food Safety standards.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Warehouse Stock:
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {activeModalProduct.totalStock > 0 ? `${activeModalProduct.totalStock} units available` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Purchase Controls */}
              <div className="flex flex-col justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantity</span>
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {modalQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQty(modalQty + 1)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    icon={ShoppingCart}
                    onClick={() => {
                      addToCart(activeModalProduct._id, modalQty);
                      setActiveModalProduct(null);
                    }}
                  >
                    Add {modalQty} to Basket
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    iconRight={ArrowRight}
                    onClick={() => handleBuyNow(activeModalProduct, modalQty)}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Specifications Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Barcode</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                  {activeModalProduct.barcode || '8901030006030'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">SKU Code</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                  {activeModalProduct.sku || 'SKU-GENERAL'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">GST Tax Rate</span>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {activeModalProduct.taxRate}% GST
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch Order</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                  FEFO First-Out
                </span>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Customer Reviews
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{reviewsData.summary.averageRating} / 5.0 ({reviewsData.summary.totalReviews} reviews)</span>
                </div>
              </div>

              {/* Write Review Form */}
              <form onSubmit={handleReviewSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rate this product:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= reviewRating
                              ? 'text-amber-400 fill-current'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  required
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this item (freshness, packaging, taste)..."
                  className="w-full text-xs rounded-xl p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                {reviewFeedback && (
                  <p className={`text-xs ${reviewFeedback.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {reviewFeedback.text}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={submittingReview}
                  >
                    Post Review
                  </Button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {reviewsData.reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No customer reviews yet. Be the first to review!
                  </p>
                ) : (
                  reviewsData.reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rev.user?.name || 'Customer'}
                          </span>
                          {rev.isVerifiedPurchase && (
                            <Badge variant="success" size="sm" dot>
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
