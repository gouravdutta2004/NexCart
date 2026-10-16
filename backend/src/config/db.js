const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 50,
      minPoolSize: 5,
    });

    isConnected = !!conn.connections[0].readyState;
    logger.info(`MongoDB Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', { error: err.message });
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected from server');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    logger.error('Initial MongoDB connection error:', {
      uri: config.MONGODB_URI,
      message: error.message,
    });
    // In development or test, we log warning so server can still boot with health check reporting DB status
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

const getDBStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[state] || 'unknown',
    isConnected: state === 1,
    dbName: mongoose.connection.name || null,
  };
};

module.exports = {
  connectDB,
  getDBStatus,
};
