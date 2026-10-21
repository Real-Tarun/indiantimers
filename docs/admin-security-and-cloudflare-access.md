# IndianTimers: Admin Security & Cloudflare Access Architecture

## 1. Architectural Isolation

To ensure complete separation between the public student website and administrative controls, IndianTimers specifies a **two-project Cloudflare architecture**:

1. **Public Project (`indiantimers.com`)**:
   - High-performance, statically generated pages on Cloudflare Pages.
   - Publicly cacheable, CDN edge-cached worldwide.
   - Contains zero administrative endpoints, database write privileges, or secret keys.

2. **Admin Project (`admin.indiantimers.com`)**:
   - Deployed as an isolated Cloudflare Pages / Worker project.
   - Enclosed completely behind **Cloudflare Access (Zero Trust)**.
   - Hosts the editorial notice queue, source checker controls, and published datesheet audit log.

---

## 2. Cloudflare Access Zero-Trust Configuration

### 2.1 Access Policy Setup
In Cloudflare Zero Trust Dashboard:
1. Navigate to **Access** → **Applications** → **Add an Application** → **Self-Hosted**.
2. **Application Domain**:
   - Domain: `admin.indiantimers.com`
   - Path: `*`
3. **Application Policy**:
   - Rule Action: **Allow**
   - Criteria: **Emails** containing only your authorized admin email address:
     `Include: [ "your-verified-email@indiantimers.com" ]`
   - Multi-Factor Authentication (MFA): **Required** (FIDO2 Hardware Key, YubiKey, or Authenticator App).

### 2.2 Protecting `*.pages.dev` and Preview URLs
A common vulnerability is when attackers bypass `admin.indiantimers.com` by hitting `indiantimers-admin.pages.dev` or ephemeral branch preview URLs (e.g. `feat-branch.indiantimers-admin.pages.dev`).

**To eliminate this bypass vector**:
1. In Cloudflare Zero Trust, configure a second policy rule matching:
   `*.pages.dev` for the admin project.
2. In `functions/api/admin/_middleware.js`:
   The server-side middleware rejects any request lacking a valid `cf-access-jwt-assertion` token or pre-shared admin secret, regardless of which hostname is queried.

---

## 3. Server-Side Identity Verification

Never rely on hiding the admin URL or client-side JavaScript password checks.

In `functions/api/admin/_middleware.js`, every incoming administrative request is cryptographically validated at the Cloudflare edge:

```js
// 1. Validate Cloudflare Access JWT header
const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');
const cfAccessEmail = request.headers.get('cf-access-authenticated-user-email');

// 2. Fallback to Worker Secret Token for automated cron runners
const authHeader = request.headers.get('authorization') || '';
const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

if (!cfAccessEmail && bearerToken !== context.env.ADMIN_API_SECRET) {
  return new Response(JSON.stringify({ error: 'Unauthorized admin access' }), { status: 401 });
}
```

---

## 4. Secrets Management (Zero Secret Leakage)

- **Rule**: Never place API tokens, GitHub Personal Access Tokens, database passwords, or webhook secrets in frontend code, client-side `.env` files, or Git commits.
- **Cloudflare Secrets**:
  Store all administrative keys via Wrangler or Cloudflare Dashboard:
  ```bash
  wrangler secret put ADMIN_API_SECRET
  wrangler secret put GITHUB_DEPLOY_TOKEN
  ```
  These variables are injected strictly into `context.env` during serverless function execution on Cloudflare's secure workers environment.

---

## 5. Review-Before-Publish Workflow & Audit Logging

To prevent accidental misinformation or corrupted dates from reaching millions of students:
1. **Default Review Policy**: Detected changes remain in `pending_review` state until an admin verifies the official PDF gazette.
2. **Audit Logging**: Every approval, rejection, or manual date override is recorded in an immutable audit entry containing:
   - Admin email address
   - UTC and IST timestamp
   - Previous canonical exam date vs New published exam date
   - Official circular citation link
   - Admin verification comment
3. **Rollback & Historical Traceability**: Every published update can be inspected in the Audit Trail tab of the Admin Console.

---

## 6. Honest Security Assessment & Residual Risks

While Cloudflare Access with MFA provides defense-in-depth:
- **No system is unhackable**: Account takeover can occur if the administrator's primary email provider is compromised. Enforcing hardware security keys (FIDO2/WebAuthn) on the administrator's email is strongly recommended.
- **Third-Party Authority Vulnerability**: If a conducting body website is defaced or compromised at the source, automated scrapers may detect corrupted notices. The mandatory human review-before-publish safeguard prevents these anomalies from going live automatically.
