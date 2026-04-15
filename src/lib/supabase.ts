import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser client using @supabase/ssr for cookie-based auth.
 * SECURITY: @supabase/ssr's createBrowserClient automatically stores
 * tokens in cookies (not localStorage), eliminating the XSS vector
 * that localStorage storage creates. The middleware handles
 * httpOnly cookie synchronization on the server side.
 */
export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Enhanced lock implementation to prevent timeout issues in production
            lock: async <R>(name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
                if (typeof navigator !== 'undefined' && navigator.locks) {
                    return await navigator.locks.request(name, fn);
                }
                return await fn();
            },
        }
    }
);
