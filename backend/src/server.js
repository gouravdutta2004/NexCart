const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const path = require('path');
const fs = require('fs');

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

const { getAllowedOrigins, isOriginAllowed } = require('./config/corsHelper');

// Security & Parsing Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: [
          "'self'",
          'ws:',
          'wss:',
          'http://localhost:*',
          'http://127.0.0.1:*',
          ...(config.CLIENT_URL ? [config.CLIENT_URL] : []),
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: config.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiter
app.use('/api', globalRateLimiter);

// Mount API Routers
const apiRouter = require('./routes');
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Root fallback for direct API module calls (e.g. POST /auth/register)
const directApiPrefixes = [
  '/auth',
  '/products',
  '/orders',
  '/cart',
  '/pos',
  '/categories',
  '/discounts',
  '/suppliers',
  '/inventory',
  '/users',
  '/audit-logs',
  '/analytics',
  '/invoices',
  '/reviews',
  '/purchase-orders',
];

app.use((req, res, next) => {
  if (directApiPrefixes.some((p) => req.path.startsWith(p))) {
    return apiRouter(req, res, next);
  }
  next();
});

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.isConnected;
  const statusCode = isHealthy ? 200 : 503;
  return res.status(statusCode).json({
    success: isHealthy,
    statusCode,
    message: isHealthy ? 'NexCart System is Operational' : 'Database Connection Degraded',
    data: {
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.NODE_ENV,
      database: dbStatus,
      version: '1.0.0',
    },
  });
});

// Optional Static Asset Serving (Unified Single-Service Cloud Deployment)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const hasStaticBuild = fs.existsSync(frontendDistPath) && fs.existsSync(path.join(frontendDistPath, 'index.html'));

if (hasStaticBuild) {
  logger.info(`📦 Serving production frontend static bundle from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // SPA fallback for all non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || directApiPrefixes.some((p) => req.originalUrl.startsWith(p))) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Root Welcome Endpoint when API is deployed standalone
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
}

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

module.exports = { app, httpServer, io, getAllowedOrigins, isOriginAllowed };
