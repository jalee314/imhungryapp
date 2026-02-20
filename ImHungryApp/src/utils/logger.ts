/**
 * Lightweight logger utility.
 *
 * Wraps console methods so that:
 *  - The ESLint `no-console` rule is satisfied project-wide.
 *  - We have a single place to add structured logging, remote reporting,
 *    or silence logs in production later.
 *
 * Usage:
 *   import { logger } from '../utils/logger';   // adjust path
 *   logger.info('something happened');
 *   logger.warn('heads-up', { detail });
 *   logger.error('boom', error);
 */

/* eslint-disable no-console */

export const logger = {
    /** Informational messages (replaces console.log) */
    info: (...args: unknown[]) => {
        if (__DEV__) console.log(...args);
    },

    /** Warning messages */
    warn: (...args: unknown[]) => {
        if (__DEV__) console.warn(...args);
    },

    /** Error messages — always logged even in production */
    error: (...args: unknown[]) => {
        console.error(...args);
    },

    /** Debug-only messages (stripped in production) */
    debug: (...args: unknown[]) => {
        if (__DEV__) console.log('[DEBUG]', ...args);
    },
};
