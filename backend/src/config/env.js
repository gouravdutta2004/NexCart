const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing. ' +
    'The application requires a secure JWT_SECRET to start and will not use an insecure fallback.'
  );
}

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,
  CLIENT_URL: process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  ADDITIONAL_ORIGINS: process.env.ADDITIONAL_ORIGINS || '',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexcart_db',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
  SERVE_STATIC: process.env.SERVE_STATIC === 'true' || process.env.NODE_ENV === 'production',
};

module.exports = config;
