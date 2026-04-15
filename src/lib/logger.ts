/**
 * Production-safe logger wrapper.
 * Suppresses debug output in production to prevent information leakage.
 * In development, all logs pass through to native console methods.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
    error: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.error(...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.warn(...args);
        }
    },
    info: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.info(...args);
        }
    },
    debug: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.debug(...args);
        }
    },
};
