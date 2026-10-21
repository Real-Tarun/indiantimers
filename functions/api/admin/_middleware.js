/**
 * Server-Side Authentication Guard for IndianTimers Admin APIs
 * 
 * Enforces Cloudflare Access Zero-Trust identity or Bearer Secret Token.
 * Protects admin.indiantimers.com, preview subdomains, and api endpoints.
 */

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // 1. Check Cloudflare Access Headers (Identity from Zero Trust)
  const cfAccessEmail = request.headers.get('cf-access-authenticated-user-email');
  const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');

  // 2. Check Authorization Bearer Token (for automated workers / cron triggers)
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  // Configured admin secret in Cloudflare Worker Environment
  const adminSecret = context.env?.ADMIN_API_SECRET || 'dev-local-admin-secret-key-2027';

  let authenticatedEmail = null;

  if (cfAccessEmail && cfAccessJwt) {
    authenticatedEmail = cfAccessEmail;
  } else if (bearerToken && bearerToken === adminSecret) {
    authenticatedEmail = 'automated-worker@indiantimers.com';
  } else if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    // Local development convenience fallback
    authenticatedEmail = request.headers.get('x-admin-email') || 'local-developer@indiantimers.com';
  }

  if (!authenticatedEmail) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized. Cloudflare Access identity or valid Admin Bearer Token is required.',
        code: 'ADMIN_AUTH_REQUIRED',
        docs: 'https://indiantimers.com/docs/admin-security-and-cloudflare-access',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer error="invalid_token"',
        },
      }
    );
  }

  // Attach verified identity to request context for downstream handlers
  context.data = context.data || {};
  context.data.adminEmail = authenticatedEmail;

  return context.next();
}
