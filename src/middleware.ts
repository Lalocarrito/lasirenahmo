import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * SECURITY: Server-side role validation middleware.
 * - Refreshes Supabase auth session via httpOnly cookies.
 * - Blocks unauthenticated access to /admin/* routes.
 * - Enforces RBAC: only 'admin' and 'staff' roles can access /admin/dashboard.
 * - Cannot be bypassed from the client.
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session - critical for cookie-based auth.
    // Wrapped in try-catch: getUser() throws AuthApiError when the
    // refresh token stored in cookies is stale or revoked (e.g. after
    // signing out on another device). We treat that as "no user".
    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    } catch {
        // Invalid/expired refresh token — treat as unauthenticated.
        // The response still carries any cookie-clearing headers that
        // @supabase/ssr may have set, so we let it pass through.
    }

    const pathname = request.nextUrl.pathname;

    // Protect all /admin sub-routes (dashboard, etc.) but allow /admin (login page)
    if (pathname.startsWith('/admin/')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin';
            return NextResponse.redirect(url);
        }

        // RBAC: Verify the user has admin or staff role in the profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const allowedRoles = ['admin', 'staff'];
        if (!profile || !allowedRoles.includes(profile.role)) {
            // User is authenticated but not authorized — redirect to home
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
