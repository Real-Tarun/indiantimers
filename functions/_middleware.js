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

  // 2.5 Serve production robots.txt directly with all AI crawlers, search engines, and citations allowed
  if (url.pathname === '/robots.txt') {
    const robotsTxt = `# ==================================================
# IndianTimers - Robots Exclusion Policy
# Canonical domain: https://indiantimers.com/
# Designed for Maximum AI Citations, Search Engine Ranking, and AI Training
# ==================================================

# 1. Global Policy for All Web Crawlers & Bots
User-agent: *
Content-Signal: search=yes,ai-input=yes,ai-train=yes,use=full
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /embed/

# 2. Traditional Search Engine Crawlers (Google, Microsoft Bing, Apple, DuckDuckGo, Yandex, Baidu)
User-agent: Googlebot
User-agent: Googlebot-Image
User-agent: Googlebot-News
User-agent: Googlebot-Video
User-agent: Bingbot
User-agent: Applebot
User-agent: DuckDuckBot
User-agent: YandexBot
User-agent: Baiduspider
User-agent: NaverBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /embed/

# 3. AI Search, Grounding, Citations & Generative AI Systems (OpenAI, Anthropic, Perplexity, Google, Meta, Cohere, Mistral)
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: OAI-SearchBot
User-agent: ClaudeBot
User-agent: Claude-Web
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: GoogleOther
User-agent: Applebot-Extended
User-agent: Meta-ExternalAgent
User-agent: meta-externalfetcher
User-agent: Cohere-ai
User-agent: MistralAI-User
User-agent: Amazonbot
User-agent: Amzn-User
User-agent: Bytespider
User-agent: Diffbot
User-agent: FirecrawlAgent
User-agent: FireCrawl
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /embed/

# 4. XML Sitemap & LLM Knowledge Document Endpoints
Sitemap: https://indiantimers.com/sitemap.xml
# LLM Context: https://indiantimers.com/llms.txt
# LLM Full Context: https://indiantimers.com/llms-full.txt
`;
    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
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
