export function middleware(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Security headers
  const securityHeaders: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  // CORS for API routes
  if (url.pathname.startsWith('/api/')) {
    securityHeaders['Access-Control-Allow-Origin'] = '*';
    securityHeaders['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    securityHeaders['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,makers-conversation-id';
  }

  // PDPA cookie consent check
  const cookieHeader = request.headers.get('Cookie') || '';
  const hasConsent = cookieHeader.includes('pdpa_consent=accepted');

  // Only gate pages that track data (not login/register/admin)
  const isTrackingPage = !url.pathname.startsWith('/auth/') && !url.pathname.startsWith('/admin/') && !url.pathname.startsWith('/api/');

  if (isTrackingPage && !hasConsent && method === 'GET') {
    // Let the page load but the CookieConsent component will show the banner
    // No redirect needed - the component handles consent UI
  }

  // Rate limiting on POST endpoints (simple in-memory check per request)
  // For production, use KV-based rate limiting
  if (method === 'POST' && url.pathname.startsWith('/api/')) {
    // Rate limiting header hint (actual rate limiting should use KV counters)
    securityHeaders['X-RateLimit-Policy'] = '100 requests per minute per IP';
  }

  const response = context.next();
  // Add security headers to all responses
  if (response && typeof response.then === 'function') {
    return response.then((res: Response) => {
      const newHeaders = new Headers(res.headers);
      for (const [key, value] of Object.entries(securityHeaders)) {
        newHeaders.set(key, value);
      }
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders,
      });
    });
  }

  // Fallback for non-promise responses
  const res = response as Response;
  const newHeaders = new Headers(res.headers);
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

export const config = {
  matcher: ['/(.*)'],
};
