import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const toast = useToast();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Helper to determine WebSocket gateway URL
  const getSocketUrl = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      if (typeof window !== 'undefined' && window.location.port === '5173') {
        return 'http://localhost:5001';
      }
      return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001';
    }
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      return apiUrl.replace(/\/api\/v1\/?$/, '');
    }
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001';
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const authToken = token || localStorage.getItem('nexcart_token');
    if (!authToken) return;

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: authToken,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join role room
      if (user.role) {
        socket.emit('join_role_room', user.role);
      }
      // Join private user room
      const uid = user._id || user.id;
      if (uid) {
        socket.emit('join_user_room', uid.toString());
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // 1. Low Stock Alerts (Inventory Manager & Admin)
    socket.on('low_stock', (data) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        type: 'warning',
        category: 'inventory',
        title: 'Low Stock Alert Triggered',
        message: data.message || `Product stock is low (${data.totalStock} remaining)`,
        time: 'Just now',
        timestamp: new Date(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      toast.warning(newNotif.message, newNotif.title);
    });

    // 2. Purchase Order Received (Inventory Manager & Admin)
    socket.on('po_received', (data) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        type: 'success',
        category: 'procurement',
        title: 'Stock Batches Received',
        message: `PO ${data.poNumber || 'Fulfillment'} deposited into inventory batches.`,
        time: 'Just now',
        timestamp: new Date(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      toast.success(newNotif.message, newNotif.title);
    });

    // 3. New Orders (Admin)
    socket.on('new_order', (data) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        type: 'success',
        category: 'orders',
        title: `New Online Order: #${data.orderNumber}`,
        message: `Order of ₹${Number(data.totalAmount || 0).toFixed(2)} received (${data.itemCount || 1} items).`,
        time: 'Just now',
        timestamp: new Date(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      toast.success(newNotif.message, newNotif.title);
    });

    // 4. Order Status Updates (Customers & Admin)
    socket.on('order_status', (data) => {
      const isCancelled = data.status === 'cancelled';
      const newNotif = {
        id: Date.now() + Math.random(),
        type: isCancelled ? 'warning' : 'success',
        category: 'orders',
        title: data.title || `Order #${data.orderNumber} Status Updated`,
        message: data.message || `Order status updated to '${data.status}'`,
        time: 'Just now',
        timestamp: new Date(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      if (isCancelled) {
        toast.warning(newNotif.message, newNotif.title);
      } else {
        toast.info(newNotif.message, newNotif.title);
      }
    });

    // 5. Held Carts (Cashier & Admin)
    socket.on('cart_held', (data) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        type: 'warning',
        category: 'held_carts',
        title: `Cart Parked: ${data.cartReference || 'Held Basket'}`,
        message: `${data.customerName || 'Customer'} basket (₹${Number(data.subtotal || 0).toFixed(2)}) on hold. Recall via F8.`,
        time: 'Just now',
        timestamp: new Date(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      toast.warning(newNotif.message, newNotif.title);
    });

    // 6. POS Walk-in Completed (Cashier & Admin)
    socket.on('pos_completed', (data) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        type: 'success',
        category: 'pos',
        title: `POS Checkout #${data.orderNumber}`,
        message: `Payment of ₹${Number(data.totalAmount || 0).toFixed(2)} completed. Invoice: ${data.invoiceNumber || 'Issued'}`,
        time: 'Just now',
        timestamp: new Date(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      toast.success(newNotif.message, newNotif.title);
    });

    // 7. Expiry Radar Warnings (Inventory Manager & Admin)
    socket.on('expiry_warning', (data) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        type: 'warning',
        category: 'inventory',
        title: `Expiry Radar: ${data.productName || 'Perishable Batch'}`,
        message: data.message || `Batch ${data.batchNumber || ''} is approaching expiration. Markdown recommended.`,
        time: 'Just now',
        timestamp: new Date(),
        unread: true,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      toast.warning(newNotif.message, newNotif.title);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user, token, getSocketUrl, toast]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const on = useCallback((eventName, callback) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, callback);
    }
  }, []);

  const off = useCallback((eventName, callback) => {
    if (socketRef.current) {
      socketRef.current.off(eventName, callback);
    }
  }, []);

  const emit = useCallback((eventName, data) => {
    if (socketRef.current) {
      socketRef.current.emit(eventName, data);
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        notifications,
        clearNotifications,
        on,
        off,
        emit,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
