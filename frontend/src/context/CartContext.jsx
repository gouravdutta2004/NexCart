import React, { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    subtotal: 0,
    estimatedTax: 0,
    grandTotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load cart whenever authentication status is confirmed
  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart({ items: [], itemCount: 0, subtotal: 0, estimatedTax: 0, grandTotal: 0 });
      return;
    }

    try {
      setLoading(true);
      const res = await cartService.getCart();
      if (res?.cart) {
        setCart(res.cart);
      }
    } catch (err) {
      console.error('Failed to load shopping cart:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await cartService.addToCart(productId, quantity);
      if (res?.cart) {
        setCart(res.cart);
        setIsDrawerOpen(true); // Open drawer on addition for seamless feedback
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await cartService.updateCartItem(productId, quantity);
      if (res?.cart) {
        setCart(res.cart);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await cartService.removeFromCart(productId);
      if (res?.cart) {
        setCart(res.cart);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const clearCart = async () => {
    try {
      const res = await cartService.clearCart();
      setCart({ items: [], itemCount: 0, subtotal: 0, estimatedTax: 0, grandTotal: 0 });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const value = {
    cart,
    items: cart.items || [],
    itemCount: cart.itemCount || 0,
    subtotal: cart.subtotal || 0,
    estimatedTax: cart.estimatedTax || 0,
    grandTotal: cart.grandTotal || 0,
    loading,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
