# IndianTimers: Cloud Synchronisation & Pro Accounts Architecture

## 1. Architectural Overview

IndianTimers is built on a **local-first foundational architecture**. Users enjoy full functionality—pinning target exams, creating custom mock deadlines, setting display preferences, tracking study hours, and running fullscreen timers—without mandatory accounts, tracking cookies, or external databases.

This document outlines the forward-compatible design and migration path for future authenticated Pro cloud synchronisation, ensuring zero lock-in, safe data transitions, and total user privacy.

```
┌─────────────────────────────────────────────────────────────────┐
│                 UI Layer (Astro + React Components)            │
│      [MyExamCockpit]   [CountdownCard]   [PomodoroTimer]       │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│             Centralized Storage Service Contract                │
│                     (src/utils/storage.ts)                      │
└───────────────┬─────────────────────────────────┬───────────────┘
                │ (Active - Local-First)          │ (Future Pro Adapter)
                ▼                                 ▼
┌────────────────────────────────┐ ┌──────────────────────────────┐
│ LocalStorage Adapter (V1)      │ │ Cloudflare Workers + D1 / KV │
│ • Schema Version 1             │ │ • Server Access Control (RLS)│
│ • Local In-Browser Cache       │ │ • Multi-device Sync          │
│ • Instant Zero-Latency Reads   │ │ • Conflict Resolution Engine │
│ • Local Snapshot Rollback      │ │ • Push Notification Webhooks │
└────────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Authentication & Session Management

When cloud accounts are introduced, registration will remain strictly **optional**. The free local-first experience will remain permanently intact.

### 2.1 Proposed Authentication Principles
- **Passwordless / Magic Link Authentication**: Reduces friction and eliminates password leak vulnerabilities.
- **OAuth 2.0 (Google)**: High adoption among Indian students using Google Classrooms and Android devices.
- **Secure Token Storage**: HTTP-only, `SameSite=Strict`, `Secure` cookies for session tokens. Refresh tokens rotated on every access.
- **Zero Third-Party Trackers**: Authentication handled directly via Cloudflare Workers Auth / Supabase Auth endpoints without ad trackers.

---

## 3. Data Model & Versioned Schema (Schema V1)

All records utilize stable, deterministic identifiers so that records can be merged without data loss:

| Field | Type | Description |
| :--- | :--- | :--- |
| `app` | `string` | `'IndianTimers'` namespace identifier |
| `schemaVersion` | `number` | Version 1 (allows automated future schema migrations) |
| `exportedAt` | `string` | ISO-8601 UTC timestamp |
| `data.savedExamIds` | `string[]` | Stable registry IDs (`neet-ug-2027`, `jee-main-2027-session-1`) |
| `data.favouriteExamIds` | `string[]` | Pinned high-priority examinations |
| `data.customCountdowns`| `PersonalCountdownItem[]` | Custom deadlines with stable IDs, timestamps, and target dates |
| `data.preferences` | `CockpitPreferences` | View mode, sorting, theme, and timer defaults |
| `data.studySessions` | `StudySessionLog[]` | Pomodoro and mock test focus intervals |

---

## 4. Critical Local-to-Cloud Migration Workflow

A common failure in web applications is silently overwriting or dropping a visitor's local configuration upon login. IndianTimers enforces an **explicit 8-step migration workflow**:

### Step 1: Pre-Migration Snapshot
Before initiating login, the local storage adapter captures an immutable in-memory snapshot of:
`{ savedExamIds, favouriteExamIds, customCountdowns, preferences, studySessions }`.

### Step 2: Authentication
The user authenticates via magic link or Google OAuth in an isolated authentication flow.

### Step 3: Cloud State Inspection
The client queries `GET /api/user/sync/summary`:
- Does the cloud account already contain saved records?
- Returns cloud counts: `{ cloudSavedExams: N, cloudCustom: M, lastSyncAt: Timestamp }`.

### Step 4: Interactive Migration Preview Dialog
If the user has existing local items, the system presents an explicit consent modal:
- **Option A: Merge Records (Recommended)**: Combines local items with cloud items.
  - Exam IDs are unioned (`Array.from(new Set([...local, ...cloud]))`).
  - Custom countdowns are deduplicated by title and target date.
  - Study logs are unioned by timestamp and session ID.
- **Option B: Replace Cloud with Local**: Replaces cloud data with the active device dataset.
- **Option C: Keep Separate (Skip Sync)**: Retains local items on device without uploading.

### Step 5: Transactional Upload
The client submits `POST /api/user/sync/migrate` containing the resolved dataset and schema version. The server validates every examination ID against the immutable `EXAM_REGISTRY`.

### Step 6: Server Verification & Integrity Check
The server executes an atomic database transaction. If any validation fails (e.g. malformed date or payload size > 1MB), the server aborts the transaction and returns a structured error.

### Step 7: Confirmation & Local Cache Update
Upon receiving HTTP 200 with confirmation hash, the client marks local records as synchronized and stores the user's `lastSynchronizedAt` timestamp.

### Step 8: Failure Rollback Safety
If the migration fails (network drop, timeout, server error), the client **never erases local data**. The pre-migration snapshot remains intact in browser storage, and the user receives a retry prompt.

---

## 5. Conflict Resolution Strategy for Multi-Device Sync

When a user modifies countdowns on multiple devices (e.g., mobile phone and desktop):

1. **Registry Examinations (`savedExamIds`, `favouriteExamIds`)**:
   - Set-union model (`LWW-Element-Set` CRDT principle). Adding an exam on mobile ensures it appears on desktop.
2. **Custom Countdowns**:
   - Each item contains `createdAt` and `updatedAt` ISO timestamps.
   - If an item with the same ID is edited on both devices, the record with the most recent `updatedAt` timestamp prevails.
3. **Preferences**:
   - Last-Write-Wins (LWW) based on server update timestamp.

---

## 6. Server-Side Security & Access Control

- **Row-Level Security (RLS)**: Users can only query, update, or delete records matching their authenticated `user_id`.
- **Untrusted Input Defense**:
  - String inputs sanitized and length-capped (`title <= 100`, `notes <= 500`).
  - Exam dates strictly verified using ISO date regex before insertion.
  - No HTML or executable script strings permitted.
- **Official Registry Protection**:
  - Official exam dates, syllabus links, and conducting body circulars remain server-immutable. User synchronization can never alter or override official exam dates in the public database.

---

## 7. Data Portability & Account Deletion (DPDP & GDPR Compliance)

In accordance with privacy-by-design principles:
1. **Self-Serve Data Export**: Users can download a full `.json` backup of all cloud records at any time.
2. **1-Click Complete Account Deletion**:
   - `DELETE /api/user/account` purges all cloud records, session tokens, and analytics logs within 24 hours.
   - Cleansed confirmation notice provided to user.
   - User has the choice to retain or clear their device's local cache.
