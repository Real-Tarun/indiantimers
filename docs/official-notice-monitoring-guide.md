# IndianTimers: Automated Official Exam Notice Monitoring Guide

## 1. System Overview

IndianTimers maintains an automated, non-invasive notice monitoring engine designed to track public announcements from India's primary educational conducting bodies (NTA, UPSC, CBSE, IITs, Consortium of NLUs, SSC, State Boards).

The system operates on a **Review-Before-Publish** principle: automated algorithms detect and extract prospective schedule changes, but an authorized editorial administrator must confirm the exact official notice before changes are gazetted into the public database.

```
┌────────────────────────────────────────────────────────┐
│  Official Sources (NTA, UPSC, CBSE, GATE, CLAT, SSC)   │
└───────────────────────────┬────────────────────────────┘
                            │ (Daily Scheduled Cron / On-Demand Poll)
                            ▼
┌────────────────────────────────────────────────────────┐
│     Lightweight Extraction Engine (HTML & PDF regex)   │
│   • HTML Normalization & Volatile Strip                │
│   • SHA-256 Content Fingerprinting & ETag Cache        │
│   • Indian Gazette Date Regex Parser                   │
│   • Status Keyword Detector (Postponed/Official)       │
└───────────────────────────┬────────────────────────────┘
                            │ (Matched against EXAM_REGISTRY)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Pending Review Queue (/admin/)             │
│   • Diff comparison: Current Date vs Proposed Date     │
│   • Official PDF Circular citation preview             │
│   • Confidence Score (e.g., 95% High vs 60% Low)       │
└───────────────────────────┬────────────────────────────┘
                            │ (Admin Verification & Confirmation)
                            ▼
┌────────────────────────────────────────────────────────┐
│   Canonical Registry Update & Static Rebuild Trigger   │
│   • Immutable Audit Trail Log Entry Created            │
│   • Cloudflare Pages Deployment Triggered              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Configurable Sources Registry

Official monitoring sources are registered in `src/lib/monitor/sources.ts`. Each source entry adheres to the `NoticeSource` contract:

```ts
export interface NoticeSource {
  id: string;                      // Stable authority slug e.g. 'nta-neet'
  authority: string;               // e.g. 'National Testing Agency (NTA)'
  sourceUrl: string;               // Public notices portal
  associatedExamIds: string[];     // Registry IDs to prioritize during matching
  monitoringFrequency: 'daily' | 'hourly' | 'weekly';
  lastChecked: string;             // ISO-8601 UTC timestamp
  lastSuccess: string;             // ISO-8601 UTC timestamp
  status: 'active' | 'degraded' | 'failing';
  selectorHint?: string;           // Optional DOM container hint for notices
  notes?: string;                  // Operational notes
}
```

### Adding a New Official Source

To add a new state board or national entrance exam authority:

1. Open `src/lib/monitor/sources.ts`.
2. Append a new `NoticeSource` object:
   ```ts
   {
     id: 'bihar-bpsc',
     authority: 'Bihar Public Service Commission (BPSC)',
     sourceUrl: 'https://www.bpsc.bih.nic.in/',
     associatedExamIds: ['bpsc-cce-prelims-2027'],
     monitoringFrequency: 'daily',
     lastChecked: new Date().toISOString(),
     lastSuccess: new Date().toISOString(),
     status: 'active',
     notes: 'Official notice board for BPSC Combined Competitive Examination.'
   }
   ```
3. Verify that the associated exam IDs exist in `src/data/exams.ts`.
4. Run automated test suite: `npm test`.

---

## 3. Scheduled Checks & Cloudflare Worker Cron Trigger

To monitor sources automatically without running costly background servers, deploy a lightweight Cloudflare Worker with a Cron Trigger:

### `wrangler.jsonc` or `wrangler.toml` Cron Configuration:
```toml
name = "indiantimers-notice-crawler"
main = "src/worker-cron.ts"
compatibility_date = "2026-10-21"

[triggers]
crons = ["0 6 * * *"] # Fires daily at 06:00 UTC (11:30 AM IST)
```

### Worker Handler Implementation:
```ts
export default {
  async scheduled(event, env, ctx) {
    const adminApiUrl = "https://admin.indiantimers.com/api/admin/check-sources";
    const res = await fetch(adminApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.ADMIN_API_SECRET}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Notice poll completed: ${res.status}`);
  },
};
```

---

## 4. Extraction & Normalization Safeguards

1. **Anti-Spam Content Normalization**:
   - `normalizeContent(html)` strips scripts, styles, random advertising nonces, and session tokens before computing document fingerprints.
   - Prevents false-positive notifications caused by page view counters or dynamic footer timestamps.
2. **Date Extraction Regex**:
   - Supports ISO (`2027-05-02`), Indian slash/dot (`02/05/2027`, `02.05.2027`), and textual month formats (`2 May 2027`, `2nd May 2027`).
   - Detects examination windows: `22 January to 31 January 2027`.
3. **Status Keyword Detection**:
   - Matches keywords: `postponed`, `rescheduled`, `deferred` to flag postponement notices.
4. **Duplicate Suppression**:
   - Circulars matching `sourceId + matchedExamId + proposedExamDate` are automatically deduplicated to prevent queue clutter.
