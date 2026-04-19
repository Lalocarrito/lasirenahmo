/**
 * Production-safe logger wrapper.
 * Suppresses debug output in production to prevent information leakage.
 * In development, all logs pass through to native console methods.
 */

const isDev = process.env.NODE_ENV !== 'production';

const SENSITIVE_KEYS = ['password', 'token', 'access_token', 'refresh_token', 'key', 'secret', 'authorization'];

function redact(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(redact);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        out[k] = SENSITIVE_KEYS.some(s => k.toLowerCase().includes(s)) ? '[REDACTED]' : redact(v);
    }
    return out;
}

export const logger = {
    error: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.error(...args.map(redact));
        }
    },
    warn: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.warn(...args.map(redact));
        }
    },
    info: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.info(...args.map(redact));
        }
    },
    debug: (...args: unknown[]) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.debug(...args.map(redact));
        }
    },
};
