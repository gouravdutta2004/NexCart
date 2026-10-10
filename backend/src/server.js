const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const { connectDB, getDBStatus } = require('./config/db');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');
const ApiResponse = require('./utils/apiResponse');
const AppError = require('./utils/apiError');
const errorHandler = require('./middleware/errorMiddleware');
const { globalRateLimiter } = require('./middleware/rateLimiter');

const app = express();
const httpServer = http.createServer(app);

// Initialize WebSockets
const io = initSocket(httpServer);

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [config.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiter
app.use('/api', globalRateLimiter);

// Mount API v1 Router
const apiRouter = require('./routes');
app.use('/api/v1', apiRouter);

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  return ApiResponse.success(res, {
    message: 'NexCart System is Operational',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.NODE_ENV,
      database: dbStatus,
      version: '1.0.0',
    },
  });
});

// Root Welcome Endpoint
app.get('/', (req, res) => {
  return ApiResponse.success(res, {
    message: 'Welcome to NexCart — Intelligent Supermarket Automation API',
    data: {
      apiDocumentation: '/docs',
      healthCheck: '/api/health',
      apiVersion: 'v1',
    },
  });
});

// Catch-all 404 for undefined routes
app.all('*', (req, res, next) => {
  next(AppError.notFound(`Cannot find route ${req.method} ${req.originalUrl} on this server`));
});

// Global Error Handler
app.use(errorHandler);

// Start Server Function
const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(config.PORT, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 NexCart Server running on port ${config.PORT}`);
      logger.info(`🌐 Environment: ${config.NODE_ENV}`);
      logger.info(`🏥 Health check: http://localhost:${config.PORT}/api/health`);
      logger.info(`====================================================`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  httpServer.close(() => {
    logger.info('HTTP and WebSocket server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { app, httpServer, io };
