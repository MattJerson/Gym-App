// Lightweight logger wrapper with levels and environment gating
// Usage: import { logger } from "../services/logger";

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const format = (level, args) => {
  const ts = new Date().toISOString();
  return [
    `[${ts}] [${level}]`,
    ...args,
  ];
};

export const logger = {
  debug: (...args) => {
    if (isDev) console.debug(...format('debug', args));
  },
  info: (...args) => {
    if (isDev) console.info(...format('info', args));
  },
  warn: (...args) => console.warn(...format('warn', args)),
  error: (...args) => console.error(...format('error', args)),
};

export default logger;
