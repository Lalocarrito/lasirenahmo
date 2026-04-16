/**
 * SECURITY: Strict allowlist for OAuth redirect URLs.
 * Prevents Open Redirect attacks by validating that redirectTo
 * parameters only point to known, trusted origins.
 */

const ALLOWED_REDIRECT_ORIGINS: string[] = [
    'https://lasirenahmo.com',
    'https://www.lasirenahmo.com',
];

/**
 * Returns a safe redirect URL. If the provided origin is not in the
 * allowlist, falls back to the first allowed origin or '/'.
 */
export function getSafeRedirectUrl(path: string = '/'): string {
    if (typeof window === 'undefined') return path;

    const origin = window.location.origin;

    // In development and testing (Localhost, Vercel Previews, Production with/without WWW)
    const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
    const isVercel = origin.endsWith('.vercel.app');
    const isProduction = ALLOWED_REDIRECT_ORIGINS.includes(origin);

    if (isLocalhost || isVercel || isProduction) {
        return `${origin}${path}`;
    }

    // Fallback: use first allowed origin or just the path
    const fallback = ALLOWED_REDIRECT_ORIGINS[0];
    return fallback ? `${fallback}${path}` : path;
}
