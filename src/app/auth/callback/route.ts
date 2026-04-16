import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * SECURITY: Server-side Auth Callback Route (PKCE Flow).
 * 
 * This route receives the `code` from Supabase/Google after OAuth,
 * exchanges it for a session, and writes the auth cookies into the
 * browser via next/headers — the only correct way to persist auth
 * state in a Next.js Route Handler with @supabase/ssr.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Session is now persisted in cookies. Redirect to the target page.
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Code missing or exchange failed — redirect home with error flag
    return NextResponse.redirect(`${origin}/?auth_error=true`);
}
