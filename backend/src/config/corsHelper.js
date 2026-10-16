const config = require('./env');

/**
 * Returns list of explicitly allowed frontend and development origins.
 * Wildcard domain suffixes (.vercel.app, .onrender.com, etc.) are strictly prohibited.
 */
const getAllowedOrigins = () => {
  const origins = [
    config.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5001',
  ].filter(Boolean);

  if (config.ADDITIONAL_ORIGINS) {
    config.ADDITIONAL_ORIGINS.split(',').forEach((o) => {
      const trimmed = o.trim();
      if (trimmed && !origins.includes(trimmed)) {
        origins.push(trimmed);
      }
    });
  }
  return Array.from(new Set(origins));
};

/**
 * Validates if an incoming origin is strictly in the allowed origins list.
 */
const isOriginAllowed = (origin) => {
  if (!origin) return true; // allow non-browser or same-origin requests (e.g. curl, health checks)
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
};
