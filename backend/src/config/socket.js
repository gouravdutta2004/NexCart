const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('./env');
const User = require('../models/User');
const { isOriginAllowed } = require('./corsHelper');

let io = null;

// Strict Connection Authentication Middleware
const socketAuthMiddleware = async (socket, next) => {
  try {
    const rawToken =
      socket.handshake?.auth?.token ||
      socket.handshake?.headers?.authorization ||
      socket.handshake?.query?.token;

    if (!rawToken || typeof rawToken !== 'string') {
      return next(new Error('Authentication error: Token required'));
    }

    const cleanToken = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();
    const decoded = jwt.verify(cleanToken, config.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.status === 'inactive') {
      return next(new Error('Authentication error: User invalid or inactive'));
    }

    socket.user = user;
    next();
  } catch (err) {
    return next(new Error(`Authentication error: ${err.message}`));
  }
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Strict Connection Authentication Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.info(`Authenticated socket connected: ${socket.id} (User: ${socket.user.email}, Role: ${socket.user.role})`);

    // Automatically join authenticated user to their personal room and authorized role room
    const personalRoom = `user:${socket.user._id.toString()}`;
    const roleRoom = `role:${socket.user.role}`;
    socket.join(personalRoom);
    socket.join(roleRoom);

    // Explicit room join requests: strictly enforce authorization
    socket.on('join_role_room', (role) => {
      if (!role) return;
      if (role === socket.user.role || socket.user.role === 'admin') {
        socket.join(`role:${role}`);
        logger.debug(`Socket ${socket.id} joined role room: role:${role}`);
      } else {
        logger.warn(`[SOCKET SECURITY]: User ${socket.user.email} (${socket.user.role}) denied joining role:${role}`);
        socket.emit('security_error', { message: 'Unauthorized role room access' });
      }
    });

    socket.on('join_user_room', (userId) => {
      if (!userId) return;
      if (userId.toString() === socket.user._id.toString() || socket.user.role === 'admin') {
        socket.join(`user:${userId}`);
        logger.debug(`Socket ${socket.id} joined user room: user:${userId}`);
      } else {
        logger.warn(`[SOCKET SECURITY]: User ${socket.user.email} denied joining user:${userId}`);
        socket.emit('security_error', { message: 'Unauthorized personal room access' });
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
  socketAuthMiddleware,
};
