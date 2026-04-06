import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase URL no válida o faltante en .env.local');
}

// Singleton pattern for Next.js to avoid multiple client instances during HMR
const createSupabaseClient = () => {
    return createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder',
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                // Custom lock implementation because supabase-js (wrapper) sometimes swallows 
                // lockAcquireTimeout before passing it to auth-js (GoTrue).
                // This custom lock uses the browser's LockManager but without the default 10s timeout.
                lock: async (name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
                    if (typeof navigator !== 'undefined' && navigator.locks) {
                        return await navigator.locks.request(name, fn);
                    }
                    return await fn();
                },
                // Keep these for future-proofing in case the wrapper is updated
                // @ts-ignore
                lockAcquireTimeout: 30000,
                // @ts-ignore
                lockTimeoutMs: 30000,
            } as any,
            db: {
                timeout: 30000
            }
        }
    );
};

// Use a global variable to store the singleton instance in development
const globalForSupabase = global as unknown as { supabase: SupabaseClient };
export const supabase = globalForSupabase.supabase || createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabase = supabase;
}
