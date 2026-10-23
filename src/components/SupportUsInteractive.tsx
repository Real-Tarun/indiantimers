import React, { useState, useEffect, useMemo } from 'react';
import type { SupporterRecord, LeaderboardResponse, DonationSubmissionInput } from '../types/support.ts';
import { INITIAL_APPROVED_SUPPORTERS } from '../lib/support/store.ts';
import confetti from 'canvas-confetti';
import {
  Heart,
  Crown,
  Medal,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ArrowRight,
  Search,
  Filter,
  DollarSign,
  Coffee,
  Server,
  Zap,
  Users,
  AlertCircle,
  QrCode,
  Share2,
} from 'lucide-react';

const PRESET_AMOUNTS = [
  { label: '₹21', value: 21, note: 'Shagun & Blessing' },
  { label: '₹51', value: 51, note: 'Chai & Snacks' },
  { label: '₹101', value: 101, note: 'Server Hour' },
  { label: '₹251', value: 251, note: 'Aspirant Hero' },
  { label: '₹501', value: 501, note: 'Daily Scraper Fund' },
  { label: '₹1,000', value: 1000, note: 'Patron Supporter' },
  { label: '₹2,500', value: 2500, note: 'Grand Benefactor' },
  { label: '₹5,000', value: 5000, note: 'Legendary Sponsor' },
];

const UPI_ID = 'tarun.in@fam';
const UPI_NAME = 'Tarun Kumar';

export default function SupportUsInteractive() {
  // Amount selection state
  const [selectedAmount, setSelectedAmount] = useState<number>(251);
  const [customAmount, setCustomAmount] = useState<string>('251');
  const [amountError, setAmountError] = useState<string>('');

  // UPI Copy Toast state
  const [hasCopiedUpi, setHasCopiedUpi] = useState<boolean>(false);

  // Form submission state
  const [supporterName, setSupporterName] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);

  // Leaderboard data state
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse>(() => ({
    top5: INITIAL_APPROVED_SUPPORTERS.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 })),
    allSupporters: INITIAL_APPROVED_SUPPORTERS.map((r, i) => ({ ...r, rank: i + 1 })),
    stats: {
      totalRaised: INITIAL_APPROVED_SUPPORTERS.reduce((acc, c) => acc + c.amount, 0),
      totalSupporters: INITIAL_APPROVED_SUPPORTERS.length,
      lastUpdated: new Date().toISOString(),
      updateInterval: '12 Hours (Verified Review Cycle)',
      monthlyGoal: 15000,
    },
  }));
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'amount' | 'recent'>('amount');

  // Fetch live leaderboard on mount
  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoadingLeaderboard(true);
        const res = await fetch('/api/support/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (data && data.top5) {
            setLeaderboard(data);
          }
        }
      } catch (err) {
        console.warn('Leaderboard API fetch fallback:', err);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    }
    loadLeaderboard();
  }, []);

  // Handle amount change
  const handleAmountSelect = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount(String(val));
    setAmountError('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomAmount(raw);
    const parsed = Number(raw);
    if (isNaN(parsed) || raw.trim() === '') {
      setAmountError('Please enter a valid amount.');
      return;
    }
    if (parsed < 10) {
      setAmountError('Minimum contribution amount is ₹10.');
    } else if (parsed > 50000) {
      setAmountError('Maximum contribution amount is ₹50,000.');
    } else {
      setAmountError('');
      setSelectedAmount(parsed);
    }
  };

  // Dynamic UPI Deep-link URL & QR Code URL
  const upiDeepLink = useMemo(() => {
    const validAmt = Math.max(10, Math.min(50000, selectedAmount || 10));
    return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
      UPI_NAME
    )}&am=${validAmt}&cu=INR&tn=${encodeURIComponent('Support IndianTimers Student Project')}`;
  }, [selectedAmount]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
      upiDeepLink
    )}`;
  }, [upiDeepLink]);

  // Copy UPI ID handler
  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID);
      setHasCopiedUpi(true);
      setTimeout(() => setHasCopiedUpi(false), 2500);
    }
  };

  // Submit UTR form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Client-side validations
    const cleanName = supporterName.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your name or nickname (at least 2 characters).');
      return;
    }

    const amt = Number(customAmount);
    if (isNaN(amt) || amt < 10 || amt > 50000) {
      setFormError('Please ensure amount is between ₹10 and ₹50,000.');
      return;
    }

    const cleanUtr = utrNumber.trim().replace(/\s+/g, '');
    if (!cleanUtr || cleanUtr.length < 6) {
      setFormError('Please enter a valid 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: DonationSubmissionInput = {
        name: cleanName,
        amount: amt,
        utr: cleanUtr,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
        isAnonymous,
      };

      const res = await fetch('/api/support/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to submit verification request. Please check UTR.');
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmissionSuccess(data.record || { ...payload, createdAt: new Date().toISOString() });
      setIsSubmitting(false);

      // Trigger Confetti Celebration
      if (typeof window !== 'undefined') {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err) {
      setFormError('Network error while submitting. Please check your connection or try again.');
      setIsSubmitting(false);
    }
  };

  // Filtered & Sorted supporters list
  const filteredSupporters = useMemo(() => {
    let list = [...leaderboard.allSupporters];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.message && s.message.toLowerCase().includes(q)) ||
          s.utr.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return list;
  }, [leaderboard.allSupporters, searchFilter, sortBy]);

  // Goal calculation
  const progressPercent = Math.min(
    100,
    Math.round((leaderboard.stats.totalRaised / (leaderboard.stats.monthlyGoal || 15000)) * 100)
  );

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO & PERSONAL NOTE FROM TARUN (STUDENT CREATOR)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-[#121520] to-[#0A0C12] text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
        {/* Decorative Background Accents */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#D4FF4F]/20 to-indigo-600/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-gradient-to-tr from-pink-500/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Creator Note & Mission */}
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[12px] font-bold text-[#D4FF4F]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF4F]" />
              <span>Independent Student Initiative · 100% Free & Ad-Free</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">
              Support the Mission Behind <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4FF4F] via-emerald-300 to-cyan-400">
                IndianTimers
              </span>
            </h1>

            {/* Letter / Note */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/60 text-slate-300 space-y-3.5 text-sm sm:text-base leading-relaxed">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D4FF4F] to-emerald-400 text-slate-950 font-black flex items-center justify-center font-display text-lg shadow-md">
                  T
                </div>
                <div>
                  <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>A Personal Note from Tarun</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Solo Creator & Student
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Founder & Developer, IndianTimers</div>
                </div>
              </div>

              <p className="italic text-slate-200">
                "Hi everyone! I am a student and an individual developer. I started IndianTimers because like millions of
                aspirants across India preparing for NEET, JEE, UPSC, and Board exams, I was tired of clickbait headlines,
                fake datesheet rumors, and laggy websites packed with intrusive ads."
              </p>

              <p>
                "I am building and running this platform <strong>single-handedly</strong> — from writing the code and
                designing the user interface, to monitoring official government circulars and managing the cloud servers.
                Our commitment is to keep IndianTimers <strong>100% free, fast, and completely free of spam popups</strong> for
                every student."
              </p>

              <p>
                "Your voluntary contribution, big or small, directly covers our Cloudflare edge servers, official circular
                scrapers, and domain upkeep. Thank you for believing in an independent student creator!"
              </p>
            </div>

            {/* What money funds pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <Server className="w-4 h-4 text-[#D4FF4F]" />
                <span className="font-medium text-slate-300">Fast Edge Servers</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-slate-300">24/7 Notice Scrapers</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 col-span-2 sm:col-span-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-slate-300">Zero Ads Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Funding Progress & Transparency */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                  Monthly Infrastructure Fund
                </span>
                <span className="text-xs font-mono font-bold text-[#D4FF4F]">
                  {progressPercent}% Funded
                </span>
              </div>

              <div>
                <div className="text-3xl font-black font-mono text-white">
                  ₹{leaderboard.stats.totalRaised.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  raised towards ₹{leaderboard.stats.monthlyGoal.toLocaleString('en-IN')} monthly target
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-[#D4FF4F] to-cyan-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  <div className="text-xl font-bold font-mono text-white">{leaderboard.stats.totalSupporters}</div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Donors</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  <div className="text-xl font-bold font-mono text-[#D4FF4F]">₹10</div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Min Contribution</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-2 leading-relaxed">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Editorial Note:</strong> Every donation is manually reconciled against our UPI settlements.
                  Leaderboard updates every 12 hours.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: UPI PAYMENT & UTR SUBMISSION BENTO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Amount Selection & QR Code (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-[24px] bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Step 1: Choose Your Amount & Pay via UPI
              </div>
              <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                Select Contribution Amount
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Every rupee directly aids server costs and keeps this site 100% ad-free.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_AMOUNTS.map((p) => {
                const isSelected = selectedAmount === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleAmountSelect(p.value)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#18181B] text-white dark:bg-white dark:text-[#111406] border-slate-900 dark:border-white shadow-md scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-mono font-black text-lg">{p.label}</div>
                    <div className="text-[10px] font-semibold opacity-80 truncate">{p.note}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Or Enter Custom Amount (₹10 to ₹50,000)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-bold text-slate-400 text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Enter amount in ₹ (e.g. 150)"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#D4FF4F] transition-all"
                />
              </div>
              {amountError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{amountError}</span>
                </div>
              )}
            </div>

            {/* QR Code and Direct UPI Details Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/50 dark:to-slate-900/60 border border-indigo-100 dark:border-slate-700/80 space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Dynamic QR Code */}
                <div className="shrink-0 bg-white p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md text-center">
                  <img
                    src={qrCodeUrl}
                    alt={`UPI QR Code for ₹${selectedAmount}`}
                    width="180"
                    height="180"
                    className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                    loading="lazy"
                  />
                  <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                    <QrCode className="w-3 h-3 text-indigo-500" />
                    <span>Scan with Any UPI App</span>
                  </div>
                </div>

                {/* UPI Details & 1-Click Copy */}
                <div className="flex-1 space-y-3.5 text-center sm:text-left w-full">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Official UPI ID</div>
                    <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 select-all">
                        {UPI_ID}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition-all shadow-xs cursor-pointer"
                        title="Copy UPI ID"
                      >
                        {hasCopiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{hasCopiedUpi ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400">Account Name:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-100">{UPI_NAME}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Amount to Send:</span>{' '}
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{selectedAmount.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Direct Mobile UPI Pay Button */}
                  <div className="pt-1">
                    <a
                      href={upiDeepLink}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Pay ₹{selectedAmount} on UPI App</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Supported UPI Apps Row */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Supported Payment Apps:</span>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    Google Pay
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    PhonePe
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    Paytm
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    BHIM
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    FamPay
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: UTR Submission Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-[24px] bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Step 2: Submit UTR for Verification
              </div>
              <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                Claim Supporter Badge
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Once submitted, our editorial desk verifies your 12-digit UTR against the bank ledger.
              </p>
            </div>

            {/* Submission Form / Success Card */}
            {submissionSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-emerald-900 dark:text-emerald-200">
                    Thank You, {submissionSuccess.name}!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                    Your contribution of <strong>₹{submissionSuccess.amount}</strong> has been logged with UTR{' '}
                    <code className="font-mono bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">
                      {submissionSuccess.utr}
                    </code>
                    .
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/60 text-xs text-slate-600 dark:text-slate-300 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Leaderboard Verification Timeline:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    The leaderboard updates every <strong>12 hours</strong>. After our editorial desk verifies the bank settlement,
                    your name and rank will shine on the Hall of Fame!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setUtrNumber('');
                    setMessage('');
                  }}
                  className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:scale-105 transition-transform"
                >
                  Submit Another Contribution
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Supporter Name (Required) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name or Nickname <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder="e.g. Aditya Sharma / NEET Aspirant"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonCheck"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="anonCheck" className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                      Star/Mask my name on public leaderboard (e.g., A***a S***a)
                    </label>
                  </div>
                </div>

                {/* Amount Contributed */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Sent (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="50000"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
                  />
                </div>

                {/* 12-Digit UPI UTR (Required) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    12-Digit UPI UTR / Transaction Reference ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 429188392101 (Find in GPay/PhonePe receipt)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
                  />
                  <span className="text-[10px] text-slate-400">
                    Required to verify payment with our bank settlement before featuring your name.
                  </span>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional — for personal thank-you note)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
                  />
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp / Phone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
                  />
                </div>

                {/* Encouragement Message (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Words of Encouragement / Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Leave a message for Tarun or fellow aspirants..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
                  ></textarea>
                </div>

                {/* 12-Hour Verification Notice */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Patience Notice:</strong> Leaderboard updates every <strong>12 hours</strong>. To maintain 100% authenticity and prevent spam, our editorial desk verifies every UTR manually before publishing.
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black dark:hover:bg-slate-100 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#D4FF4F] dark:text-[#111406]" />
                      <span>Submit UTR &amp; Join Hall of Fame</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: TOP 5 SUPPORTERS HALL OF FAME (RANK-WISE PREMIUM PODIUM)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Top 5 Patrons &amp; Benefactors</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
            Hall of Fame Champions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Special recognition for our greatest contributors whose generosity keeps servers online for every aspirant in India.
          </p>
        </div>

        {/* Podium Display (Top 5) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {leaderboard.top5.map((sup, idx) => {
            const rank = idx + 1;
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;
            const isRank3 = rank === 3;

            return (
              <div
                key={sup.id || idx}
                className={`relative rounded-[22px] p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  isRank1
                    ? 'bg-gradient-to-b from-amber-500/15 via-amber-400/5 to-transparent border-2 border-amber-400 dark:border-amber-400/80 shadow-lg ring-4 ring-amber-400/10 md:col-span-1 lg:col-span-1 lg:scale-105'
                    : isRank2
                    ? 'bg-gradient-to-b from-slate-400/15 to-transparent border-2 border-slate-300 dark:border-slate-600 shadow-md'
                    : isRank3
                    ? 'bg-gradient-to-b from-amber-700/15 to-transparent border-2 border-amber-600/40 dark:border-amber-700/50 shadow-md'
                    : 'bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-sm'
                }`}
              >
                {/* Crown / Rank Banner */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    {isRank1 ? (
                      <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                        👑
                      </span>
                    ) : isRank2 ? (
                      <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-black flex items-center justify-center text-xs shadow-xs">
                        🥈
                      </span>
                    ) : isRank3 ? (
                      <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center text-xs shadow-xs">
                        🥉
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                        #{rank}
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-black uppercase tracking-wider ${
                        isRank1
                          ? 'text-amber-600 dark:text-amber-400'
                          : isRank2
                          ? 'text-slate-600 dark:text-slate-300'
                          : isRank3
                          ? 'text-amber-700 dark:text-amber-500'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isRank1 ? 'Grand Champion' : isRank2 ? 'Silver Patron' : isRank3 ? 'Bronze Benefactor' : `Rank #${rank}`}
                    </span>
                  </div>
                </div>

                {/* Supporter Name & Amount */}
                <div className="space-y-1.5 mb-3">
                  <div className="font-display font-bold text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span>{sup.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Verified UTR Donor" />
                  </div>
                  <div className="font-mono font-black text-2xl text-slate-900 dark:text-white">
                    ₹{sup.amount.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Personal Message */}
                {sup.message && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-black/[0.02] dark:bg-white/[0.03] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.04] line-clamp-3 mb-3 leading-relaxed">
                    "{sup.message}"
                  </div>
                )}

                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Verified Supporter</span>
                  <span>{new Date(sup.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: COMPLETE VERIFIED SUPPORTERS STREAM & LEADERBOARD
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <div className="p-6 sm:p-8 rounded-[24px] bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>All Verified Contributions</span>
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                Public Supporter Leaderboard
              </h3>
            </div>

            {/* Notice pill & filters */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search box */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search supporter name..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4FF4F]"
                />
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-xs">
                <button
                  type="button"
                  onClick={() => setSortBy('amount')}
                  className={`px-3 py-1 rounded-full font-bold cursor-pointer transition-all ${
                    sortBy === 'amount'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Top Amount
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('recent')}
                  className={`px-3 py-1 rounded-full font-bold cursor-pointer transition-all ${
                    sortBy === 'recent'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Most Recent
                </button>
              </div>
            </div>
          </div>

          {/* 12-Hour Verification Notice Header */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>
                <strong>Leaderboard Status:</strong> Audited every 12 hours. Average reconciliation window: 6–12 hrs.
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Last Synced: {new Date(leaderboard.stats.lastUpdated).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Supporters List */}
          {filteredSupporters.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No supporters found matching "{searchFilter}".
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {filteredSupporters.map((sup, idx) => (
                <div
                  key={sup.id || idx}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors rounded-xl px-2"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Rank Number */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      #{sup.rank || idx + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                          {sup.name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Verified
                        </span>
                      </div>

                      {sup.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{sup.message}"
                        </p>
                      )}

                      <div className="text-[10px] text-slate-400">
                        Submitted {new Date(sup.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Amount Badge */}
                  <div className="sm:text-right shrink-0">
                    <div className="font-mono font-black text-lg text-slate-900 dark:text-white">
                      ₹{sup.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                      Paid via UPI
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: FAQ & TRUST COMMITMENTS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-2xl p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h4 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <span>Frequently Asked Questions About Contributions</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <strong className="text-slate-900 dark:text-white block">Why does the leaderboard update every 12 hours?</strong>
            <p className="leading-relaxed">
              To keep our platform spam-free and 100% authentic, every UTR submission is manually matched against our UPI bank statement before being published. We do this twice daily.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <strong className="text-slate-900 dark:text-white block">Can I stay completely anonymous?</strong>
            <p className="leading-relaxed">
              Yes! Simply tick the "Star/Mask my name" checkbox during submission. Your name will be masked as <code>T***n K***r</code> or displayed as "Anonymous Aspirant" on the public board.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <strong className="text-slate-900 dark:text-white block">What if I submitted the wrong UTR?</strong>
            <p className="leading-relaxed">
              No worries! You can email Tarun directly at{' '}
              <a href="mailto:you.pncml123@gmail.com" className="text-indigo-600 dark:text-indigo-400 underline">
                you.pncml123@gmail.com
              </a>{' '}
              with a screenshot of your UPI receipt, and we will update your record manually.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <strong className="text-slate-900 dark:text-white block">Will IndianTimers remain free?</strong>
            <p className="leading-relaxed">
              Yes, 100%. All countdowns, syllabus pacing, and focus timers are completely free for all Indian students.
              Donations are purely voluntary to help offset server and maintenance costs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
