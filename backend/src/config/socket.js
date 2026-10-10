const { Server } = require('socket.io');
const logger = require('../utils/logger');
const config = require('./env');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join role-specific channels for targeted notifications
    socket.on('join_role_room', (role) => {
      if (role) {
        socket.join(`role:${role}`);
        logger.debug(`Socket ${socket.id} joined role room: role:${role}`);
      }
    });

    // Join user-specific channel for personal alerts
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Dispatch helper for real-time events
const emitNotification = (target, eventName, payload) => {
  if (!io) return;

  if (target.role) {
    io.to(`role:${target.role}`).emit(eventName, payload);
  } else if (target.userId) {
    io.to(`user:${target.userId}`).emit(eventName, payload);
  } else {
    io.emit(eventName, payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitNotification,
};
