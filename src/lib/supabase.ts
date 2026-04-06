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
                // In some versions of supabase-js/auth-js the property is lockAcquireTimeout
                // @ts-ignore
                lockAcquireTimeout: 30000,
                // In others it is lockTimeoutMs (keeping for backward/forward compatibility)
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
