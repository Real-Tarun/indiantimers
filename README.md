# IndianTimers (indiantimers.com)
> **India's Premier Exam Countdown, Exam Timer & Student Productivity Platform**

[![Build Status](https://img.shields.io/badge/Astro-7.4-BC52EE.svg)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

IndianTimers is a high-performance, technical-SEO-optimized web platform engineered specifically for students across India preparing for national entrance, civil service, defense, and board examinations (including NEET UG/PG, JEE Main/Advanced, UPSC CSE, GATE, CBSE Class 10 & 12, CUET, CAT, and State Boards).

---

## 🌟 Core Value Proposition & Differentiators

1. **Official Schedule Provenance & Honest Status**:
   - Zero manufactured countdowns for unannounced exams.
   - Strict 4-tier status: `Official Confirmed`, `Tentative (Official Calendar)`, `Expected`, or `Date Not Announced`.
   - Every examination links directly to the conducting authority's official circular portal (e.g. NTA, UPSC, IIT, CBSE, IIM).
2. **Integrated Student Focus Suite**:
   - **Pomodoro Timer**: 25/5 Standard and 50/10 Deep Focus presets, Screen Wake Lock support, synthesized audio completion alerts.
   - **Mock Test Simulator**: Official exam duration presets (NEET 200m, JEE 180m, UPSC 120m, CAT 120m), warning alerts at 30m/5m, and a real-time question pacing calculator.
   - **Precision Stopwatch**: Millisecond precision with lap split times.
   - **Custom Countdown Generator**: Shareable URL links and downloadable `.ics` calendar exports.
3. **Privacy-First Personal Dashboard**:
   - Save favorite exams and track custom deadlines.
   - Daily focus session history and 7-day focus streaks.
   - 100% client-side `localStorage` persistence with zero mandatory registration or phone numbers.
   - 1-click JSON backup export and privacy wipe.
4. **Technical SEO Architecture**:
   - 116 statically generated pages with zero layout shift (CLS < 0.05).
   - Valid JSON-LD structured data: `WebSite`, `Organization`, `BreadcrumbList`, `WebApplication`, `Event`, and `Article`.
   - Automated RFC 5545 `.ics` export, Google Calendar web intents, `/robots.txt`, `/sitemap-index.xml`, and `/llms.txt`.

---

## 📁 Repository Architecture

```text
├── docs/
│   ├── competitive_research.md         # Competitor analysis & differentiation matrix
│   ├── keyword_research_map.md         # Search intent & 1:1 keyword-to-URL architecture
│   ├── data_maintenance_workflow.md    # Official date verification rules & provenance guide
│   ├── deployment_and_launch_guide.md  # Cloudflare Pages, Search Console, & analytics checklist
│   └── future_pro_roadmap.md           # Modular architecture for cloud sync & pro features
├── public/
│   ├── favicon.svg                     # High-resolution vector favicon
│   ├── manifest.json                   # Progressive Web App (PWA) manifest
│   ├── robots.txt                      # Crawler directives with sitemap index link
│   └── llms.txt                        # Machine-readable LLM documentation index
├── scripts/
│   ├── test-exams.test.mjs             # Automated test suite (15 unit & validation tests)
│   ├── audit-routes.mjs                # Live HTTP 200 route auditing script
│   └── audit-seo.mjs                   # Canonical & JSON-LD structured data validator
├── src/
│   ├── components/
│   │   ├── CountdownCard.tsx           # Live drift-free countdown card with favorite toggle
│   │   ├── CustomCountdownCreator.tsx  # Personal deadline creator with shareable URL
│   │   ├── ExamDirectory.tsx           # Search & filter island across 50+ examinations
│   │   ├── MockTestTimer.tsx           # Official mock test simulator with question pacing
│   │   ├── PersonalDashboard.tsx       # Student dashboard with study logs & data export
│   │   ├── PomodoroTimer.tsx           # Pomodoro focus loop with synthesized Web Audio bells
│   │   ├── Stopwatch.tsx               # Precision lap stopwatch
│   │   ├── ThemeToggle.tsx             # Dark/Light mode switch
│   │   ├── Header.astro                # Accessible header with responsive mobile drawer
│   │   └── Footer.astro                # Footer with trust policies, links, and disclaimers
│   ├── config/
│   │   └── site.ts                     # Configurable site metadata, canonical domain, & navigation
│   ├── data/
│   │   ├── exams.ts                    # Typed registry covering 50+ national & state examinations
│   │   └── blog.ts                     # 8 editorial guides with verified schedule analyses
│   ├── layouts/
│   │   └── BaseLayout.astro            # Core HTML template with anti-FOUC theme script & SEO schemas
│   ├── pages/
│   │   ├── index.astro                 # Homepage
│   │   ├── exams/                      # Category hubs & searchable directory
│   │   │   ├── [slug].astro            # Pre-rendered landing page for each exam
│   │   │   ├── medical.astro           # Medical entrance hub
│   │   │   ├── engineering.astro       # Engineering entrance hub
│   │   │   ├── board-exams.astro       # Class 10 & 12 board hub
│   │   │   ├── government.astro        # UPSC, SSC, Banking hub
│   │   │   ├── law.astro               # CLAT, AILET law hub
│   │   │   ├── management.astro        # CAT, XAT MBA hub
│   │   │   └── other-entrance-exams.astro # CUET, Design, CA hub
│   │   ├── calendar/2027/index.astro   # Chronological 2027 Master Exam Calendar
│   │   ├── tools/                      # Pomodoro, Mock Test, Stopwatch, Countdown, Study Timer
│   │   ├── dashboard/index.astro       # Personal student dashboard (noindex)
│   │   ├── blog/                       # Editorial guides index & individual articles
│   │   ├── about/                      # About & mission
│   │   ├── contact/                    # Contact & report schedule changes
│   │   ├── editorial-policy/           # Audit standards & date verification policy
│   │   ├── privacy-policy/             # Privacy guarantee & local storage terms
│   │   ├── terms/                      # Terms of service & official non-affiliation disclaimer
│   │   └── 404.astro                   # Custom 404 error page
│   ├── styles/
│   │   └── global.css                  # Tailwind v4 import, custom design tokens, & print styles
│   ├── types/
│   │   └── exam.ts                     # TypeScript definitions for exams, timers, & storage
│   └── utils/
│       ├── audio.ts                    # Synthesized Web Audio API completion chimes
│       ├── calendar.ts                 # RFC 5545 .ics generation & Google Calendar intents
│       ├── countdown.ts                # Zero-drift countdown calculation engine
│       └── storage.ts                  # LocalStorage service for student preferences
├── astro.config.mjs                    # Astro configuration with React, Sitemap, and Tailwind
├── package.json                        # Project dependencies and npm scripts
└── tsconfig.json                       # TypeScript compiler configuration
```

---

## 🚀 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the test suite
npm test

# 3. Start local development server
npm run dev

# 4. Build for production (outputs 116 static pages into dist/)
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 🧪 Testing & Verification Scripts

```bash
# Run unit & registry integrity tests
node --test scripts/test-exams.test.mjs

# Audit live preview routes (returns HTTP 200 check for all 24 sample paths)
node scripts/audit-routes.mjs

# Audit canonical tags and JSON-LD structured data
node scripts/audit-seo.mjs
```

---

## 🌐 Production Deployment

Ready for zero-config deployment on **Cloudflare Pages**, Vercel, or AWS S3/CloudFront.
See [`docs/deployment_and_launch_guide.md`](file:///c:/Users/tarun/OneDrive/Desktop/examtimers/docs/deployment_and_launch_guide.md) for full Cloudflare Pages setup, Google Search Console domain verification, and sitemap indexing instructions.
