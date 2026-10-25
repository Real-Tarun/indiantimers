export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  category: 'Exam Schedule' | 'Study Strategy' | 'Planning' | 'Application Guide';
  readTime: string;
  publishDate: string; // YYYY-MM-DD
  updatedDate: string; // YYYY-MM-DD
  author: {
    name: string;
    role: string;
  };
  summary: string;
  content: string; // Markdown or HTML body
  relatedExamIds: string[];
  relatedArticleSlugs: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'jee-main-2027-registration-form-released-apply-online-link-fees-guide',
    title: 'JEE Main 2027 Registration Form Released: Official Link (jeemain.nta.nic.in), Step-by-Step Guide, Exact Fees & Fatal Mistakes to Avoid',
    subtitle: 'National Testing Agency (NTA) has officially commenced online applications for JEE Main 2027 Session 1 on jeemain.nta.nic.in. Check direct apply link, category-wise fee chart, documents checklist, 75% eligibility rule & live shift countdown.',
    category: 'Application Guide',
    readTime: '11 min read',
    publishDate: '2026-10-25',
    updatedDate: '2026-10-25',
    author: {
      name: 'IndianTimers Engineering Desk',
      role: 'IIT-JEE Academic & Admission Specialist',
    },
    summary: 'The National Testing Agency (NTA) has officially opened the JEE Main 2027 Session 1 registration portal on jeemain.nta.nic.in. Access the direct application link, complete fee structure table, step-by-step registration workflow, document specifications, and 7 fatal mistakes that cause application rejection.',
    relatedExamIds: ['jee-main-2027-session-1', 'jee-main-2027-session-2', 'jee-advanced-2027'],
    relatedArticleSlugs: ['jee-main-2027-dates-notification-guide', 'exam-calendar-2027-india', 'pomodoro-technique-for-competitive-exams'],
    faqs: [
      {
        question: 'What is the official website for JEE Main 2027 application form?',
        answer: 'The sole official portal for JEE (Main) 2027 registration is https://jeemain.nta.nic.in (or via the NTA parent site https://nta.ac.in). Candidates must strictly avoid fake third-party lookalike portals.',
      },
      {
        question: 'What is the last date to apply for JEE Main 2027 Session 1?',
        answer: 'The last date to submit the online application form is November 22, 2026 (up to 11:50 PM IST). Fee payment can also be completed until 11:50 PM on November 22, 2026.',
      },
      {
        question: 'What is the application fee for General category male and female candidates?',
        answer: 'For a single paper (B.E./B.Tech or B.Arch or B.Planning) appearing in India: Male General candidates pay ₹1,000, while Female General candidates pay ₹800. For combined multiple papers, Male General is ₹2,000 and Female is ₹1,600.',
      },
      {
        question: 'Is Aadhaar authentication mandatory for JEE Main 2027 registration?',
        answer: 'While Aadhaar authentication is the fastest method, candidates without Aadhaar can also register using DigiLocker, ABC ID / APAAR ID, Indian Passport, or PAN Card. Candidates registering through non-Aadhaar modes must report 1 hour earlier at the exam centre for biometric verification.',
      },
      {
        question: 'Can I apply for both Session 1 and Session 2 right now?',
        answer: 'Yes. Candidates can apply and pay for both Session 1 (January 2027) and Session 2 (April 2027) simultaneously during this window, or apply for Session 2 separately when its fresh window opens in February.',
      },
      {
        question: 'What happens if my payment was deducted but the Confirmation Page did not generate?',
        answer: 'Do not panic. Bank reconciliation typically takes 24 to 48 hours. If the status remains pending, pay again before the deadline. The failed duplicate deduction is automatically refunded by NTA to the source bank account after reconciliation.',
      },
      {
        question: 'Is the 75% board eligibility criteria mandatory for JEE Main 2027?',
        answer: 'Yes. For admission to NITs, IIITs, and CFTIs via JoSAA/CSAB, candidates must score at least 75% aggregate marks in Class 12 (65% for SC/ST) OR rank in the top 20 percentile of their respective qualifying school board.',
      },
    ],
    content: `
<div class="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 dark:border-emerald-500/40 my-6 shadow-sm">
  <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
    OFFICIAL NTA CIRCULAR ACTIVE · OCTOBER 2026
  </div>
  <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 mb-2 font-display">
    JEE (Main) 2027 Session 1 Application Form Portal is Now Live!
  </h3>
  <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
    The National Testing Agency (NTA) has officially released the Information Bulletin and opened the online application window for <strong>JEE (Main) 2027 Session 1 (January Examination)</strong>. Over 1.4 million engineering aspirants across India and abroad are eligible to register for admissions to premier National Institutes of Technology (NITs), Indian Institutes of Information Technology (IIITs), Centrally Funded Technical Institutes (CFTIs), and qualify for JEE (Advanced) 2027.
  </p>
  <div class="flex flex-wrap items-center gap-3">
    <a
      href="https://jeemain.nta.nic.in/"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#18181B] dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:scale-105 transition-all shadow-md"
    >
      <span>🚀 Open Official Application Portal (jeemain.nta.nic.in)</span>
      <span>→</span>
    </a>
    <a
      href="/exams/jee-main-2027-session-1/"
      class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-xs"
    >
      <span>⏱️ Track Live Shift Countdown</span>
    </a>
  </div>
</div>

<div class="my-8 p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
  <div class="flex items-center justify-between border-b border-slate-800 pb-3">
    <div class="flex items-center gap-2 text-xs font-bold text-slate-300">
      <span class="text-base">⚡</span>
      <span>INDIANTIMERS STUDENT SUITE · 100% FREE ESSENTIAL JEE TOOLS</span>
    </div>
    <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
      Instant Access
    </span>
  </div>
  <p class="text-xs text-slate-300 leading-relaxed">
    While completing your registration, bookmark these curated precision focus tools designed specifically for JEE Main aspirants:
  </p>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
    <a href="/exams/jee-main-2027-session-1/" class="p-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-[#D4FF4F] transition-all group">
      <div class="text-[10px] font-mono text-[#D4FF4F] uppercase font-bold">Shift Timer</div>
      <div class="text-xs font-bold text-white group-hover:text-[#D4FF4F] transition-colors mt-0.5">Live JEE Countdown Clock →</div>
      <div class="text-[11px] text-slate-400 mt-1">Exact second-by-second countdown to January testing shifts.</div>
    </a>
    <a href="/tools/marks-vs-percentile/" class="p-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-indigo-400 transition-all group">
      <div class="text-[10px] font-mono text-indigo-400 uppercase font-bold">AIR Calculator</div>
      <div class="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors mt-0.5">Marks vs Percentile & Rank →</div>
      <div class="text-[11px] text-slate-400 mt-1">Instant NTA percentile & predicted All India Rank from mock scores.</div>
    </a>
    <a href="/tools/college-predictor/" class="p-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-emerald-400 transition-all group">
      <div class="text-[10px] font-mono text-emerald-400 uppercase font-bold">JoSAA Cutoffs</div>
      <div class="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors mt-0.5">NIT & IIIT College Predictor →</div>
      <div class="text-[11px] text-slate-400 mt-1">Explore eligible B.Tech branches across top NITs, IIITs & CFTIs.</div>
    </a>
    <a href="/tools/mock-test-timer/" class="p-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-amber-400 transition-all group">
      <div class="text-[10px] font-mono text-amber-400 uppercase font-bold">CBT Simulator</div>
      <div class="text-xs font-bold text-white group-hover:text-amber-400 transition-colors mt-0.5">180-Minute Full Mock Timer →</div>
      <div class="text-[11px] text-slate-400 mt-1">Simulate 3-hour exam hall pacing with official audio bells.</div>
    </a>
    <a href="/tools/pomodoro-timer/" class="p-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-rose-400 transition-all group">
      <div class="text-[10px] font-mono text-rose-400 uppercase font-bold">Deep Study</div>
      <div class="text-xs font-bold text-white group-hover:text-rose-400 transition-colors mt-0.5">50/10 JEE Focus Pomodoro →</div>
      <div class="text-[11px] text-slate-400 mt-1">Scientifically optimized problem-solving intervals for Physics & Math.</div>
    </a>
    <a href="/calendar/2027/" class="p-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-cyan-400 transition-all group">
      <div class="text-[10px] font-mono text-cyan-400 uppercase font-bold">Master Calendar</div>
      <div class="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors mt-0.5">2027 Indian Exam Calendar →</div>
      <div class="text-[11px] text-slate-400 mt-1">Cross-check board exams with BITSAT, VITEEE & Advanced.</div>
    </a>
  </div>
</div>

## Official Timeline: JEE Main 2027 Session 1 Key Deadlines

The National Testing Agency enforces strict cut-off timestamps for registration, payment verification, and city slip releases. Missing the deadline by even one minute results in disqualification for Session 1. Below is the verified schedule:

<div class="overflow-x-auto my-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
  <table class="w-full text-left text-xs sm:text-sm border-collapse">
    <thead>
      <tr class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
        <th class="p-3.5 font-bold">Examination Milestone / Event</th>
        <th class="p-3.5 font-bold">Official Date / Timeline</th>
        <th class="p-3.5 font-bold">Cut-off Deadline</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3.5 font-semibold">Online Submission of Application Form</td>
        <td class="p-3.5">October 24, 2026 to November 22, 2026</td>
        <td class="p-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">Up to 11:50 PM IST</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <td class="p-3.5 font-semibold">Last Date for Successful Fee Payment</td>
        <td class="p-3.5">November 22, 2026</td>
        <td class="p-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">Up to 11:50 PM IST</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3.5 font-semibold">Application Form Correction Window</td>
        <td class="p-3.5">November 27 to November 29, 2026</td>
        <td class="p-3.5 font-mono font-bold text-slate-600 dark:text-slate-400">Up to 11:50 PM IST</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <td class="p-3.5 font-semibold">Advance City Intimation Slip Release</td>
        <td class="p-3.5">First / Second Week of January 2027</td>
        <td class="p-3.5 font-mono">jeemain.nta.nic.in</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3.5 font-semibold">Downloading of Admit Cards from NTA Portal</td>
        <td class="p-3.5">3 Days before actual exam shift date</td>
        <td class="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">Candidate Login</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <td class="p-3.5 font-semibold">Dates of Examination (Session 1 CBT)</td>
        <td class="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">January 20, 21, 22, 23, 24, and 28, 2027</td>
        <td class="p-3.5 font-mono font-bold">Shift 1 & Shift 2</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3.5 font-semibold">Declaration of Session 1 NTA Percentile Score</td>
        <td class="p-3.5">By Mid-February 2027</td>
        <td class="p-3.5 font-mono">Scorecard on NTA Portal</td>
      </tr>
    </tbody>
  </table>
</div>

## Official Fee Structure Table (Category & Gender Breakdown)

The National Testing Agency has published the official fee matrix for both Indian test centres and Foreign examination cities. Candidates can pay online through Net Banking, Credit Card, Debit Card, or UPI. 

<div class="overflow-x-auto my-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
  <table class="w-full text-left text-xs sm:text-sm border-collapse">
    <thead>
      <tr class="bg-slate-900 text-white border-b border-slate-700">
        <th class="p-3.5 font-bold">Course(s) / Paper(s)<br/><span class="text-[10px] font-normal text-slate-300">पाठ्यक्रम / परीक्षा पत्र</span></th>
        <th class="p-3.5 font-bold">Category / PwD / PwBD<br/><span class="text-[10px] font-normal text-slate-300">श्रेणी / दिव्यांगजन व्यक्ति</span></th>
        <th class="p-3.5 font-bold">Gender<br/><span class="text-[10px] font-normal text-slate-300">लिंग</span></th>
        <th class="p-3.5 font-bold">Fee Per Session (In India)<br/><span class="text-[10px] font-normal text-slate-300">भारत में उपस्थित होने वाले (₹)</span></th>
        <th class="p-3.5 font-bold">Fee Per Session (Outside India)<br/><span class="text-[10px] font-normal text-slate-300">भारत के बाहर उपस्थित होने वाले (₹)</span></th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
      <!-- Group 1: Single Paper -->
      <tr class="bg-indigo-50/40 dark:bg-indigo-950/20 font-bold">
        <td rowspan="7" class="p-3.5 align-top border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div class="font-bold text-slate-900 dark:text-white">Paper 1: B.E./B. Tech</div>
          <div class="text-[11px] text-slate-500 font-normal">or</div>
          <div class="font-bold text-slate-900 dark:text-white">Paper 2A: B. Arch</div>
          <div class="text-[11px] text-slate-500 font-normal">or</div>
          <div class="font-bold text-slate-900 dark:text-white">Paper 2B: B.Planning</div>
          <span class="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">Single Paper</span>
        </td>
        <td rowspan="2" class="p-3.5 align-top font-semibold border-r border-slate-200 dark:border-slate-800">General</td>
        <td class="p-3.5">Male</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 1,000</td>
        <td class="p-3.5 font-mono font-bold">₹ 5,000</td>
      </tr>
      <tr class="bg-indigo-50/40 dark:bg-indigo-950/20">
        <td class="p-3.5">Female</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 800</td>
        <td class="p-3.5 font-mono font-bold">₹ 4,000</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td rowspan="2" class="p-3.5 align-top font-semibold border-r border-slate-200 dark:border-slate-800">Gen-EWS / OBC(NCL)</td>
        <td class="p-3.5">Male</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 900</td>
        <td class="p-3.5 font-mono font-bold">₹ 4,500</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3.5">Female</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 800</td>
        <td class="p-3.5 font-mono font-bold">₹ 4,000</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <td rowspan="2" class="p-3.5 align-top font-semibold border-r border-slate-200 dark:border-slate-800">SC / ST / PwD / PwBD</td>
        <td class="p-3.5">Male</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 500</td>
        <td class="p-3.5 font-mono font-bold">₹ 2,500</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <td class="p-3.5">Female</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 500</td>
        <td class="p-3.5 font-mono font-bold">₹ 2,500</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3.5 font-semibold border-r border-slate-200 dark:border-slate-800">Third Gender</td>
        <td class="p-3.5">All</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 500</td>
        <td class="p-3.5 font-mono font-bold">₹ 2,500</td>
      </tr>

      <!-- Group 2: Combined Multiple Papers -->
      <tr class="border-t-2 border-slate-300 dark:border-slate-700 bg-amber-50/40 dark:bg-amber-950/20 font-bold">
        <td rowspan="5" class="p-3.5 align-top border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div class="font-bold text-slate-900 dark:text-white">Paper 1: B.E./B. Tech & Paper 2A: B. Arch</div>
          <div class="text-[11px] text-slate-500 font-normal">or</div>
          <div class="font-bold text-slate-900 dark:text-white">Paper 1: B.E./B. Tech & Paper 2B: B. Planning</div>
          <div class="text-[11px] text-slate-500 font-normal">or</div>
          <div class="font-bold text-slate-900 dark:text-white">Paper 1: B.E./B.Tech, Paper 2A: B. Arch & Paper 2B: B.Planning</div>
          <div class="text-[11px] text-slate-500 font-normal">or</div>
          <div class="font-bold text-slate-900 dark:text-white">Paper 2A: B. Arch & Paper 2B: B.Planning</div>
          <span class="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Combined Papers</span>
        </td>
        <td rowspan="2" class="p-3.5 align-top font-semibold border-r border-slate-200 dark:border-slate-800">General / Gen-EWS / OBC(NCL)</td>
        <td class="p-3.5">Male</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 2,000</td>
        <td class="p-3.5 font-mono font-bold">₹ 10,000</td>
      </tr>
      <tr class="bg-amber-50/40 dark:bg-amber-950/20">
        <td class="p-3.5">Female</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 1,600</td>
        <td class="p-3.5 font-mono font-bold">₹ 8,000</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td rowspan="2" class="p-3.5 align-top font-semibold border-r border-slate-200 dark:border-slate-800">SC / ST / PwD / PwBD</td>
        <td class="p-3.5">Male</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 1,000</td>
        <td class="p-3.5 font-mono font-bold">₹ 5,000</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3.5">Female</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 1,000</td>
        <td class="p-3.5 font-mono font-bold">₹ 5,000</td>
      </tr>
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
        <td class="p-3.5 font-semibold border-r border-slate-200 dark:border-slate-800">Third Gender</td>
        <td class="p-3.5">All</td>
        <td class="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹ 1,000</td>
        <td class="p-3.5 font-mono font-bold">₹ 5,000</td>
      </tr>
    </tbody>
  </table>
</div>

> **Important Fee Policy Note:** The fee once paid is non-refundable under any circumstances. Payment processing charges and Goods and Services Tax (GST) are applicable over and above the examination fee as per prevailing government tax schedules.

---

## Step-by-Step Guide: How to Fill JEE Main 2027 Application Form

To avoid server timeout or document rejection, follow this exact step-by-step procedure:

### Step 1: Authentication & New Registration
1. Visit the verified portal: **[https://jeemain.nta.nic.in/](https://jeemain.nta.nic.in/)**.
2. Click on the tab titled **"Online Application Form for JEE (Main) 2027 – Session 1"**.
3. Select **"New Candidate Registration"** and choose your authentication mode:
   - **Option A (Recommended)**: Login via **DigiLocker** or **ABC ID (Academic Bank of Credits / APAAR ID)**.
   - **Option B**: Login via **Aadhaar Number** (instant biometric linkage).
   - **Option C**: Login via Indian Passport, Non-Indian Passport, or PAN Card.
4. Input your candidate name, father's name, mother's name, date of birth, mobile number, and active personal email ID.
5. Create a secure password (8–13 characters with at least one uppercase, lowercase, numeric, and special character) and select a security question.
6. Submit the form to generate your unique **12-digit Application Number**.

### Step 2: Filling Academic Details & Paper Selection
1. Log in with your new **Application Number** and **Password**.
2. **Category & Domicile**: Select your category (General, Gen-EWS, OBC-NCL, SC, ST) and State of Eligibility (where you appeared for Class 12).
3. **Paper Selection**: Choose **Paper 1 (B.E./B.Tech)**, **Paper 2A (B.Arch)**, **Paper 2B (B.Planning)**, or combined papers.
4. **Medium of Question Paper**: Select from 13 available languages (English, Hindi, Assamese, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu).

### Step 3: Exam City Selection (Strategic Rule)
- You must select **4 exam cities in order of priority** from your State of Permanent Address or State of Present Address.
- **Tip**: Choose cities with direct rail or highway connectivity. NTA almost always allocates your Priority 1 choice if registered early.

### Step 4: Uploading Scanned Documents (Strict Dimensions)
NTA's automated document verification system will instantly reject images that do not meet these parameters:
- **Recent Passport Photograph**:
  - File format: **JPG/JPEG**
  - File size: **10 KB to 200 KB**
  - Dimensions: Clearly visible face (80% face coverage, ears visible), pure white background, no sunglasses or caps.
- **Candidate Signature**:
  - File format: **JPG/JPEG**
  - File size: **4 KB to 30 KB**
  - Drawn with blue/black ink on unruled white paper. Never upload signatures in ALL CAPITAL letters.
- **Category / PwD Certificate (if applicable)**:
  - File format: **PDF**
  - File size: **50 KB to 300 KB**

### Step 5: Online Fee Payment & Confirmation Page
1. Review the summary page thoroughly before the final submit.
2. Select your payment gateway (SBI, HDFC, Canara Bank, ICICI) and pay via UPI, Net Banking, or Debit Card.
3. **Crucial**: Once the transaction is successful, download and print at least **4 copies of the Confirmation Page**. This page is mandatory during JoSAA counselling and verification.

---

## 7 Fatal Mistakes That Cause Application Rejection

Every year, over 25,000 students face form rejection or examination center cancellation due to preventable procedural errors:

1. **Aadhaar vs Class 10 Certificate Name Discrepancy**: Your name and Date of Birth on the NTA form must match your Class 10 Board certificate *letter-for-letter*. If your Aadhaar card has spelling differences or missing surnames, update Aadhaar before applying or submit an official gazetted name affidavit.
2. **Outdated OBC-NCL or Gen-EWS Certificates**: Central institutes (NITs/IIITs) require category certificates issued in the current financial year (on or after April 1, 2026). State OBC certificates that are not on the Central OBC List are treated as General.
3. **Casual Selfies / Filtered Photos**: Photos taken against domestic walls, dark backgrounds, or featuring spectacle glare are flagged by AI auditing. Always use a professional studio photograph with a clean white background.
4. **Providing Coaching Center or Cyber Café Mobile Number**: All crucial NTA communications, OTPs for correction windows, city slip alerts, and response sheets are sent exclusively to your registered mobile and email. Always use your personal or parent's permanent mobile number.
5. **Selecting Single Session by Mistake**: If you intend to take both January and April attempts, check both session boxes or ensure you mark your calendar to register for Session 2 in February.
6. **Payment Debit without Confirmation Page Generation**: A bank SMS confirming debit does *not* mean your application is complete. Unless you see the green "Confirmation Page Generated" tick mark, your application remains unsubmitted.
7. **Waiting for the Last 48 Hours**: On the final two days before November 22, the NTA server handles hundreds of concurrent requests per second, leading to gateway timeouts and failed payments. Complete your registration at least 7 days before the deadline.

---

## Eligibility Criteria & The 75% Board Rule

Before paying your examination fee, ensure you satisfy all core eligibility conditions:

### 1. Age Limit
- There is **no upper age limit** for candidates appearing in JEE (Main) 2027. Any candidate who has passed Class 12 or equivalent examination can appear regardless of age.

### 2. Year of Appearance in Qualifying Examination (10+2)
- Candidates must have passed Class 12 in **2025, 2026**, or be currently appearing in **2027**.
- Candidates who passed Class 12 in 2024 or earlier are **not eligible** for JEE (Main) 2027.

### 3. The 75% Admission Criteria (JoSAA & CSAB)
- While any passing student can write the JEE Main exam to obtain a percentile, admission to B.Tech / B.Arch seats in NITs, IIITs, and CFTIs requires:
  - Minimum **75% aggregate marks** in the Class 12 examination (65% for SC/ST candidates), **OR**
  - Ranking within the **Top 20 Percentile** of successful candidates in your respective Class 12 school board.

---

## Session 1 vs Session 2 Strategy: Should You Apply for Both?

We strongly recommend registering for **both Session 1 and Session 2**:

1. **No Negative Score Retention**: NTA only considers your **best NTA percentile score** out of the two attempts when preparing the final All India Rank (AIR) merit list. A lower score in one session will never degrade your rank.
2. **First-Attempt Advantage**: Session 1 (January) historically features lower competition per shift because many Class 12 candidates are preoccupied with school pre-boards. Achieving a 99+ percentile in January allows you to dedicate February and March entirely to CBSE Board preparation and JEE Advanced.
3. **Experience with the CBT Environment**: Practicing with our [Mock Test Simulator](/tools/mock-test-timer/) and experiencing the real January CBT shift eliminates exam-hall anxiety for the April attempt.

<div class="my-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
  <div>
    <h3 class="text-base sm:text-lg font-black font-display">Stay Updated on Live NTA Circulars & Answer Key Releases</h3>
    <p class="text-xs text-blue-100 mt-1 max-w-xl">
      Join over 45,000+ serious JEE aspirants receiving instant official notification alerts, shift-wise difficulty audits, and marks vs percentile projections.
    </p>
  </div>
  <div class="flex items-center gap-2 shrink-0">
    <a
      href="https://t.me/indiantimers"
      target="_blank"
      rel="noopener noreferrer"
      class="px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-blue-700 hover:bg-blue-50 transition-all shadow-md flex items-center gap-1.5"
    >
      <span>Join Telegram</span>
      <span>→</span>
    </a>
  </div>
</div>
    `,
  },
  {
    slug: 'exam-calendar-2027-india',
    title: 'Indian Examination Calendar 2027: Official vs Tentative Schedule Analysis',
    subtitle: 'A comprehensive audit of national entrance windows, conducting body notification timelines, and critical date distinctions.',
    category: 'Exam Schedule',
    readTime: '7 min read',
    publishDate: '2026-10-15',
    updatedDate: '2026-10-19',
    author: {
      name: 'IndianTimers Research Team',
      role: 'Examination Schedule Analysts',
    },
    summary: 'Every year, millions of Indian aspirants plan preparation around examination calendars. We break down which 2027 dates are officially confirmed by UPSC and CBSE, and which are tentative projections.',
    relatedExamIds: ['upsc-cse-prelims-2027', 'cbse-class-10-board-2027', 'neet-ug-2027', 'jee-main-2027-session-1'],
    relatedArticleSlugs: ['how-to-plan-study-time-around-exam-countdown', 'neet-ug-2027-exam-date-countdown-guide'],
    content: `
## Why Date Status Distinction Matters for Students

In Indian competitive entrance exams, planning mistakes carry heavy consequences. Misinterpreting an unconfirmed social media rumor as an official date can lead to premature burnout or delayed revision schedules.

At **IndianTimers**, we categorize schedules into three actionable categories:

1. **Official Confirmed**: Backed by a signed circular from the conducting body (e.g., UPSC Annual Calendar 2027 or CBSE Board circulars).
2. **Tentative (Annual Calendar)**: Listed in preliminary administrative calendars but subject to administrative or election adjustments.
3. **Expected / Date Not Announced**: Based on historical precedent before the conducting body issues an official notification.

---

## 2027 High-Impact Examination Schedule Overview

### 1. UPSC Civil Services Examination 2027
- **Official Prelims Date**: May 23, 2027 (Sunday)
- **Official Mains Date**: Commencing September 17, 2027 (5 Days)
- **Notification Release**: January 20, 2027
- **Audit Citation**: UPSC Annual Programme of Examinations / RTs 2027, Item No. 8.

### 2. Central Board of Secondary Education (CBSE)
- **Class 10 Commencement**: February 15, 2027
- **Class 12 Commencement**: February 15, 2027
- **Policy Standard**: CBSE policy permanently fixes February 15 as the commencement date for annual secondary examinations.

### 3. Engineering & Medical Entrance Cycles (NTA)
- **JEE Main 2027 Session 1**: Tentative testing window spans late January 2027.
- **NEET UG 2027**: Tentative schedule aligns with the first Sunday of May (May 2, 2027), subject to final NTA notification.

---

## Recommended Strategy for Students

- **Never rely on unverified social media handles**: Bookmark only official portals (.gov.in or .ac.in).
- **Plan in 3-week revision buffers**: Always assume the earliest possible tentative date so any schedule extension acts as bonus mock time.
    `,
  },
  {
    slug: 'neet-ug-2027-exam-date-countdown-guide',
    title: 'NEET UG 2027 Exam Date, Notification Timeline & Countdown Strategy',
    subtitle: 'How to structure your Biology, Physics, and Chemistry revision as the 200-minute examination approaches.',
    category: 'Exam Schedule',
    readTime: '8 min read',
    publishDate: '2026-10-16',
    updatedDate: '2026-10-18',
    author: {
      name: 'IndianTimers Medical Prep Desk',
      role: 'Curriculum & Test Analyst',
    },
    summary: 'Detailed timeline of the NTA NEET UG 2027 application cycle, CBT interface tips, and how to utilize the 200-minute mock test timer.',
    relatedExamIds: ['neet-ug-2027', 'ini-cet-may-2027'],
    relatedArticleSlugs: ['pomodoro-technique-for-competitive-exams', 'how-to-plan-study-time-around-exam-countdown'],
    content: `
## NEET UG 2027: Key Timeline Milestones

The National Eligibility cum Entrance Test (NEET UG) is India's sole qualifying entrance for MBBS and BDS programs across all institutions, including AIIMS and JIPMER.

### Tentative Schedule Breakdown
- **Information Bulletin Release**: First week of February 2027
- **Online Application Form Window**: February to March 2027
- **Admit Card Release**: Late April 2027
- **Examination Date**: First Sunday of May 2027 (02:00 PM to 05:00 PM IST)

---

## The 180-Minute / 180-Question Exam Structure

The revised NEET pattern features **180 minutes (3 hours)** for 180 compulsory questions, with optional Section B questions removed:
- **Physics**: 45 Compulsory Questions (180 Marks)
- **Chemistry**: 45 Compulsory Questions (180 Marks)
- **Biology (Botany & Zoology)**: 90 Compulsory Questions (360 Marks)

---

## Time Allocation Recommendations

1. **Biology (90 Questions)**: 45–50 minutes. Because NCERT questions are largely factual, solving questions swiftly is achievable.
2. **Chemistry (45 Questions)**: 45–50 minutes. Tackle Organic & Inorganic swiftly, reserving time for Physical numerical calculations.
3. **Physics (45 Questions)**: 60–65 minutes. Requires extensive multi-step computations and unit conversions.
4. **CBT Review & Double-Check Buffer**: 15–20 minutes. Use digital flagging ('Mark for Review') during the exam and revisit flagged questions before submitting.
    `,
  },
  {
    slug: 'jee-main-2027-dates-notification-guide',
    title: 'JEE Main 2027 Session Dates, Eligibility & Notification Process',
    subtitle: 'A complete overview of the two-session structure, percentile calculation, and shift timing management.',
    category: 'Exam Schedule',
    readTime: '7 min read',
    publishDate: '2026-10-14',
    updatedDate: '2026-10-17',
    author: {
      name: 'IndianTimers Engineering Desk',
      role: 'IIT-JEE Academic Specialist',
    },
    summary: 'Everything engineering aspirants need to know regarding JEE Main Session 1 and Session 2 testing windows, 75% board criteria, and CBT computer interface pacing.',
    relatedExamIds: ['jee-main-2027-session-1', 'jee-main-2027-session-2', 'jee-advanced-2027'],
    relatedArticleSlugs: ['exam-calendar-2027-india', 'how-to-plan-study-time-around-exam-countdown'],
    content: `
## Understanding the Two-Session JEE Main Framework

The National Testing Agency administers JEE Main in two separate windows:
1. **Session 1 (Winter Window)**: Late January 2027
2. **Session 2 (Spring Window)**: Early April 2027

Appearing in both sessions is optional but highly recommended. The candidate's **best NTA percentile score** across the two sessions is retained for the All India Rank (AIR) calculation.

---

## Paper 1 (B.E. / B.Tech) Pattern
- **Total Marks**: 300 Marks
- **Total Questions**: 75 Questions (25 each in Mathematics, Physics, Chemistry)
- **Compulsory Sections**: Both Section A (MCQs) and Section B (Numerical Value Questions) feature negative marking (-1 mark for wrong answers).
- **Shift Timings**: Shift 1 (09:00 AM – 12:00 PM) and Shift 2 (03:00 PM – 06:00 PM).

---

## Key Tactical Advice
- **Adapt to CBT Screen Navigation**: Use our [Mock Test Simulator](/tools/mock-test-timer/) to simulate 180-minute full screen concentration.
- **Balance Math Speed**: Mathematics papers in recent years have featured lengthy algebraic calculations. Prioritize high-weightage topics like Vectors, 3D Geometry, and Calculus.
    `,
  },
  {
    slug: 'cbse-board-exam-2027-schedule-guide',
    title: 'CBSE Class 10 & 12 Board Exam 2027: Schedule Guidance & 15-Minute Reading Rule',
    subtitle: 'Navigating the official February 15 commencement date, sample papers, and answer booklet presentation.',
    category: 'Exam Schedule',
    readTime: '6 min read',
    publishDate: '2026-10-12',
    updatedDate: '2026-10-18',
    author: {
      name: 'IndianTimers School Board Desk',
      role: 'Secondary Education Lead',
    },
    summary: 'Guide for CBSE Class 10 and 12 students on date sheet release cycles, 10:15 AM question paper reading strategies, and marking scheme nuances.',
    relatedExamIds: ['cbse-class-10-board-2027', 'cbse-class-12-board-2027'],
    relatedArticleSlugs: ['exam-calendar-2027-india'],
    content: `
## Official Policy: February 15 Commencement

CBSE circular policy establishes February 15 as the permanent start date for Class X and Class XII examinations. Major academic subjects are sequenced from mid-February through March.

### Daily Exam Day Timeline
- **10:00 AM**: Mandatory entry into examination hall.
- **10:15 AM**: Question paper distribution for the mandatory 15-minute silent reading period.
- **10:30 AM**: Writing commences strictly.
- **01:30 PM**: Examination concludes.

---

## Maximizing the 15-Minute Reading Period

Never attempt to read every single question superficially. Instead:
1. **Section Selection**: In Sections with internal choices (e.g. choice between two 5-mark physics derivations), decide immediately which option you will attempt.
2. **Case Study Pre-viewing**: Read the data tables and scenario context in competency-based questions.
3. **Calm Mental Focus**: Settle breathing and check that all paper pages are properly printed.
    `,
  },
  {
    slug: 'upsc-cse-2027-calendar-guide',
    title: 'UPSC 2027 Civil Services Calendar: Prelims, Mains & Strategy',
    subtitle: 'Analysis of the officially gazetted UPSC Annual Calendar 2027 dates and syllabus milestones.',
    category: 'Exam Schedule',
    readTime: '7 min read',
    publishDate: '2026-10-15',
    updatedDate: '2026-10-19',
    author: {
      name: 'IndianTimers Civil Services Desk',
      role: 'UPSC Exam Mentor',
    },
    summary: 'Detailed examination of the May 23, 2027 Prelims date, CSAT qualifying criteria, the 3-hour noon gap strategy, and Mains scheduling.',
    relatedExamIds: ['upsc-cse-prelims-2027', 'upsc-cse-mains-2027'],
    relatedArticleSlugs: ['exam-calendar-2027-india', 'how-to-plan-study-time-around-exam-countdown'],
    content: `
## UPSC Annual Calendar 2027 Confirmation

The Union Public Service Commission released its official Annual Programme of Examinations for 2027:
- **Civil Services (Preliminary) Examination 2027**: May 23, 2027 (Sunday)
- **Civil Services (Main) Examination 2027**: September 17, 2027 (5 Days duration)

---

## Tackling the 3-Hour Noon Gap between GS and CSAT

On Prelims day:
- **GS Paper 1**: 09:30 AM to 11:30 AM
- **CSAT Paper 2**: 02:30 PM to 04:30 PM

Between 11:30 AM and 02:30 PM, candidates face 3 hours of downtime in summer heat. 
- Avoid heavy lunches that trigger afternoon drowsiness during reading comprehension.
- Never discuss Paper 1 answers with peers outside the center; post-mortems elevate anxiety and degrade CSAT performance.
- Use our [Mock Test Simulator](/tools/mock-test-timer/) to simulate both papers back-to-back with the real interval.
    `,
  },
  {
    slug: 'gate-2027-schedule-guide',
    title: 'GATE 2027 Schedule: Exam Windows, Virtual Calculator & PSU Recruitment',
    subtitle: 'Navigating February testing weekends, MSQs, NATs, and score validity across 30 engineering disciplines.',
    category: 'Exam Schedule',
    readTime: '6 min read',
    publishDate: '2026-10-11',
    updatedDate: '2026-10-18',
    author: {
      name: 'IndianTimers Engineering Desk',
      role: 'Postgraduate Entrance Lead',
    },
    summary: 'Key dates for GATE 2027 organized across early February weekends, virtual calculator tips, and dual paper options.',
    relatedExamIds: ['gate-2027', 'isro-scientist-2027'],
    relatedArticleSlugs: ['exam-calendar-2027-india'],
    content: `
## GATE 2027 Overview

Organized under the auspices of the National Coordination Board (NCB) by the designated IIT, GATE 2027 tests comprehensive understanding across 30 subject papers.

### Key Milestones
- **Application Window**: Late August to early October 2026
- **Examination Dates**: First two weekends of February 2027
- **Results Announcement**: Mid-March 2027
- **Scorecard Validity**: 3 Years for M.Tech admissions

---

## Virtual Calculator Mastery
Physical calculators are banned. The on-screen virtual calculator features distinct precedence rules for brackets and trigonometric operations. Practicing calculations through on-screen interfaces during weekly mocks prevents catastrophic calculation delays on exam day.
    `,
  },
  {
    slug: 'pomodoro-technique-for-competitive-exams',
    title: 'How to Adapt the Pomodoro Technique for Indian Competitive Exams',
    subtitle: 'Why standard 25-minute loops fail for advanced physics and mathematics, and how the 50/10 protocol fixes it.',
    category: 'Study Strategy',
    readTime: '6 min read',
    publishDate: '2026-10-15',
    updatedDate: '2026-10-18',
    author: {
      name: 'IndianTimers Cognitive Focus Lab',
      role: 'Learning Scientist',
    },
    summary: 'A practical framework adapting the classic Pomodoro loop to high-difficulty Indian examinations requiring sustained 3-hour problem-solving endurance.',
    relatedExamIds: ['neet-ug-2027', 'jee-main-2027-session-1', 'upsc-cse-prelims-2027'],
    relatedArticleSlugs: ['how-to-plan-study-time-around-exam-countdown'],
    content: `
## The Limitation of Standard 25-Minute Pomodoros

The classic 25-minute Pomodoro was designed for short office tasks. In competitive exams like JEE Advanced, UPSC, or GATE:
- A single multi-concept physics problem or legal passage can take 8 to 15 minutes to solve.
- Ringing a bell at 25 minutes forcibly ejects the student from the flow state before deep synthesis occurs.

---

## The 50/10 Protocol for Competitive Exams

We recommend adopting a **50-Minute Focus / 10-Minute Recovery** rhythm:
1. **Minutes 0–5**: Quick problem setup and formula recall.
2. **Minutes 5–45**: Uninterrupted deep problem solving.
3. **Minutes 45–50**: Error auditing and formula notebook logging.
4. **Minutes 50–60 (Break)**: Complete physical step-away (water, stretching, walking).

Our [Pomodoro Focus Timer](/tools/pomodoro-timer/) features this 50/10 Deep Focus Preset ready with one click.
    `,
  },
  {
    slug: 'how-to-plan-study-time-around-exam-countdown',
    title: 'Reverse Timeline Planning: Building Schedules from an Exam Countdown',
    subtitle: 'Transform remaining calendar days into actionable syllabus completion milestones and mock phases.',
    category: 'Planning',
    readTime: '7 min read',
    publishDate: '2026-10-14',
    updatedDate: '2026-10-18',
    author: {
      name: 'IndianTimers Strategy Team',
      role: 'Academic Productivity Lead',
    },
    summary: 'A step-by-step methodology to partition your remaining exam countdown days into Syllabus Coverage, Active Recall, and Simulation phases.',
    relatedExamIds: ['neet-ug-2027', 'jee-main-2027-session-1', 'cbse-class-12-board-2027'],
    relatedArticleSlugs: ['pomodoro-technique-for-competitive-exams', 'exam-calendar-2027-india'],
    content: `
## Why Countdowns Motivate When Paired with Reverse Timelines

Seeing "142 Days Left" on a countdown creates anxiety unless every day is mapped to a concrete milestone.

Reverse planning starts at **Exam Day (Day 0)** and works backwards:

---

## The 3-Phase Countdown Model

### Phase 3: Final Simulation & Biological Adaptation (Last 30 Days)
- **Goal**: Exam-hall endurance and biological rhythm alignment.
- Run full-length mock papers strictly at the official exam time (e.g. 02:00 PM to 05:00 PM for NEET).
- No new topics; purely error notebook review.

### Phase 2: Active Recall & PYQ Drills (Days -90 to -30)
- **Goal**: Solving previous 10 years papers topic-by-topic.
- Transition from reading textbooks to active question practice.

### Phase 1: Comprehensive Syllabus Coverage (Days -180 to -90)
- **Goal**: Completing fundamental syllabus theory and NCERT exercises.
- Track daily focus hours using our [Personal Dashboard](/dashboard/).
    `,
  },
];
