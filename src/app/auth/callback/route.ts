import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * SECURITY: Server-side Auth Callback Route (PKCE Flow).
 * 1. Extracts the 'code' voucher from the URL (returned by Google/Supabase).
 * 2. Exchanges the code for a permanent authenticated session via the Supabase Auth API.
 * 3. Sets the security cookies (httpOnly, Secure) for the browser.
 * 4. Redirects the user back to the home page or a specific target.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // 'next' allows us to redirect to a specific page after login if desired
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error) {
            // Success: session is now set in cookies.
            // Using the origin ensures we stay on the same domain (security).
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Fallback: return the user to the home page with an error state if the code is invalid.
    return NextResponse.redirect(`${origin}/?auth_error=true`);
}
