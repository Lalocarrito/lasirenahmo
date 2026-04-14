import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client with cookie support for Next.js middleware compatibility
export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Enhanced lock implementation to prevent timeout issues in production
            lock: async (name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
                if (typeof navigator !== 'undefined' && navigator.locks) {
                    return await navigator.locks.request(name, fn);
                }
                return await fn();
            },
        }
    }
);
