# IndianTimers - Production Deployment, Search Console & Launch Guide

## 1. Hosting Architecture & Cloudflare Pages Setup

IndianTimers is built on **Astro SSG** with zero-drift client React islands. It outputs pure, pre-rendered static HTML, optimized CSS, and minimal client JavaScript into the `dist/` folder, making it exceptionally fast, scalable, and cost-effective on **Cloudflare Pages**.

### Cloudflare Pages Deployment Steps
1. Push this repository to GitHub or GitLab.
2. In the Cloudflare Dashboard, navigate to **Compute (Workers & Pages)** > **Create Application** > **Pages** > **Connect to Git**.
3. Select the repository `examtimers` (or `indiantimers`).
4. Configure the build settings:
   - **Framework Preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**:
     - `NODE_VERSION`: `22` (or `24`)
     - `SITE_URL`: `https://indiantimers.com` (or your chosen production domain)
5. Click **Save and Deploy**. Cloudflare Pages will build all 116 static pages and deploy them across their global edge network.

---

## 2. Production Domain & Canonical Governance

- Default configured domain: `https://indiantimers.com`
- Change domain configuration in `src/config/site.ts` or via the `SITE_URL` environment variable.
- In Cloudflare Pages, navigate to **Custom Domains** and add your apex and www domains (e.g. `indiantimers.com` and `www.indiantimers.com`).
- Enable automatic HTTPS and HSTS.

---

## 3. Google Search Console & Bing Webmaster Verification

### Google Search Console
1. Add property via **Domain Property** (DNS verification via TXT record in Cloudflare DNS) or **URL Prefix** (`https://indiantimers.com`).
2. Submit the canonical sitemap index:
   ```
   https://indiantimers.com/sitemap-index.xml
   ```
3. Run **URL Inspection** on:
   - `https://indiantimers.com/`
   - `https://indiantimers.com/exams/neet-ug-2027/`
   - `https://indiantimers.com/tools/mock-test-timer/`
4. Confirm Googlebot fetches the pre-rendered HTML with full titles, headings, and JSON-LD structured data without rendering timeouts.

### Bing Webmaster Tools
1. Import property directly from Google Search Console or add via DNS/HTML meta tag.
2. Submit `https://indiantimers.com/sitemap-index.xml`.

---

## 4. Privacy-Friendly Analytics Integration

IndianTimers is architected with a strict privacy-first promise.
If you choose to enable analytics:
- We recommend cookieless, lightweight providers like **Cloudflare Web Analytics** (zero-cookie, GDPR-compliant, automatic in Pages) or **Plausible / Umami**.
- To add, include the script tag in `src/layouts/BaseLayout.astro`.

---

## 5. Pre-Launch Verification Audit Checklist

- [x] All 24 core sample routes return `200 OK`
- [x] Robots.txt allows all public routes and canonicalizes sitemap
- [x] Robots.txt disallows private client `/dashboard/` route
- [x] Sitemap index generated with 116 indexable URLs
- [x] Valid JSON-LD structured data on all pages (Organization, BreadcrumbList, WebPage/Event, WebApplication, Article)
- [x] `llms.txt` accurately generated in `dist/`
- [x] Web app manifest and SVG favicon configured
- [x] Automated test suite passing (15/15 tests)
