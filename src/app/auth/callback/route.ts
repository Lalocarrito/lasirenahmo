import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * SECURITY: Server-side Auth Callback Route (PKCE Flow).
 *
 * CRITICAL: cookies must be written directly onto the redirect Response
 * object — NOT via next/headers — because Next.js creates separate
 * response objects and cookies on one are NOT copied to the other.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        // Create the redirect response FIRST so we can attach cookies to it directly.
        const redirectResponse = NextResponse.redirect(`${origin}${next}`);

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        // Write cookies onto the redirect response directly.
                        // This is the only way they reach the browser.
                        cookiesToSet.forEach(({ name, value, options }) => {
                            redirectResponse.cookies.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Return the redirect — it carries the session cookies with it.
            return redirectResponse;
        }
    }

    // Code missing or exchange failed — redirect home with error flag.
    return NextResponse.redirect(`${origin}/?auth_error=true`);
}
