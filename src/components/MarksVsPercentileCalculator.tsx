import React, { useState, useMemo } from 'react';

// Data models for predictive models
interface JEEPredictResult {
  percentileRange: string;
  airRange: string;
  qualificationStatus: string;
  collegeTier: string;
  branchProspects: string;
}

interface NEETPredictResult {
  airRange: string;
  aiqMbbsChance: string;
  stateQuotaChance: string;
  collegeRecommendation: string;
}

export default function MarksVsPercentileCalculator() {
  const [activeTab, setActiveTab] = useState<'jee' | 'neet'>('jee');

  // JEE Main State
  const [jeeMarks, setJeeMarks] = useState<number>(165);
  const [jeeShiftDifficulty, setJeeShiftDifficulty] = useState<'easy' | 'moderate' | 'tough'>('moderate');
  const [jeeCategory, setJeeCategory] = useState<'GEN' | 'EWS' | 'OBC' | 'SC' | 'ST'>('GEN');

  // NEET UG State
  const [neetMarks, setNeetMarks] = useState<number>(625);
  const [neetCategory, setNeetCategory] = useState<'GEN' | 'OBC' | 'EWS' | 'SC' | 'ST'>('GEN');

  // Calculations for JEE Main based on shift difficulty and historical calibrations
  const jeeResult = useMemo<JEEPredictResult>(() => {
    // Shift calibration offset: tough shift requires lower marks, easy shift requires higher marks
    let effectiveMarks = jeeMarks;
    if (jeeShiftDifficulty === 'tough') effectiveMarks += 18;
    if (jeeShiftDifficulty === 'easy') effectiveMarks -= 16;

    if (effectiveMarks >= 270) {
      return {
        percentileRange: '99.92 - 100.00',
        airRange: 'Top 100 - 900',
        qualificationStatus: 'Eligible for JEE Advanced (Top 0.1%)',
        collegeTier: 'Top 3 NITs (Trichy, Surathkal, Warangal)',
        branchProspects: 'Computer Science (CSE) / Data Science (AI)',
      };
    } else if (effectiveMarks >= 230) {
      return {
        percentileRange: '99.40 - 99.85',
        airRange: '1,000 - 7,000',
        qualificationStatus: 'Eligible for JEE Advanced (High Prob)',
        collegeTier: 'Top NITs (Rourkela, Calicut, Allahabad, Jaipur) & IIIT Hyderabad/Allahabad',
        branchProspects: 'CSE / ECE / Artificial Intelligence',
      };
    } else if (effectiveMarks >= 190) {
      return {
        percentileRange: '98.50 - 99.30',
        airRange: '8,000 - 18,000',
        qualificationStatus: 'Eligible for JEE Advanced',
        collegeTier: 'Reputed NITs (Silchar, Durgapur, Bhopal, Jalandhar) & Top IIITs',
        branchProspects: 'ECE, Electrical, Mechanical Engineering',
      };
    } else if (effectiveMarks >= 150) {
      return {
        percentileRange: '97.00 - 98.40',
        airRange: '19,000 - 36,000',
        qualificationStatus: 'Eligible for JEE Advanced',
        collegeTier: 'Mid-Tier NITs, IIITs & Leading State Govt Engineering Colleges',
        branchProspects: 'Mechanical, Chemical, Civil & Core Engineering',
      };
    } else if (effectiveMarks >= 120) {
      return {
        percentileRange: '94.50 - 96.80',
        airRange: '38,000 - 68,000',
        qualificationStatus: 'Eligible for JEE Advanced',
        collegeTier: 'North-Eastern NITs, GFTIs & State Technical Universities',
        branchProspects: 'Civil, Metallurgy, Production, Home-State Quota Core',
      };
    } else if (effectiveMarks >= 95) {
      const isQualified = jeeCategory !== 'GEN' || effectiveMarks >= 98;
      return {
        percentileRange: '89.50 - 94.00',
        airRange: '70,000 - 1,30,000',
        qualificationStatus: isQualified ? 'Qualified for JEE Advanced (Category/Borderline)' : 'Borderline for General Category JEE Adv Cutoff',
        collegeTier: 'Home State GFTIs & Top Private Universities (LNMIIT, Thapar, Jaypee)',
        branchProspects: 'All Branches via State/Private Counselling',
      };
    } else if (effectiveMarks >= 65) {
      const isReservedQualified = ['OBC', 'EWS', 'SC', 'ST'].includes(jeeCategory);
      return {
        percentileRange: '78.00 - 88.50',
        airRange: '1,40,000 - 2,70,000',
        qualificationStatus: isReservedQualified ? 'Eligible for JEE Advanced (Reserved Cutoff Met)' : 'Not Eligible for JEE Advanced (General)',
        collegeTier: 'State Entrance Counselling & Autonomous Private Engineering Colleges',
        branchProspects: 'State Merit Based Technical Seats',
      };
    } else {
      return {
        percentileRange: 'Below 75.00',
        airRange: '2,80,000+',
        qualificationStatus: jeeCategory === 'SC' || jeeCategory === 'ST' ? 'Eligible for JEE Advanced (SC/ST Cutoff Met)' : 'Cutoff not cleared for JEE Advanced',
        collegeTier: 'Direct Admission / State Private College Counseling',
        branchProspects: 'Consider State CETs (MHT-CET, WBJEE, COMEDK)',
      };
    }
  }, [jeeMarks, jeeShiftDifficulty, jeeCategory]);

  // Calculations for NEET UG based on 720 Marks Benchmark
  const neetResult = useMemo<NEETPredictResult>(() => {
    if (neetMarks >= 700) {
      return {
        airRange: 'AIR 1 - 250',
        aiqMbbsChance: '100% Guaranteed (All India Quota)',
        stateQuotaChance: '100% Guaranteed (Rank 1 State Merit)',
        collegeRecommendation: 'AIIMS New Delhi, JIPMER Puducherry, MAMC New Delhi, VMMC New Delhi',
      };
    } else if (neetMarks >= 670) {
      return {
        airRange: 'AIR 250 - 2,500',
        aiqMbbsChance: '100% Confirmed Top Medical Colleges',
        stateQuotaChance: 'Top GMC of Any Indian State',
        collegeRecommendation: 'Top Central AIIMS (Bhopal, Rishikesh, Bhubaneswar, Jodhpur) & Top State GMCs (KGMU, Seth GS Mumbai)',
      };
    } else if (neetMarks >= 635) {
      return {
        airRange: 'AIR 2,500 - 14,000',
        aiqMbbsChance: 'High (All India 15% Quota MBBS Seat Secure)',
        stateQuotaChance: 'Top-Tier Government Medical Colleges in Home State',
        collegeRecommendation: 'Established Government Medical Colleges across India & Peripheral AIIMS',
      };
    } else if (neetMarks >= 610) {
      return {
        airRange: 'AIR 14,000 - 28,000',
        aiqMbbsChance: neetCategory === 'GEN' ? 'Borderline for Round 2/3 Stray Vacancy' : 'High for OBC / EWS / SC / ST Quota',
        stateQuotaChance: 'Confirmed Government MBBS Seat in State 85% Quota',
        collegeRecommendation: 'State Government Medical Colleges, Semi-Govt GMCs & AIQ Mop-Up Rounds',
      };
    } else if (neetMarks >= 550) {
      return {
        airRange: 'AIR 28,000 - 75,000',
        aiqMbbsChance: ['SC', 'ST'].includes(neetCategory) ? 'Confirmed Government MBBS Seat' : 'Low for AIQ General; High for BDS / BAMS / BHMS',
        stateQuotaChance: 'State Quota MBBS for Reserved / High for Govt BDS & Top Ayurvedic (BAMS)',
        collegeRecommendation: 'Government Dental Colleges, Premier Ayurvedic/Homeopathic Colleges, State Semi-Govt MBBS',
      };
    } else if (neetMarks >= 450) {
      return {
        airRange: 'AIR 75,000 - 1,75,000',
        aiqMbbsChance: neetCategory === 'ST' ? 'Eligible for Govt MBBS/BDS' : 'Private / Deemed University MBBS Merit Seats',
        stateQuotaChance: 'Private Medical Colleges (Semi-Govt Subsidized Seats), BAMS, BHMS, B.V.Sc',
        collegeRecommendation: 'Deemed Universities (KMC Manipal, Symbiosis, DY Patil) & Top Private Medical Colleges',
      };
    } else if (neetMarks >= 140) {
      return {
        airRange: 'AIR 1,75,000 - 7,00,000+',
        aiqMbbsChance: 'NEET 2027 Qualifying Cutoff Cleared (Eligible for Counselling)',
        stateQuotaChance: 'Private Colleges Management Quota & Deemed Medical Colleges',
        collegeRecommendation: 'Deemed University MBBS, Management Quota BDS/BAMS, Foreign Medical (FMGE/NExT Eligible)',
      };
    } else {
      return {
        airRange: 'Cutoff Not Cleared (< 50th Percentile)',
        aiqMbbsChance: 'Not Qualified for Counselling',
        stateQuotaChance: 'Ineligible for Medical Counselling in India',
        collegeRecommendation: 'Focus on 2028 Re-attempt with structured daily mock practice',
      };
    }
  }, [neetMarks, neetCategory]);

  return (
    <div className="bg-white dark:bg-[#161822] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Tab Switcher: JEE Main vs NEET UG */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-md mx-auto mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('jee')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'jee'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-sm scale-[1.02]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ⚙️ JEE Main (300 Marks)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('neet')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'neet'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-sm scale-[1.02]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🩺 NEET UG (720 Marks)
        </button>
      </div>

      {/* ==============================================================
          TAB 1: JEE MAIN MARKS VS PERCENTILE & AIR PREDICTOR
      ============================================================== */}
      {activeTab === 'jee' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Input 1: Marks Slider & Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Enter Your Score (out of 300):</span>
                <span className="font-mono text-base font-extrabold text-indigo-600 dark:text-[#D4FF4F]">
                  {jeeMarks} / 300
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="1"
                value={jeeMarks}
                onChange={(e) => setJeeMarks(Number(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-[#D4FF4F] cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0</span>
                <span>100</span>
                <span>200</span>
                <span>300</span>
              </div>
            </div>

            {/* Input 2: Shift Difficulty Calibration */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Exam Shift Difficulty:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'easy', label: 'Easy Shift' },
                  { id: 'moderate', label: 'Moderate' },
                  { id: 'tough', label: 'Tough Shift' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setJeeShiftDifficulty(s.id as any)}
                    className={`py-2 px-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      jeeShiftDifficulty === s.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input 3: Reservation Category */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Reservation Category:
              </label>
              <select
                value={jeeCategory}
                onChange={(e) => setJeeCategory(e.target.value as any)}
                className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="GEN">General (CRL)</option>
                <option value="EWS">General-EWS (10% Quota)</option>
                <option value="OBC">OBC-NCL (27% Quota)</option>
                <option value="SC">Scheduled Caste (SC)</option>
                <option value="ST">Scheduled Tribe (ST)</option>
              </select>
            </div>
          </div>

          {/* Real-Time Prediction Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 dark:from-slate-900 dark:via-[#171923] dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-indigo-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Predicted Performance for {jeeMarks} Marks ({jeeShiftDifficulty} Shift)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display mt-0.5">
                  {jeeResult.percentileRange} <span className="text-sm font-semibold text-slate-500">Percentile</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Estimated All India Rank (AIR)
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {jeeResult.airRange}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 font-semibold block mb-1">JEE Advanced Eligibility:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {jeeResult.qualificationStatus}
                </span>
              </div>
              <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 font-semibold block mb-1">NIT / IIIT Tier Target:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {jeeResult.collegeTier}
                </span>
              </div>
              <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 font-semibold block mb-1">Likely Engineering Branches:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {jeeResult.branchProspects}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: NEET UG MARKS VS RANK PREDICTOR (720 MARKS)
      ============================================================== */}
      {activeTab === 'neet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Input 1: Marks Slider & Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Enter Your NEET Score (out of 720):</span>
                <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {neetMarks} / 720
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="720"
                step="5"
                value={neetMarks}
                onChange={(e) => setNeetMarks(Number(e.target.value))}
                className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0</span>
                <span>200</span>
                <span>400</span>
                <span>600</span>
                <span>720</span>
              </div>
            </div>

            {/* Input 2: Reservation Category */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Candidate Quota Category:
              </label>
              <select
                value={neetCategory}
                onChange={(e) => setNeetCategory(e.target.value as any)}
                className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="GEN">General / Unreserved (UR)</option>
                <option value="OBC">OBC-NCL (Central/State Quota)</option>
                <option value="EWS">Economically Weaker Section (EWS)</option>
                <option value="SC">Scheduled Caste (SC)</option>
                <option value="ST">Scheduled Tribe (ST)</option>
              </select>
            </div>
          </div>

          {/* Real-Time NEET Prediction Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-slate-900 dark:via-[#171923] dark:to-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-emerald-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Predicted All India Rank (AIR) Range
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display mt-0.5">
                  {neetResult.airRange}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  AIQ 15% MBBS Admission Chance
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {neetResult.aiqMbbsChance}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 font-semibold block mb-1">State 85% Quota Admission Chance:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {neetResult.stateQuotaChance}
                </span>
              </div>
              <div className="p-3.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 font-semibold block mb-1">Medical College Target Category:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {neetResult.collegeRecommendation}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Study Channels Callout */}
      <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span className="text-slate-600 dark:text-slate-400">
          💬 Discuss mock test scores &amp; cutoff shifts with 15,000+ aspirants:
        </span>
        <div className="flex items-center gap-2">
          <a
            href="https://whatsapp.com/channel/0029VbDeHd8FHWq0d939hU3J"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
          >
            WhatsApp Channel →
          </a>
          <a
            href="https://t.me/indiantimers"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full font-bold bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all shadow-xs"
          >
            Telegram Channel →
          </a>
        </div>
      </div>
    </div>
  );
}
