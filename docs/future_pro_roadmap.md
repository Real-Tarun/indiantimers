# IndianTimers - Future Architecture & Pro Roadmap

## 1. Architectural Readiness for Pro Features
The current release of IndianTimers runs cleanly on client-side `localStorage` through `src/utils/storage.ts`. This interface was intentionally decoupled so that adding cloud sync, user authentication, and multi-device persistence requires **zero rewrite of the countdown engine or timer components**.

```
[UI Components: CountdownCard, PomodoroTimer, MockTestTimer]
                      │
                      ▼
             [Storage Service Interface]
              ├── Mode A (Current): LocalStorage (100% Private, Zero Auth)
              └── Mode B (Future Pro): Cloudflare Workers + D1 / Supabase Auth
```

---

## 2. Planned Pro Feature Roadmap

### Phase 2: Cloud Sync & Personal Reminders
- **Passwordless Student Sign-In**: Magic link or Google OAuth.
- **Cross-Device Sync**: Seamlessly synchronize pinned favorite exams, custom deadlines, and study session histories across laptop, tablet, and mobile.
- **Exam Reminder Notifications**: Automated WhatsApp or Email notifications:
  - When NTA/UPSC releases the official application form
  - 48 hours before registration window closes
  - Admit card release alerts
  - 7-day, 3-day, and 1-day exam countdown reminders

### Phase 3: Advanced Study Analytics
- **Subject-Wise Heatmaps**: Visual breakdown of focus hours across Physics, Chemistry, Biology, Mathematics, or GS papers.
- **Velocity & Accuracy Tracking**: Correlation between solving speed (seconds per question) and practice mock test scores.
- **Goal Streaks**: Daily revision streak badges and weekly focus hour goals.

### Phase 4: Embeddable Widgets & Printable Planners
- **Embeddable Countdowns**: Embed responsive live countdown widgets into student Notion workspaces, Obsidian vaults, or coaching institute blogs.
- **Auto-Generated Printable PDF Planners**: 1-click printable monthly revision calendar populated with the student's target exam dates.

---

## 3. Pricing & Ethics Policy
- The core countdowns, official schedule verifications, 2027 calendar, and basic timer utilities will **remain permanently free** for all students across India.
- Pro tiers will strictly focus on advanced cloud sync, automated SMS/WhatsApp notification delivery costs, and deep analytics.
