/**
 * Structured Logger for NexCart Application
 */

const formatMessage = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  let log = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    try {
      log += ` | ${JSON.stringify(meta)}`;
    } catch {
      log += ` | [Circular/Unserializable Meta]`;
    }
  }
  return log;
};

const logger = {
  info: (message, meta) => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage('error', message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};

module.exports = logger;
