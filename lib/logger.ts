/**
 * Logging utility for development and production
 * Provides conditional logging based on NODE_ENV
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Development logger - logs everything
 */
const devLogger: Logger = {
  log: (...args: unknown[]) => console.log(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug(...args),
};

/**
 * Production logger - only logs errors and warnings
 */
const prodLogger: Logger = {
  log: () => {}, // No-op in production
  info: () => {}, // No-op in production
  warn: (...args: unknown[]) => console.warn(...args), // Keep warnings
  error: (...args: unknown[]) => console.error(...args), // Keep errors
  debug: () => {}, // No-op in production
};

/**
 * Get the appropriate logger based on environment
 */
function getLogger(): Logger {
  return isDevelopment ? devLogger : prodLogger;
}

/**
 * Main logger instance
 * Use this instead of console.log/error directly
 */
export const logger = getLogger();

/**
 * API-specific logger with prefix
 * Use for API route logging
 */
export const apiLogger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[API]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[API]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn('[API]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[API]', ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[API]', ...args);
    }
  },
};

/**
 * POI-specific logger with prefix
 * Use for POI-related logging
 */
export const poiLogger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[POI]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[POI]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn('[POI]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[POI]', ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[POI]', ...args);
    }
  },
};

/**
 * Client-side logger (for use in components)
 * Only logs in development
 */
export const clientLogger = {
  log: (...args: unknown[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (typeof window !== 'undefined') {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (typeof window !== 'undefined') {
      console.error(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.debug(...args);
    }
  },
};

