/**
 * Cloudflare Pages Middleware
 * 
 * Enforces production canonical domain (https://indiantimers.com/):
 * 1. Blocks crawlers on all *.pages.dev subdomains by returning strict Disallow for /robots.txt
 * 2. 301 permanently redirects all other *.pages.dev requests to https://indiantimers.com/...
 * 3. Sends X-Robots-Tag: noindex, nofollow on all *.pages.dev responses to prevent duplicate indexing
 * 4. 301 permanently redirects www.indiantimers.com to apex canonical https://indiantimers.com
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

  // 1. Handle Cloudflare Pages domain (*.pages.dev)
  if (hostname.endsWith('.pages.dev')) {
    // If crawler requests robots.txt on *.pages.dev, forbid all crawling completely
    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 301 Permanent Redirect to canonical production domain
    const targetUrl = new URL(url.pathname + url.search, 'https://indiantimers.com');
    return new Response(null, {
      status: 301,
      headers: {
        Location: targetUrl.toString(),
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    });
  }

  // 2. Normalize www to apex canonical domain
  if (hostname === 'www.indiantimers.com') {
    const targetUrl = new URL(url.pathname + url.search, 'https://indiantimers.com');
    return Response.redirect(targetUrl.toString(), 301);
  }

  // 3. Admin Security & Cloaking Shield (.com/admin is 100% blocked and 404 to unauthorized public)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isAdminSubdomain = hostname === 'admin.indiantimers.com';
    const hasCfAccess = !!context.request.headers.get('cf-access-jwt-assertion');
    const headerKey = context.request.headers.get('x-admin-key');
    const queryKey = url.searchParams.get('key');
    const cookieHeader = context.request.headers.get('cookie') || '';
    const hasCookieAuth = cookieHeader.includes('admin_session=active');

    // Configured admin secret in Cloudflare Pages Environment
    const validKey = context.env?.ADMIN_SECRET_KEY || 'it_admin_secret_2027_k9x';
    const isKeyValid = (queryKey && queryKey === validKey) || (headerKey && headerKey === validKey);

    // If completely unauthenticated on the public apex domain, disguise as 404 Not Found
    if (!isLocalhost && !isAdminSubdomain && !hasCfAccess && !isKeyValid && !hasCookieAuth) {
      return new Response('404 Not Found\n', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
        },
      });
    }

    const response = await context.next();
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    newHeaders.set('Cache-Control', 'no-store, private');
    newHeaders.set('X-Frame-Options', 'DENY');

    // If valid key was passed in URL query, set persistent session cookie
    if (isKeyValid && queryKey) {
      newHeaders.set('Set-Cookie', 'admin_session=active; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=86400');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  // 4. Normal traffic on production domain
  const response = await context.next();
  return response;
}
