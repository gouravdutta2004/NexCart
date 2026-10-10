import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Connect socket
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join targeted role room
      socket.emit('join_role_room', user.role);
      socket.emit('join_user_room', user._id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen to low stock alerts
    socket.on('low_stock', (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: 'low_stock',
          title: 'Low Stock Alert Triggered',
          message: data.message || `Product stock is low (${data.totalStock} remaining)`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    });

    // Listen to PO received alerts
    socket.on('po_received', (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: 'po_received',
          title: 'Stock Batches Received',
          message: `PO ${data.poNumber} deposited into inventory.`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  return {
    socket: socketRef.current,
    connected,
    notifications,
  };
};

export default useSocket;
