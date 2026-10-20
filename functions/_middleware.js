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

  // 3. Normal traffic on production domain
  const response = await context.next();
  return response;
}
