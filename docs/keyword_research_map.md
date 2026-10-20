# IndianTimers - Search Intent & Keyword-to-URL Architecture Map

## 1. Search Intent Overview
Indian student examination search behavior follows strong cyclical patterns:
1. **Announcement & Notification Phase**: High intent for "exam date", "notification pdf", "calendar 2027", "official schedule".
2. **Registration & Prep Phase**: High intent for "days left for [exam]", "how many days until [exam]", "study timer", "pomodoro for neet", "mock test timer 3 hours".
3. **Admit Card & Revision Phase**: "countdown to [exam] 2027", "session timings", "reporting time", "printable exam calendar".

To maintain technical SEO integrity, every indexable page has exactly **one primary search intent** to prevent keyword cannibalisation.

---

## 2. Keyword-to-URL Mapping

| Route | Primary Search Intent | Target Keywords (Primary & Secondary) | Page Type & Indexability |
| :--- | :--- | :--- | :--- |
| `/` | Universal Exam Countdown Discovery & Timers | exam countdown, exam timer, exam date countdown, days left for exam, online countdown timer India | Homepage / Indexable |
| `/exams/` | Searchable Directory of all Indian Exams | exam calendar India, upcoming exams 2027, list of entrance exams in India, all exam dates | Directory / Indexable |
| `/exams/medical/` | Medical Entrance Exams Hub | medical entrance exam countdown 2027, NEET countdown, NEET PG date, INI CET exam dates | Category Hub / Indexable |
| `/exams/engineering/` | Engineering Entrance Exams Hub | engineering entrance exam countdown, JEE Main countdown 2027, GATE 2027 countdown, BITSAT dates | Category Hub / Indexable |
| `/exams/board-exams/` | Class 10 & 12 Board Exams Hub | board exam countdown 2027, CBSE board exam 2027 countdown, Class 10 exam date, Class 12 board schedule | Category Hub / Indexable |
| `/exams/government/` | Government & Civil Services Exams Hub | UPSC 2027 countdown, SSC CGL exam date, NDA exam countdown, Bank PO exam calendar 2027 | Category Hub / Indexable |
| `/exams/law/` | Law Entrance Exams Hub | CLAT 2027 countdown, AILET exam date, law entrance exam dates India | Category Hub / Indexable |
| `/exams/management/` | MBA Entrance Exams Hub | CAT 2027 countdown, XAT exam date, MBA entrance exam countdown | Category Hub / Indexable |
| `/exams/other-entrance-exams/` | Design, Language & Other Exams Hub | NIFT countdown 2027, CUET UG countdown, IELTS exam dates, NID DAT countdown | Category Hub / Indexable |
| `/calendar/2027/` | Comprehensive Annual Exam Schedule | exam calendar 2027, annual examination schedule India 2027, competitive exam calendar 2027 pdf | Master Calendar / Indexable |
| `/tools/countdown/` | Personalised Custom Event Countdown Tool | custom exam countdown, create exam countdown timer, exam preparation countdown widget | Interactive Tool / Indexable |
| `/tools/pomodoro-timer/` | Focus & Study Interval Timer | pomodoro timer for students, online study timer, study focus timer 25 5, neet pomodoro timer | Interactive Tool / Indexable |
| `/tools/mock-test-timer/` | Official Exam Mock Test Simulation | mock test timer, 3 hour exam timer, 180 minute timer, 200 minute neet mock timer, time per question calculator | Interactive Tool / Indexable |
| `/tools/stopwatch/` | Online Precision Stopwatch with Laps | online stopwatch for exam, study lap stopwatch, precision student stopwatch | Interactive Tool / Indexable |
| `/tools/study-timer/` | Open-Ended Focus & Target Timer | online study timer, revision timer, student daily study tracker | Interactive Tool / Indexable |
| `/dashboard/` | Personal Dashboard & Saved Deadlines | my exam countdowns, saved study sessions, student dashboard | App / NoIndex (Personalised State) |
| `/blog/` | Editorial Exam Prep & Schedule Guides | exam preparation guides, how to plan around exam countdown, official exam notifications | Editorial Hub / Indexable |
| `/blog/exam-calendar-2027-india/` | Researched 2027 Exam Calendar Analysis | Indian exam calendar 2027 analysis, official vs tentative exam dates 2027 | Guide / Indexable |
| `/blog/neet-ug-2027-exam-date-countdown-guide/` | NEET 2027 Timeline & Countdown Strategy | NEET UG 2027 exam date, days left for NEET 2027, NEET 2027 countdown schedule | Guide / Indexable |
| `/blog/jee-main-2027-dates-notification-guide/` | JEE Main 2027 Session Dates & Strategy | JEE Main 2027 countdown, JEE Main 2027 session 1 dates, JEE notification timeline | Guide / Indexable |
| `/blog/cbse-board-exam-2027-schedule-guide/` | CBSE Class 10 & 12 Board Exam Timeline | CBSE board exam 2027 countdown, CBSE 10th date sheet 2027, CBSE 12th exam routine | Guide / Indexable |
| `/blog/upsc-cse-2027-calendar-guide/` | UPSC 2027 Civil Services Timeline | UPSC 2027 countdown, UPSC CSE Prelims 2027 date, UPSC annual calendar 2027 | Guide / Indexable |
| `/blog/gate-2027-schedule-guide/` | GATE 2027 Exam Dates & Pacing Guide | GATE 2027 countdown, GATE 2027 exam dates IIT, GATE preparation timeline | Guide / Indexable |
| `/blog/pomodoro-technique-for-competitive-exams/` | Study Timer Strategy for Indian Exams | how to use pomodoro for neet jee, study timer technique for competitive exams | Guide / Indexable |
| `/blog/how-to-plan-study-time-around-exam-countdown/` | Reverse Timeline Planning Strategy | how to plan study schedule with exam countdown, reverse exam timetable | Guide / Indexable |

---

## 3. High-Priority Exam Landing Pages (Direct Specific Intent)

Each major exam gets a dedicated slug under `/exams/[slug]/` to capture high-intent exact queries:
- `/exams/neet-ug-2027/` — NEET UG 2027 Countdown & Schedule
- `/exams/jee-main-2027-session-1/` — JEE Main 2027 Session 1 Countdown
- `/exams/jee-main-2027-session-2/` — JEE Main 2027 Session 2 Countdown
- `/exams/jee-advanced-2027/` — JEE Advanced 2027 Countdown
- `/exams/upsc-cse-prelims-2027/` — UPSC CSE Prelims 2027 Countdown
- `/exams/upsc-cse-mains-2027/` — UPSC CSE Mains 2027 Countdown
- `/exams/gate-2027/` — GATE 2027 Countdown
- `/exams/cbse-class-10-board-2027/` — CBSE Class 10 Board Exam 2027 Countdown
- `/exams/cbse-class-12-board-2027/` — CBSE Class 12 Board Exam 2027 Countdown
- `/exams/cuet-ug-2027/` — CUET UG 2027 Countdown
- `/exams/clat-2027/` — CLAT 2027 Countdown
- `/exams/cat-2027/` — CAT 2027 Countdown
- `/exams/nda-1-2027/` — NDA & NA (I) 2027 Countdown
- `/exams/ssc-cgl-tier-1-2027/` — SSC CGL Tier 1 2027 Countdown
- *(Plus 36+ more verified examinations across categories)*

---

## 4. Crawl Budget & Indexation Governance
1. Filter combinations (e.g., `/exams?cat=medical&month=5`) will use pushState / client-side filtering without generating parameterised duplicate URLs for web crawlers. Canonical tags will always resolve to the static route.
2. Search query parameters (`?q=...`) will have `noindex, follow` or canonicalise to `/exams/`.
3. Sitemaps will strictly list canonical, 200 OK SSG routes.
