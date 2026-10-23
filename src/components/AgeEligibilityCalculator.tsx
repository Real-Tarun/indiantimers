import React, { useState, useMemo } from 'react';

type ExamType = 'neet' | 'jee-main' | 'jee-adv' | 'upsc' | 'nda';
type CategoryType = 'GEN' | 'OBC' | 'EWS' | 'SC' | 'ST' | 'PwD';

interface EligibilityResult {
  isEligible: boolean;
  badgeText: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  ageOnCutoff: string;
  attemptsStatus: string;
  officialRuleText: string;
  recommendation: string;
}

export default function AgeEligibilityCalculator() {
  const [selectedExam, setSelectedExam] = useState<ExamType>('neet');
  const [dob, setDob] = useState<string>('2008-06-15');
  const [twelfthYear, setTwelfthYear] = useState<number>(2026);
  const [category, setCategory] = useState<CategoryType>('GEN');

  const result = useMemo<EligibilityResult>(() => {
    if (!dob) {
      return {
        isEligible: false,
        badgeText: 'Please Enter Date of Birth',
        badgeColor: 'amber',
        ageOnCutoff: '--',
        attemptsStatus: '--',
        officialRuleText: 'Select your birth date to calculate exact eligibility.',
        recommendation: '',
      };
    }

    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      return {
        isEligible: false,
        badgeText: 'Invalid Date',
        badgeColor: 'rose',
        ageOnCutoff: '--',
        attemptsStatus: '--',
        officialRuleText: 'Please enter a valid date of birth.',
        recommendation: '',
      };
    }

    // ==============================================================
    // 1. NEET UG 2027 (Cutoff date: 31st Dec 2027)
    // ==============================================================
    if (selectedExam === 'neet') {
      const cutoffDate = new Date('2027-12-31T00:00:00');
      let ageYears = cutoffDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = cutoffDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < birthDate.getDate())) {
        ageYears--;
      }

      const isMinAgeMet = birthDate <= new Date('2010-12-31T23:59:59');

      if (isMinAgeMet) {
        return {
          isEligible: true,
          badgeText: 'ELIGIBLE FOR NEET UG 2027',
          badgeColor: 'emerald',
          ageOnCutoff: `${ageYears} Years (on 31-Dec-2027)`,
          attemptsStatus: 'Unlimited Attempts Permitted',
          officialRuleText: 'Candidate must complete minimum 17 years of age on or before 31st December 2027 (Born on or before 31-Dec-2010). Supreme Court removed the upper age limit cap in 2022.',
          recommendation: 'You meet all NTA age conditions. Ensure you have studied Physics, Chemistry, Biology/Biotech in 10+2.',
        };
      } else {
        return {
          isEligible: false,
          badgeText: 'INELIGIBLE: Under-Age for 2027',
          badgeColor: 'rose',
          ageOnCutoff: `${ageYears} Years (Under 17)`,
          attemptsStatus: 'Eligible for NEET 2028 Session',
          officialRuleText: 'Minimum age of 17 years must be completed on or before 31st December of the admission year. Candidates born on or after 1st January 2011 are not eligible for 2027.',
          recommendation: 'You will be eligible to take NEET UG in the 2028 examination cycle.',
        };
      }
    }

    // ==============================================================
    // 2. JEE MAIN 2027 (3 Consecutive Years Rule)
    // ==============================================================
    if (selectedExam === 'jee-main') {
      const allowedPassingYears = [2025, 2026, 2027];
      const isYearEligible = allowedPassingYears.includes(Number(twelfthYear));

      if (isYearEligible) {
        return {
          isEligible: true,
          badgeText: 'ELIGIBLE FOR JEE MAIN 2027',
          badgeColor: 'emerald',
          ageOnCutoff: 'No Upper or Lower Age Limit',
          attemptsStatus: twelfthYear === 2027 ? 'Attempt 1 of 3 (4 Sessions Left)' : twelfthYear === 2026 ? 'Attempt 2 of 3 (2 Sessions Left)' : 'Attempt 3 of 3 (Final Year for JEE Main)',
          officialRuleText: 'For appearing in JEE (Main) 2027, there is no age limit for candidates. Candidates who passed 12th/equivalent in 2025, 2026 or appearing in 2027 are eligible.',
          recommendation: 'You are eligible for both Session 1 (January) and Session 2 (April) of JEE Main 2027.',
        };
      } else {
        return {
          isEligible: false,
          badgeText: 'INELIGIBLE: 3-Year 12th Board Limit Exceeded',
          badgeColor: 'rose',
          ageOnCutoff: 'Exceeded 3 Consecutive Years Limit',
          attemptsStatus: 'JEE Main Attempts Exhausted',
          officialRuleText: 'NTA permits candidates to attempt JEE Main only in 3 consecutive years following their first appearance in Class 12 board exams (passed in 2025, 2026 or 2027).',
          recommendation: 'Explore State Engineering Entrances (MHT-CET, WBJEE, COMEDK) or BITSAT (if 12th passed in 2026).',
        };
      }
    }

    // ==============================================================
    // 3. JEE ADVANCED 2027 (2 Consecutive Years + Age Cap)
    // ==============================================================
    if (selectedExam === 'jee-adv') {
      const isReserved = ['SC', 'ST', 'PwD'].includes(category);
      const minBirthDate = isReserved ? new Date('1997-10-01') : new Date('2002-10-01');
      const isAgeValid = birthDate >= minBirthDate;
      const allowed12th = [2026, 2027];
      const is12thValid = allowed12th.includes(Number(twelfthYear));

      if (isAgeValid && is12thValid) {
        return {
          isEligible: true,
          badgeText: 'ELIGIBLE FOR JEE ADVANCED 2027',
          badgeColor: 'emerald',
          ageOnCutoff: isReserved ? 'Born on/after 1-Oct-1997 (Passed)' : 'Born on/after 1-Oct-2002 (Passed)',
          attemptsStatus: twelfthYear === 2027 ? 'Attempt 1 of 2' : 'Attempt 2 of 2 (Final Attempt)',
          officialRuleText: 'Candidate must have appeared for Class 12 exam for the first time in either 2026 or 2027. Max 2 consecutive attempts permitted. General/OBC candidates must be born on/after 1-Oct-2002.',
          recommendation: 'Must rank within top 2,50,000 in JEE Main 2027 to register for JEE Advanced.',
        };
      } else {
        return {
          isEligible: false,
          badgeText: 'INELIGIBLE FOR JEE ADVANCED 2027',
          badgeColor: 'rose',
          ageOnCutoff: !isAgeValid ? 'Exceeded Age Limit' : 'Exceeded 2-Year Attempt Limit',
          attemptsStatus: '0 Attempts Remaining for IIT Entrance',
          officialRuleText: 'JEE Advanced strictly restricts eligibility to candidates who passed Class 12 in 2026 or 2027, and meet the age threshold as of 1st October 2002 (1997 for SC/ST).',
          recommendation: 'Target NITs, IIITs, or top GFTIs through JEE Main where 3 attempt years are permitted.',
        };
      }
    }

    // ==============================================================
    // 4. UPSC CSE 2027 (Cutoff date: 1st August 2027)
    // ==============================================================
    if (selectedExam === 'upsc') {
      const cutoffDate = new Date('2027-08-01');
      let age = cutoffDate.getFullYear() - birthDate.getFullYear();
      const m = cutoffDate.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && cutoffDate.getDate() < birthDate.getDate())) age--;

      let maxAge = 32;
      let totalAttempts = '6 Attempts';
      if (category === 'OBC') {
        maxAge = 35;
        totalAttempts = '9 Attempts';
      } else if (category === 'SC' || category === 'ST') {
        maxAge = 37;
        totalAttempts = 'Unlimited Attempts (until age 37)';
      } else if (category === 'PwD') {
        maxAge = 42;
        totalAttempts = '9 Attempts (Gen/OBC) / Unlimited (SC/ST)';
      }

      const isMinMet = age >= 21;
      const isMaxMet = age <= maxAge;

      if (isMinMet && isMaxMet) {
        return {
          isEligible: true,
          badgeText: `ELIGIBLE FOR UPSC CSE 2027 (${category})`,
          badgeColor: 'emerald',
          ageOnCutoff: `${age} Years as of 1-Aug-2027`,
          attemptsStatus: `Category Quota: ${totalAttempts}`,
          officialRuleText: `Candidate must be minimum 21 years and not have attained ${maxAge} years on 1st August 2027 for ${category} category under official DoPT rules.`,
          recommendation: 'Ensure graduation degree is completed or in final semester by the time of Preliminary Exam.',
        };
      } else {
        return {
          isEligible: false,
          badgeText: age < 21 ? 'INELIGIBLE: Under 21 on 1-Aug-2027' : 'INELIGIBLE: Upper Age Limit Exceeded',
          badgeColor: 'rose',
          ageOnCutoff: `${age} Years on 1-Aug-2027`,
          attemptsStatus: age < 21 ? 'Eligible in Upcoming Future Years' : 'Age Limit Exhausted',
          officialRuleText: `UPSC CSE requires candidates to be between 21 and ${maxAge} years as of 1st August 2027 for ${category}.`,
          recommendation: age < 21 ? 'Focus on NCERT basics and current affairs foundation until age 21.' : 'Explore State PSCs where upper age limits extend up to 40 years.',
        };
      }
    }

    // ==============================================================
    // 5. NDA & NA (I) 2027 (Age 16.5 to 19.5)
    // ==============================================================
    const minNda = new Date('2007-07-02');
    const maxNda = new Date('2010-07-01');
    const isNdaEligible = birthDate >= minNda && birthDate <= maxNda;

    return {
      isEligible: isNdaEligible,
      badgeText: isNdaEligible ? 'ELIGIBLE FOR NDA 2027' : 'INELIGIBLE FOR NDA 2027',
      badgeColor: isNdaEligible ? 'emerald' : 'rose',
      ageOnCutoff: '16.5 - 19.5 Years Window',
      attemptsStatus: isNdaEligible ? 'Eligible for SSB / Written Test' : 'Age Window Closed',
      officialRuleText: 'Candidate must be born between 2nd July 2007 and 1st July 2010. Only unmarried male and female candidates are eligible.',
      recommendation: isNdaEligible ? 'Prepare for Mathematics (300m) and General Ability Test (600m).' : 'Look into CDS, AFCAT, or INET after college graduation.',
    };
  }, [selectedExam, dob, twelfthYear, category]);

  return (
    <div className="bg-white dark:bg-[#161822] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Input 1: Select Exam */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Target Examination:
          </label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value as any)}
            className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="neet">🩺 NEET UG 2027 (Medical)</option>
            <option value="jee-main">⚙️ JEE Main 2027 (NITs/IIITs)</option>
            <option value="jee-adv">🏛️ JEE Advanced 2027 (IITs)</option>
            <option value="upsc">🇮🇳 UPSC CSE 2027 (IAS/IPS)</option>
            <option value="nda">🎖️ NDA & NA (I) 2027 (Defence)</option>
          </select>
        </div>

        {/* Input 2: Date of Birth */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Date of Birth (DOB):
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Input 3: Class 12 / Graduation Year */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {selectedExam === 'upsc' ? 'Graduation Passing Year:' : '12th Board Passing Year:'}
          </label>
          <select
            value={twelfthYear}
            onChange={(e) => setTwelfthYear(Number(e.target.value))}
            className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="2027">2027 (Appearing This Year)</option>
            <option value="2026">2026 (Passed Last Year)</option>
            <option value="2025">2025 (1st Drop Year)</option>
            <option value="2024">2024 (2nd Drop Year)</option>
            <option value="2023">2023 or Earlier</option>
          </select>
        </div>

        {/* Input 4: Reservation Category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Quota Category:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="GEN">General / Unreserved</option>
            <option value="OBC">OBC-NCL (Non-Creamy Layer)</option>
            <option value="EWS">General EWS</option>
            <option value="SC">Scheduled Caste (SC)</option>
            <option value="ST">Scheduled Tribe (ST)</option>
            <option value="PwD">Persons with Benchmark Disability</option>
          </select>
        </div>
      </div>

      {/* Verified Eligibility Verdict Card */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          result.isEligible
            ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100'
            : 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-950 dark:text-rose-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{result.isEligible ? '✅' : '❌'}</span>
            <span className="font-display font-extrabold text-base sm:text-lg tracking-tight">
              {result.badgeText}
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white dark:bg-slate-800 shadow-xs border border-black/[0.05]">
            {result.ageOnCutoff}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
          <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl">
            <span className="font-bold block text-slate-500 dark:text-slate-400 mb-1">
              Attempt Quota &amp; Remaining Chances:
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {result.attemptsStatus}
            </span>
          </div>
          <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl">
            <span className="font-bold block text-slate-500 dark:text-slate-400 mb-1">
              Official Authority Clause:
            </span>
            <span className="leading-relaxed text-slate-800 dark:text-slate-200">
              {result.officialRuleText}
            </span>
          </div>
        </div>

        {result.recommendation && (
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            💡 <strong>Next Step:</strong> {result.recommendation}
          </p>
        )}
      </div>

      {/* Community Study Channels Callout */}
      <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Got doubts regarding eligibility clauses? Ask in our community:
        </span>
        <div className="flex items-center gap-2">
          <a
            href="https://whatsapp.com/channel/0029VbDeHd8FHWq0d939hU3J"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
          >
            WhatsApp Channel →
          </a>
          <a
            href="https://t.me/indiantimers"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full font-bold bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all shadow-xs"
          >
            Telegram Channel →
          </a>
        </div>
      </div>
    </div>
  );
}
