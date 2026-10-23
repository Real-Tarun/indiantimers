import React, { useState, useMemo } from 'react';

// Data models for predictive models
export interface PredictedCollege {
  name: string;
  type: string;
  programs: string[];
  quota: string;
  notes: string;
}

export interface PredictedCollegeTier {
  status: 'safe' | 'target' | 'ambitious';
  label: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  description: string;
  colleges: PredictedCollege[];
}

export interface JEEPredictResult {
  percentileRange: string;
  airRange: string;
  categoryRankRange: string;
  qualificationStatus: string;
  qualificationBadge: string;
  categoryAdvantageNote: string;
  collegeTiers: PredictedCollegeTier[];
}

export interface NEETPredictResult {
  airRange: string;
  categoryRankRange: string;
  aiqMbbsChance: string;
  stateQuotaChance: string;
  categoryAdvantageNote: string;
  collegeTiers: PredictedCollegeTier[];
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

  // =========================================================================
  // JEE MAIN PREDICTION LOGIC (Category-Calibrated & Shift Adjusted)
  // =========================================================================
  const jeeResult = useMemo<JEEPredictResult>(() => {
    let effectiveMarks = jeeMarks;
    if (jeeShiftDifficulty === 'tough') effectiveMarks += 18;
    if (jeeShiftDifficulty === 'easy') effectiveMarks -= 16;

    // 1. Calculate Baseline Percentile and CRL
    let percentileRange = 'Below 75.00';
    let airMin = 280000;
    let airMax = 450000;

    if (effectiveMarks >= 270) {
      percentileRange = '99.92 - 100.00';
      airMin = 100;
      airMax = 950;
    } else if (effectiveMarks >= 235) {
      percentileRange = '99.45 - 99.88';
      airMin = 1000;
      airMax = 6500;
    } else if (effectiveMarks >= 195) {
      percentileRange = '98.60 - 99.40';
      airMin = 7000;
      airMax = 16500;
    } else if (effectiveMarks >= 160) {
      percentileRange = '97.20 - 98.55';
      airMin = 17000;
      airMax = 34000;
    } else if (effectiveMarks >= 130) {
      percentileRange = '94.80 - 97.10';
      airMin = 35000;
      airMax = 62000;
    } else if (effectiveMarks >= 100) {
      percentileRange = '90.50 - 94.60';
      airMin = 65000;
      airMax = 118000;
    } else if (effectiveMarks >= 75) {
      percentileRange = '82.00 - 90.20';
      airMin = 120000;
      airMax = 220000;
    } else if (effectiveMarks >= 50) {
      percentileRange = '70.00 - 81.50';
      airMin = 225000;
      airMax = 360000;
    }

    const airRange = airMin < 1000 ? `AIR ${airMin} - ${airMax}` : `AIR ${airMin.toLocaleString('en-IN')} - ${airMax.toLocaleString('en-IN')}`;

    // 2. Category Rank (CR) Estimation
    let categoryRankRange = 'Common Rank List (CRL) Only';
    let categoryAdvantageNote = '';

    if (jeeCategory === 'EWS') {
      const crMin = Math.max(1, Math.round(airMin * 0.105));
      const crMax = Math.round(airMax * 0.115);
      categoryRankRange = `EWS Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'EWS Quota (10%): Requires ~15-20 lower marks than General for premier NIT branches.';
    } else if (jeeCategory === 'OBC') {
      const crMin = Math.max(1, Math.round(airMin * 0.26));
      const crMax = Math.round(airMax * 0.285);
      categoryRankRange = `OBC Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'OBC-NCL Quota (27%): Cutoff threshold ~25-35 marks below General in JoSAA Rounds.';
    } else if (jeeCategory === 'SC') {
      const crMin = Math.max(1, Math.round(airMin * 0.058));
      const crMax = Math.round(airMax * 0.068);
      categoryRankRange = `SC Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'SC Quota (15%): Massive cutoff advantage. 120+ marks unlocks Top NITs CSE & premier core branches.';
    } else if (jeeCategory === 'ST') {
      const crMin = Math.max(1, Math.round(airMin * 0.024));
      const crMax = Math.round(airMax * 0.030);
      categoryRankRange = `ST Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'ST Quota (7.5%): 95+ marks qualifies for top tier NITs and premier IIIT branches.';
    } else {
      categoryAdvantageNote = 'General (Open): Seats allotted strictly based on Common Rank List (CRL) without category relaxation.';
    }

    // 3. Qualification for JEE Advanced
    let isQualified = false;
    let qualificationBadge = 'Not Eligible';
    let qualificationStatus = 'Cutoff not cleared for JEE Advanced';

    if (jeeCategory === 'GEN' && effectiveMarks >= 95) {
      isQualified = true;
      qualificationBadge = 'Eligible (General Cutoff Met)';
      qualificationStatus = 'Eligible for JEE Advanced 2027 (~91.5+ percentile expected cutoff)';
    } else if ((jeeCategory === 'OBC' || jeeCategory === 'EWS') && effectiveMarks >= 72) {
      isQualified = true;
      qualificationBadge = `Eligible (${jeeCategory} Cutoff Met)`;
      qualificationStatus = `Eligible for JEE Advanced 2027 (~75+ percentile ${jeeCategory} cutoff cleared)`;
    } else if (jeeCategory === 'SC' && effectiveMarks >= 48) {
      isQualified = true;
      qualificationBadge = 'Eligible (SC Cutoff Met)';
      qualificationStatus = 'Eligible for JEE Advanced 2027 (~53+ percentile SC cutoff cleared)';
    } else if (jeeCategory === 'ST' && effectiveMarks >= 38) {
      isQualified = true;
      qualificationBadge = 'Eligible (ST Cutoff Met)';
      qualificationStatus = 'Eligible for JEE Advanced 2027 (~40+ percentile ST cutoff cleared)';
    }

    // 4. College Groups Tailored to Marks + Category
    const collegeTiers: PredictedCollegeTier[] = [];

    if (jeeCategory === 'SC' || jeeCategory === 'ST') {
      if (effectiveMarks >= 135) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe / Confirmed (Top Tier)',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `With your score and ${jeeCategory} Category Rank, top national institutions are fully secured:`,
          colleges: [
            { name: 'NIT Trichy / Surathkal / Warangal', type: 'Top 3 NITs', programs: ['Computer Science (CSE)', 'Data Science & AI', 'ECE'], quota: `${jeeCategory} Category Quota`, notes: 'Confirmed in Round 1 JoSAA' },
            { name: 'IIIT Allahabad & MNNIT Jaipur', type: 'Premier IIIT & NIT', programs: ['Information Technology (IT)', 'CSE', 'AI'], quota: `${jeeCategory} Category Quota`, notes: '100% Seat Security' },
            { name: 'DTU & NSUT Delhi', type: 'Premier State Tech', programs: ['Computer Engineering', 'Software Engineering'], quota: 'Outside Delhi / Delhi Quota', notes: 'Top Placement Packages' },
          ],
        });
        collegeTiers.push({
          status: 'ambitious',
          label: 'JEE Advanced High-Prob Target',
          badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
          borderClass: 'border-indigo-200 dark:border-indigo-800/60',
          bgClass: 'bg-indigo-50/40 dark:bg-indigo-950/20',
          description: 'Focus fully on JEE Advanced revision. You are primed for premier IIT branches:',
          colleges: [
            { name: 'IIT Bombay, Delhi, Madras, Kanpur', type: 'Top IITs', programs: ['Computer Science', 'Electrical', 'Mechanical'], quota: `${jeeCategory} Category Quota`, notes: 'Clear Advanced cutoffs for dream IIT seats' },
          ],
        });
      } else if (effectiveMarks >= 90) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Confirmed admission in Reputed National Institutes under ${jeeCategory} quota:`,
          colleges: [
            { name: 'NIT Rourkela, Calicut, Jaipur, Bhopal', type: 'Tier-1 NITs', programs: ['CSE', 'Electronics & Comm (ECE)', 'Electrical'], quota: `${jeeCategory} Category Quota`, notes: 'Confirmed in Rounds 1-3' },
            { name: 'IIIT Jabalpur & IIIT Kancheepuram', type: 'Central IIIT', programs: ['CSE', 'Smart Manufacturing', 'ECE'], quota: `${jeeCategory} Category Quota`, notes: 'High placement record' },
          ],
        });
        collegeTiers.push({
          status: 'target',
          label: 'Competitive Reach Choices',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
          borderClass: 'border-amber-200 dark:border-amber-800/60',
          bgClass: 'bg-amber-50/40 dark:bg-amber-950/20',
          description: 'High chances in JoSAA Rounds 2-4 and CSAB Special Rounds:',
          colleges: [
            { name: 'NIT Trichy & NIT Surathkal', type: 'Top 2 NITs', programs: ['Mechanical', 'Chemical Engineering', 'Civil'], quota: `${jeeCategory} Category Quota`, notes: 'Target Round 2-4' },
          ],
        });
      } else if (effectiveMarks >= 55) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Mid-Tier NITs and State Government Engineering Colleges secured under ${jeeCategory} quota:`,
          colleges: [
            { name: 'NIT Silchar, Jalandhar, Durgapur, Hamirpur', type: 'Mid-Tier NITs', programs: ['Electrical', 'Mechanical', 'Civil'], quota: `${jeeCategory} Category Quota`, notes: 'JoSAA Rounds 1-4' },
            { name: 'Leading State Govt Colleges (VJTI, COEP, SGSITS)', type: 'State Govt Top', programs: ['CSE / IT / ECE'], quota: 'State Quota Category', notes: 'High value ROI' },
          ],
        });
      } else {
        collegeTiers.push({
          status: 'safe',
          label: 'Probable Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `North-Eastern NITs & Home State GFTIs under ${jeeCategory} Quota:`,
          colleges: [
            { name: 'NIT Agartala, Meghalaya, Sikkim, Nagaland', type: 'North-East NITs', programs: ['Civil', 'Mechanical', 'Electrical'], quota: 'CSAB Special Rounds', notes: 'Confirmed in CSAB' },
            { name: 'Top Private Autonomous / State Tech Universities', type: 'State Technical', programs: ['CSE / AI / Core'], quota: 'State Entrance Merit', notes: 'Merit-based admission' },
          ],
        });
      }
    } else if (jeeCategory === 'OBC' || jeeCategory === 'EWS') {
      if (effectiveMarks >= 200) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe / Confirmed (Top Tier)',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Premier NITs & Central IIITs secured under ${jeeCategory} Quota:`,
          colleges: [
            { name: 'NIT Surathkal, Warangal, Calicut, Rourkela', type: 'Top NITs', programs: ['Computer Science (CSE)', 'Data Science & AI', 'ECE'], quota: `${jeeCategory} Quota`, notes: 'Round 1-2 JoSAA' },
            { name: 'IIIT Allahabad & MNNIT Allahabad', type: 'Premier Tech', programs: ['IT', 'ECE', 'CSE'], quota: `${jeeCategory} Quota`, notes: 'Excellent Placement Median' },
          ],
        });
        collegeTiers.push({
          status: 'target',
          label: 'Dream Target Choices',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
          borderClass: 'border-amber-200 dark:border-amber-800/60',
          bgClass: 'bg-amber-50/40 dark:bg-amber-950/20',
          description: `Push +15 marks in Session 2 to secure top national rank:`,
          colleges: [
            { name: 'NIT Trichy CSE', type: 'Top 1 NIT', programs: ['Computer Science (CSE)'], quota: `${jeeCategory} Quota`, notes: 'Closing Rank ~800' },
          ],
        });
      } else if (effectiveMarks >= 150) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Reputed NITs and IIITs across core and circuit branches:`,
          colleges: [
            { name: 'NIT Silchar, Durgapur, Bhopal, Jalandhar', type: 'Reputed NITs', programs: ['ECE', 'Electrical Engineering', 'Mechanical'], quota: `${jeeCategory} Quota`, notes: 'Confirmed in Round 1-3' },
            { name: 'IIIT Jabalpur, Kancheepuram, Vadodara', type: 'Central IIIT', programs: ['CSE', 'ECE'], quota: `${jeeCategory} Quota`, notes: 'High Tech Placements' },
          ],
        });
      } else if (effectiveMarks >= 110) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Mid-Tier NITs Core Branches & Top State Government Colleges:`,
          colleges: [
            { name: 'NIT Patna, Raipur, Jamshedpur, Goa', type: 'Mid NITs', programs: ['Mechanical', 'Chemical', 'Civil Engineering'], quota: `${jeeCategory} Quota`, notes: 'JoSAA Rounds 3-6' },
            { name: 'Premier GFTIs (BIT Mesra, Assam University)', type: 'Central GFTI', programs: ['Core & Allied Engineering'], quota: `${jeeCategory} Quota`, notes: 'Good Campus Recruitment' },
          ],
        });
      } else {
        collegeTiers.push({
          status: 'safe',
          label: 'Probable Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `State CET counseling & North-Eastern NIT CSAB Special Rounds:`,
          colleges: [
            { name: 'North-Eastern NITs & GFTIs', type: 'Special Rounds', programs: ['Civil', 'Metallurgy', 'Production'], quota: 'CSAB Rounds', notes: 'Seat spot vacancy rounds' },
            { name: 'Leading State Universities (MHT-CET / COMEDK / WBJEE)', type: 'State Level', programs: ['CSE / IT / ECE'], quota: 'State Quota', notes: 'State examination channels' },
          ],
        });
      }
    } else {
      // GENERAL / OPEN CATEGORY
      if (effectiveMarks >= 240) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe / Confirmed (Top Tier)',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: 'Top 3 National Institutes of Technology (Open CRL):',
          colleges: [
            { name: 'NIT Trichy, Surathkal, Warangal', type: 'Top 3 NITs', programs: ['Computer Science (CSE)', 'Data Science', 'ECE'], quota: 'General CRL (Open)', notes: 'Guaranteed JoSAA Round 1' },
            { name: 'IIIT Hyderabad / IIIT Allahabad', type: 'Premier IIIT', programs: ['CSE', 'IT'], quota: 'General CRL', notes: 'Top coding culture' },
          ],
        });
      } else if (effectiveMarks >= 180) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: 'Tier-1 NITs & Top IIITs (General CRL):',
          colleges: [
            { name: 'NIT Rourkela, Calicut, Jaipur, Allahabad', type: 'Tier-1 NITs', programs: ['ECE', 'Electrical Engineering', 'Mechanical'], quota: 'General CRL', notes: 'Confirmed Rounds 1-3' },
            { name: 'IIIT Jabalpur, Kancheepuram, Gwalior', type: 'Central IIIT', programs: ['CSE', 'Information Technology'], quota: 'General CRL', notes: 'High tech salary packages' },
          ],
        });
        collegeTiers.push({
          status: 'target',
          label: 'Target Choices (+15 Marks needed for CSE)',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
          borderClass: 'border-amber-200 dark:border-amber-800/60',
          bgClass: 'bg-amber-50/40 dark:bg-amber-950/20',
          description: 'Target top NIT Computer Science with slightly higher percentile:',
          colleges: [
            { name: 'NIT Surathkal & Warangal CSE', type: 'Top 3 NITs', programs: ['CSE'], quota: 'General CRL', notes: 'Closing CRL ~2,500' },
          ],
        });
      } else if (effectiveMarks >= 135) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: 'Mid-Tier NITs Core & Established State Government Tech Colleges:',
          colleges: [
            { name: 'NIT Durgapur, Silchar, Bhopal, Jamshedpur', type: 'Mid NITs', programs: ['Mechanical', 'Civil', 'Chemical', 'Metallurgy'], quota: 'General CRL', notes: 'JoSAA Rounds 2-6' },
            { name: 'DTU, NSUT (Delhi Quota) & Leading State Tech Colleges', type: 'State Premier', programs: ['Core & Tech Allied'], quota: 'Home State / Open', notes: 'Strong corporate tie-ups' },
          ],
        });
      } else {
        collegeTiers.push({
          status: 'safe',
          label: 'Probable Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: 'GFTIs, State Technical Counseling & Premier Private Universities:',
          colleges: [
            { name: 'BIT Mesra, Assam University, SMVDU Katra', type: 'Central GFTI', programs: ['Mechanical', 'Civil', 'Production'], quota: 'CSAB Special Rounds', notes: 'Spot round vacancies' },
            { name: 'Top Private Universities (LNMIIT, Thapar, Jaypee)', type: 'Private Merit', programs: ['CSE / AI / ECE'], quota: 'Direct JEE Merit', notes: 'Excellent CSE placements' },
          ],
        });
      }
    }

    return {
      percentileRange,
      airRange,
      categoryRankRange,
      qualificationStatus,
      qualificationBadge,
      categoryAdvantageNote,
      collegeTiers,
    };
  }, [jeeMarks, jeeShiftDifficulty, jeeCategory]);

  // =========================================================================
  // NEET UG PREDICTION LOGIC (Category-Calibrated for 720 Marks)
  // =========================================================================
  const neetResult = useMemo<NEETPredictResult>(() => {
    // 1. Calculate Baseline All India Rank (AIR) based on 2026/2027 Normalized Trends
    let airMin = 180000;
    let airMax = 550000;

    if (neetMarks >= 700) {
      airMin = 1;
      airMax = 250;
    } else if (neetMarks >= 670) {
      airMin = 251;
      airMax = 2800;
    } else if (neetMarks >= 640) {
      airMin = 2801;
      airMax = 12500;
    } else if (neetMarks >= 615) {
      airMin = 12501;
      airMax = 24000;
    } else if (neetMarks >= 570) {
      airMin = 24001;
      airMax = 55000;
    } else if (neetMarks >= 520) {
      airMin = 55001;
      airMax = 105000;
    } else if (neetMarks >= 450) {
      airMin = 105001;
      airMax = 180000;
    } else if (neetMarks >= 300) {
      airMin = 180001;
      airMax = 420000;
    } else if (neetMarks >= 135) {
      airMin = 420001;
      airMax = 950000;
    } else {
      airMin = 950001;
      airMax = 1500000;
    }

    const airRange = airMin < 1000 ? `AIR ${airMin} - ${airMax}` : `AIR ${airMin.toLocaleString('en-IN')} - ${airMax.toLocaleString('en-IN')}`;

    // 2. Category Rank (CR) Estimation
    let categoryRankRange = 'Common All India Merit';
    let categoryAdvantageNote = '';

    if (neetCategory === 'EWS') {
      const crMin = Math.max(1, Math.round(airMin * 0.095));
      const crMax = Math.round(airMax * 0.108);
      categoryRankRange = `EWS AIQ Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'EWS Quota (10%): AIQ 15% Cutoff is ~615+ marks (saves ~8-12 marks vs General).';
    } else if (neetCategory === 'OBC') {
      const crMin = Math.max(1, Math.round(airMin * 0.27));
      const crMax = Math.round(airMax * 0.29);
      categoryRankRange = `OBC AIQ Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'OBC-NCL Quota (27%): Cutoff closely mirrors General but offers higher state quota seat availability.';
    } else if (neetCategory === 'SC') {
      const crMin = Math.max(1, Math.round(airMin * 0.055));
      const crMax = Math.round(airMax * 0.065);
      categoryRankRange = `SC AIQ Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'SC Quota (15%): AIQ 15% Govt MBBS cutoff is ~525+ marks. Top GMCs secured at 580+ marks.';
    } else if (neetCategory === 'ST') {
      const crMin = Math.max(1, Math.round(airMin * 0.022));
      const crMax = Math.round(airMax * 0.028);
      categoryRankRange = `ST AIQ Rank ${crMin.toLocaleString('en-IN')} - ${crMax.toLocaleString('en-IN')}`;
      categoryAdvantageNote = 'ST Quota (7.5%): AIQ 15% Govt MBBS cutoff is ~490+ marks. Top AIIMS secured at 550+ marks.';
    } else {
      categoryAdvantageNote = 'General / Unreserved: AIQ 15% Govt MBBS cutoff is ~625+ marks. High competition in state mop-up rounds.';
    }

    // 3. Admission Probability based on Category
    let aiqMbbsChance = 'Low for Govt MBBS';
    let stateQuotaChance = 'Eligible for Private / Allied';

    if (neetCategory === 'SC') {
      if (neetMarks >= 580) {
        aiqMbbsChance = '100% Guaranteed (Top Central AIIMS & State GMCs)';
        stateQuotaChance = '100% Guaranteed (Rank 1 GMC of Any State)';
      } else if (neetMarks >= 520) {
        aiqMbbsChance = '100% Confirmed All India Quota Govt MBBS';
        stateQuotaChance = '100% Confirmed Home State Govt MBBS';
      } else if (neetMarks >= 470) {
        aiqMbbsChance = 'High in Rounds 2-3 for Govt MBBS / High for Govt BDS';
        stateQuotaChance = 'Confirmed State Govt MBBS / Premier BDS';
      } else if (neetMarks >= 380) {
        aiqMbbsChance = 'Low for AIQ MBBS; High for Govt Dental (BDS) & BAMS';
        stateQuotaChance = 'State Semi-Govt Subsidized MBBS / Govt BDS';
      }
    } else if (neetCategory === 'ST') {
      if (neetMarks >= 550) {
        aiqMbbsChance = '100% Guaranteed (All Central AIIMS & Premier GMCs)';
        stateQuotaChance = '100% Guaranteed (Top State Medical Colleges)';
      } else if (neetMarks >= 485) {
        aiqMbbsChance = '100% Confirmed All India Quota Govt MBBS';
        stateQuotaChance = '100% Confirmed Home State Govt MBBS';
      } else if (neetMarks >= 430) {
        aiqMbbsChance = 'High for New GMCs / Mop-up Rounds / Govt BDS';
        stateQuotaChance = 'Confirmed State Govt MBBS / BDS';
      } else if (neetMarks >= 350) {
        aiqMbbsChance = 'Eligible for Govt Dental (BDS) & Govt Ayurvedic (BAMS)';
        stateQuotaChance = 'State Quota Dental / Semi-Govt MBBS';
      }
    } else if (neetCategory === 'OBC' || neetCategory === 'EWS') {
      if (neetMarks >= 665) {
        aiqMbbsChance = '100% Guaranteed (Top AIIMS & Premier Central GMCs)';
        stateQuotaChance = '100% Guaranteed (Top State GMCs: KGMU, Grant, SMS)';
      } else if (neetMarks >= 620) {
        aiqMbbsChance = '100% Confirmed All India Quota Govt MBBS Seat';
        stateQuotaChance = '100% Confirmed Home State Govt MBBS';
      } else if (neetMarks >= 605) {
        aiqMbbsChance = 'Borderline AIQ Round 3 / High for State 85% GMC';
        stateQuotaChance = 'High for State Govt MBBS (Rounds 1-2)';
      } else if (neetMarks >= 540) {
        aiqMbbsChance = 'Low for AIQ MBBS; High for Govt BDS / Top BAMS';
        stateQuotaChance = 'Confirmed Govt BDS / State Semi-Govt MBBS';
      }
    } else {
      // GENERAL
      if (neetMarks >= 675) {
        aiqMbbsChance = '100% Guaranteed (Top AIIMS & Premier Central GMCs)';
        stateQuotaChance = '100% Guaranteed (Rank 1 State GMCs)';
      } else if (neetMarks >= 628) {
        aiqMbbsChance = '100% Confirmed All India Quota Govt MBBS Seat';
        stateQuotaChance = '100% Confirmed Home State Govt MBBS';
      } else if (neetMarks >= 612) {
        aiqMbbsChance = 'Borderline AIQ Round 2/3 (Stray Vacancy)';
        stateQuotaChance = 'High for State 85% Government Medical College';
      } else if (neetMarks >= 550) {
        aiqMbbsChance = 'Low for AIQ MBBS; High for Premier Govt BDS';
        stateQuotaChance = 'Confirmed Govt Dental (BDS) / Top Ayurvedic (BAMS)';
      }
    }

    // 4. College Groups Tailored to Marks + Category
    const collegeTiers: PredictedCollegeTier[] = [];

    if (neetCategory === 'SC' || neetCategory === 'ST') {
      if (neetMarks >= 580) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe / Confirmed (Top Central & AIIMS)',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Under ${neetCategory} category quota, top tier medical colleges in India are completely safe:`,
          colleges: [
            { name: 'AIIMS Bhopal, Rishikesh, Jodhpur, Bhubaneswar', type: 'Central AIIMS', programs: ['MBBS (5.5 Years)'], quota: `${neetCategory} AIQ Quota`, notes: 'Confirmed in Round 1' },
            { name: 'KGMU Lucknow, Seth GS Mumbai, SMS Jaipur', type: 'Premier State GMC', programs: ['MBBS'], quota: `${neetCategory} Quota`, notes: 'Top State Medical Colleges' },
            { name: 'MAMC & VMMC New Delhi', type: 'Central Govt', programs: ['MBBS'], quota: `${neetCategory} AIQ Quota`, notes: 'Premier Clinical Exposure' },
          ],
        });
      } else if (neetMarks >= 500) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Government MBBS Admission',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Confirmed Government MBBS seat under ${neetCategory} Quota across India:`,
          colleges: [
            { name: 'Established State Government Medical Colleges', type: 'Govt Medical Colleges', programs: ['MBBS'], quota: `${neetCategory} AIQ & State Quota`, notes: '100% Subsidized Govt Fee' },
            { name: 'Peripheral AIIMS (Deoghar, Gorakhpur, Kalyani)', type: 'Central AIIMS', programs: ['MBBS'], quota: `${neetCategory} AIQ Quota`, notes: 'Modern AIIMS Infrastructure' },
          ],
        });
      } else {
        collegeTiers.push({
          status: 'safe',
          label: 'Probable Government Seats',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: `Government Dental (BDS), AYUSH (BAMS) & State Semi-Govt MBBS:`,
          colleges: [
            { name: 'Maulana Azad Institute of Dental Sciences (MAIDS)', type: 'Premier Govt Dental', programs: ['BDS'], quota: `${neetCategory} Quota`, notes: 'Top Dental College in India' },
            { name: 'State Government Ayurvedic & Homeopathic Colleges', type: 'Govt AYUSH', programs: ['BAMS / BHMS'], quota: 'State Quota', notes: 'Government Certified Degree' },
          ],
        });
      }
    } else {
      // GEN, OBC, EWS
      if (neetMarks >= 665) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe / Confirmed (Top Central & AIIMS)',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: 'Top Central Institutions and Premier State Medical Colleges:',
          colleges: [
            { name: 'Central AIIMS (Bhopal, Jodhpur, Rishikesh, Bhubaneswar)', type: 'Central AIIMS', programs: ['MBBS (5.5 Years)'], quota: `${neetCategory} AIQ Quota`, notes: 'Confirmed in Round 1 MCC' },
            { name: 'KGMU Lucknow, Grant Medical College Mumbai', type: 'Premier State GMC', programs: ['MBBS'], quota: `${neetCategory} Quota`, notes: 'Top State Clinical Hospital' },
          ],
        });
        collegeTiers.push({
          status: 'ambitious',
          label: 'Dream Target (AIIMS New Delhi & MAMC)',
          badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
          borderClass: 'border-indigo-200 dark:border-indigo-800/60',
          bgClass: 'bg-indigo-50/40 dark:bg-indigo-950/20',
          description: 'Top 50 Rankers Bracket in NEET UG:',
          colleges: [
            { name: 'AIIMS New Delhi & MAMC New Delhi', type: 'Apex Medical Institutes', programs: ['MBBS'], quota: 'Open / Central Quota', notes: 'Requires 710+ Marks' },
          ],
        });
      } else if (neetMarks >= 620) {
        collegeTiers.push({
          status: 'safe',
          label: 'Safe Government MBBS Admission',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: 'Confirmed Government Medical College MBBS Seat:',
          colleges: [
            { name: 'Established State Government Medical Colleges', type: 'State GMCs', programs: ['MBBS'], quota: 'AIQ 15% & State 85%', notes: 'Confirmed in Round 1-2' },
            { name: 'New AIIMS (Bilaspur, Guwahati, Jammu, Rajkot)', type: 'Central AIIMS', programs: ['MBBS'], quota: 'AIQ 15% Quota', notes: 'Top Central Govt Standard' },
          ],
        });
      } else if (neetMarks >= 580) {
        collegeTiers.push({
          status: 'target',
          label: 'State Quota & Dental Choices',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
          borderClass: 'border-amber-200 dark:border-amber-800/60',
          bgClass: 'bg-amber-50/40 dark:bg-amber-950/20',
          description: 'High chances in State 85% Quota and Premier Government BDS:',
          colleges: [
            { name: 'Home State Government Medical Colleges (Round 2/3)', type: 'State GMC', programs: ['MBBS'], quota: 'State 85% Quota', notes: 'High probability in state rounds' },
            { name: 'Government Dental College (GDC) Mumbai, Kolkata, Rohtak', type: 'Govt Dental', programs: ['BDS'], quota: 'AIQ & State Quota', notes: 'Premier Dental Colleges' },
          ],
        });
      } else {
        collegeTiers.push({
          status: 'safe',
          label: 'Probable Admission Choices',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          borderClass: 'border-emerald-200 dark:border-emerald-800/60',
          bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
          description: 'Top Deemed Universities, Private Subsidized Seats, BAMS, BHMS:',
          colleges: [
            { name: 'KMC Manipal, Hamdard Delhi, Symbiosis Pune', type: 'Top Deemed Universities', programs: ['MBBS (Merit)'], quota: 'Management / Deemed Merit', notes: 'Premier Private Infrastructure' },
            { name: 'Premier Ayurvedic (BAMS) & Homeopathic (BHMS) Colleges', type: 'Govt & Semi-Govt AYUSH', programs: ['BAMS / BHMS / B.V.Sc'], quota: 'State & Central AYUSH', notes: 'Government Recognized degrees' },
          ],
        });
      }
    }

    return {
      airRange,
      categoryRankRange,
      aiqMbbsChance,
      stateQuotaChance,
      categoryAdvantageNote,
      collegeTiers,
    };
  }, [neetMarks, neetCategory]);

  return (
    <div className="bg-white dark:bg-[#111318] border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-5 sm:p-8 shadow-sm">
      {/* Top Header & Exam Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-[#D4FF4F] text-[#111406] shadow-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-[#111406] animate-pulse"></span>
            2027 Calibration · Category-Calibrated
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
            Interactive Rank &amp; College Predictor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Shift-adjusted percentile, All India Rank (AIR), and category-specific college admission forecasts.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('jee')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'jee'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⚡ JEE Main 2027</span>
            <span className="text-[10px] opacity-75 font-mono">(300m)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('neet')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'neet'
                ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🩺 NEET UG 2027</span>
            <span className="text-[10px] opacity-75 font-mono">(720m)</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: JEE MAIN CALCULATOR & PREDICTOR
      ===================================================================== */}
      {activeTab === 'jee' && (
        <div className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Input 1: Marks Slider */}
            <div className="space-y-2 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Enter Your Score (out of 300):</span>
                <span className="font-mono text-base font-black text-indigo-600 dark:text-[#D4FF4F]">
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
            <div className="space-y-2 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Shift Difficulty:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'easy', label: 'Easy' },
                  { id: 'moderate', label: 'Moderate' },
                  { id: 'tough', label: 'Tough' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setJeeShiftDifficulty(s.id as any)}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
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
            <div className="space-y-2 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Reservation Category:
              </label>
              <select
                value={jeeCategory}
                onChange={(e) => setJeeCategory(e.target.value as any)}
                className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="GEN">General / Open (CRL)</option>
                <option value="EWS">General-EWS (10% Quota)</option>
                <option value="OBC">OBC-NCL (27% Central Quota)</option>
                <option value="SC">Scheduled Caste (SC Quota)</option>
                <option value="ST">Scheduled Tribe (ST Quota)</option>
              </select>
            </div>
          </div>

          {/* Real-Time Rank & Category Forecast Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 dark:from-slate-900 dark:via-[#171923] dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 mb-4 border-b border-indigo-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Predicted Percentile ({jeeShiftDifficulty} Shift)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display mt-0.5">
                  {jeeResult.percentileRange} <span className="text-xs font-semibold text-slate-500">%ile</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Estimated Common Rank List (AIR)
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {jeeResult.airRange}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-[#D4FF4F] uppercase tracking-wider">
                  🎯 Estimated {jeeCategory} Category Rank
                </span>
                <div className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-[#D4FF4F] font-mono mt-0.5">
                  {jeeResult.categoryRankRange}
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {jeeResult.qualificationStatus}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {jeeResult.categoryAdvantageNote}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 shrink-0">
                {jeeResult.qualificationBadge}
              </span>
            </div>

            {/* Expanded Category-Wise College Predictor */}
            <div className="mt-5 pt-4 border-t border-indigo-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-1.5">
                  <span>🏛️ Predicted College &amp; Branch Matrix for {jeeCategory} Quota</span>
                </h3>
                <a
                  href="/tools/college-predictor/"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Full Cutoff Matrix →
                </a>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {jeeResult.collegeTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${tier.borderClass} ${tier.bgClass} transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${tier.badgeClass}`}>
                          {tier.label}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {tier.description}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {tier.colleges.map((col, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {col.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 shrink-0">
                              {col.type}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {col.programs.map((prog, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md"
                              >
                                {prog}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>{col.quota}</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{col.notes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: NEET UG CALCULATOR & PREDICTOR
      ===================================================================== */}
      {activeTab === 'neet' && (
        <div className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Input 1: Marks Slider */}
            <div className="space-y-2 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Enter Your NEET Score (out of 720):</span>
                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
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
            <div className="space-y-2 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Candidate Quota Category:
              </label>
              <select
                value={neetCategory}
                onChange={(e) => setNeetCategory(e.target.value as any)}
                className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="GEN">General / Unreserved (UR)</option>
                <option value="OBC">OBC-NCL (27% AIQ/State Quota)</option>
                <option value="EWS">Economically Weaker Section (10% Quota)</option>
                <option value="SC">Scheduled Caste (15% Quota)</option>
                <option value="ST">Scheduled Tribe (7.5% Quota)</option>
              </select>
            </div>
          </div>

          {/* Real-Time Rank & Category Forecast Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-slate-900 dark:via-[#171923] dark:to-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 mb-4 border-b border-emerald-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Predicted All India Rank (AIR)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display mt-0.5">
                  {neetResult.airRange}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  🎯 Estimated {neetCategory} Category Rank
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {neetResult.categoryRankRange}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  AIQ 15% MBBS Chance
                </span>
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                  {neetResult.aiqMbbsChance}
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  State 85% Quota Forecast: {neetResult.stateQuotaChance}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {neetResult.categoryAdvantageNote}
                </span>
              </div>
            </div>

            {/* Expanded Category-Wise Medical College Predictor */}
            <div className="mt-5 pt-4 border-t border-emerald-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-1.5">
                  <span>🩺 Predicted Medical College Matrix for {neetCategory} Quota</span>
                </h3>
                <a
                  href="/tools/college-predictor/"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Full Cutoff Matrix →
                </a>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {neetResult.collegeTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${tier.borderClass} ${tier.bgClass} transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${tier.badgeClass}`}>
                          {tier.label}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {tier.description}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {tier.colleges.map((col, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {col.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 shrink-0">
                              {col.type}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {col.programs.map((prog, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-md"
                              >
                                {prog}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>{col.quota}</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{col.notes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Link to Dedicated College Predictor & WhatsApp/Telegram Channels */}
      <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <a
          href="/tools/college-predictor/"
          className="text-xs font-bold text-indigo-600 dark:text-[#D4FF4F] hover:underline flex items-center gap-1.5"
        >
          <span>🎯 Need Detailed JoSAA &amp; MCC Cutoff Ranks? Open Dedicated College Predictor 2027 →</span>
        </a>
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
