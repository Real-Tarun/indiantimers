import React, { useState, useEffect, useMemo } from 'react';
import type { SupporterRecord, LeaderboardResponse, DonationSubmissionInput } from '../types/support.ts';
import confetti from 'canvas-confetti';
import {
  Heart,
  Crown,
  Medal,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Search,
  QrCode,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];
const UPI_ID = 'tarun.in@fam';
const UPI_NAME = 'Tarun Kumar';

export default function SupportUsInteractive() {
  // Amount selection state (starts blank as requested)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');

  // Copy toast state
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
    top5: [],
    allSupporters: [],
    stats: {
      totalRaised: 0,
      totalSupporters: 0,
      lastUpdated: new Date().toISOString(),
      updateInterval: 'Average 12 Hours',
    },
  }));
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Fetch live leaderboard on mount
  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoadingLeaderboard(true);
        const res = await fetch('/api/support/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.allSupporters)) {
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
    if (selectedAmount === val) {
      setSelectedAmount(null);
      setCustomAmount('');
    } else {
      setSelectedAmount(val);
      setCustomAmount(String(val));
      setAmountError('');
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomAmount(raw);
    if (raw.trim() === '') {
      setSelectedAmount(null);
      setAmountError('');
      return;
    }
    const parsed = Number(raw);
    if (isNaN(parsed)) {
      setAmountError('Please enter a valid amount.');
      return;
    }
    if (parsed < 10) {
      setAmountError('Minimum amount is ₹10.');
    } else if (parsed > 50000) {
      setAmountError('Maximum amount is ₹50,000.');
    } else {
      setAmountError('');
      setSelectedAmount(parsed);
    }
  };

  // Dynamic QR Code URL for UPI scan
  const qrCodeUrl = useMemo(() => {
    let upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
      UPI_NAME
    )}&cu=INR&tn=${encodeURIComponent('Support IndianTimers')}`;
    if (selectedAmount && selectedAmount >= 10 && selectedAmount <= 50000) {
      upiUri += `&am=${selectedAmount}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiUri)}`;
  }, [selectedAmount]);

  // Copy UPI ID
  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID);
      setHasCopiedUpi(true);
      setTimeout(() => setHasCopiedUpi(false), 2000);
    }
  };

  // Submit UTR form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = supporterName.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your name (at least 2 characters).');
      return;
    }

    const amt = Number(customAmount);
    if (isNaN(amt) || amt < 10 || amt > 50000) {
      setFormError('Amount must be between ₹10 and ₹50,000.');
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
        setFormError(data.error || 'Failed to submit verification request.');
        setIsSubmitting(false);
        return;
      }

      setSubmissionSuccess(data.record || { ...payload, createdAt: new Date().toISOString() });
      setIsSubmitting(false);

      if (typeof window !== 'undefined') {
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }
    } catch {
      setFormError('Network error while submitting. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Filtered supporters
  const filteredSupporters = useMemo(() => {
    let list = [...leaderboard.allSupporters];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.message && s.message.toLowerCase().includes(q))
      );
    }
    return list;
  }, [leaderboard.allSupporters, searchFilter]);

  const top5List = leaderboard.top5 || [];

  return (
    <div className="max-w-4xl mx-auto space-y-10 px-4 py-2">
      {/* ─── SECTION 1: CREATOR NOTE (HUMAN, PROFESSIONAL, ENGLISH) ─── */}
      <section className="bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span>Independent Student Initiative</span>
        </div>

        <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
          Support IndianTimers
        </h1>

        <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 pt-1">
          <p>
            Hi, I'm <strong>Tarun</strong> — a student and independent developer from India.
          </p>
          <p>
            Like millions of aspirants across the country preparing for competitive examinations, I experienced firsthand
            how exhausting it is to navigate clickbait headlines, misleading datesheet rumors, and cluttered portals while
            trying to focus on preparation.
          </p>
          <p>
            I built IndianTimers as an independent project to give fellow students a calm, dependable space: accurate
            countdown timers, verified official notifications, and distraction-free study utilities. Everything on this
            platform is designed, coded, and maintained by me as a solo creator.
          </p>
          <p>
            Running fast edge servers, monitoring official government circulars, and keeping the platform reliable involves
            ongoing server and domain expenses. If IndianTimers has helped your journey in any way, your voluntary
            contribution — no matter the amount — directly supports keeping this initiative alive and updated. Thank you for
            your kindness and support!
          </p>
        </div>
      </section>

      {/* ─── SECTION 2: PAYMENT & UTR SUBMISSION (SIMPLE 2-COL GRID) ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: QR Code & UPI ID */}
        <div className="bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              1. Pay via UPI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select or enter amount, scan QR with any UPI app.
            </p>
          </div>

          {/* Clean preset amount pills */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Select Amount
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAmountSelect(amt)}
                  className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs cursor-pointer transition-all ${
                    selectedAmount === amt
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="pt-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Custom amount (₹10 – ₹50,000)"
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>
              {amountError && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pt-1">
                  {amountError}
                </div>
              )}
            </div>
          </div>

          {/* QR Code and UPI ID */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="bg-white p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <img
                src={qrCodeUrl}
                alt={`Scan to pay ₹${selectedAmount}`}
                width="160"
                height="160"
                className="w-40 h-40 object-contain rounded-lg"
                loading="lazy"
              />
            </div>

            <div className="text-center space-y-1.5 w-full">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">UPI ID</div>
              <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white">
                <span>{UPI_ID}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer ml-1"
                  title="Copy UPI ID"
                >
                  {hasCopiedUpi ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                {selectedAmount ? (
                  <>Amount: <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{selectedAmount}</strong> · </>
                ) : (
                  <span className="text-slate-400">Scan to pay any amount · </span>
                )}
                Name: {UPI_NAME}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: UTR Verification Form */}
        <div className="bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              2. Submit UTR Reference
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your details after sending payment to appear on the leaderboard.
            </p>
          </div>

          {submissionSuccess ? (
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Thank You, {submissionSuccess.name}!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Your submission of <strong>₹{submissionSuccess.amount}</strong> (UTR: {submissionSuccess.utr}) has been received.
                </p>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                ⏱️ Average leaderboard update is every <strong>12 hours</strong> after bank reconciliation.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmissionSuccess(null);
                  setUtrNumber('');
                  setMessage('');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitForm} className="space-y-3">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name / Nickname <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supporterName}
                  onChange={(e) => setSupporterName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="anonCheck"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 cursor-pointer text-xs"
                  />
                  <label htmlFor="anonCheck" className="text-[11px] text-slate-500 cursor-pointer select-none">
                    Mask name on public leaderboard (e.g. R***l S***a)
                  </label>
                </div>
              </div>

              {/* Amount (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Sent (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="50000"
                  placeholder="Enter amount in ₹ (e.g. 100)"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* UTR (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  12-Digit UTR / Transaction ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 429188392101 (From UPI payment receipt)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Optional Email & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Email <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Phone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp / Phone"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Message (Optional) */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Message / Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional note for Tarun..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                ></textarea>
              </div>

              {/* 12-Hour Patience Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Average leaderboard update is every <strong>12 hours</strong>. Bank settlement se UTR match karne ke baad aapka name leaderboard me reflect hota hai.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#18181B] dark:bg-white text-white dark:text-[#111406] font-bold text-xs hover:bg-black dark:hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit UTR Reference'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ─── SECTION 3: TOP 5 SUPPORTERS (PREMIUM PODIUM) ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <h2 className="font-display font-black text-lg text-slate-900 dark:text-white">
              Top 5 Supporters
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Average update every 12 hrs
          </span>
        </div>

        {top5List.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">No supporters on the leaderboard yet.</p>
            <p className="text-[11px] text-slate-400">Be the first to contribute and take the #1 spot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {top5List.map((sup, idx) => {
              const rank = idx + 1;
              const isRank1 = rank === 1;
              const isRank2 = rank === 2;
              const isRank3 = rank === 3;

              return (
                <div
                  key={sup.id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isRank1
                      ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-300 dark:border-amber-500/50 shadow-xs'
                      : isRank2
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
                      : isRank3
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                      : 'bg-white dark:bg-[#171923] border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      {isRank1 ? '👑 #1 Top' : isRank2 ? '🥈 #2' : isRank3 ? '🥉 #3' : `#${rank}`}
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      ₹{sup.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                    {sup.name}
                  </div>

                  {sup.message && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-2">
                      "{sup.message}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── SECTION 4: ALL SUPPORTERS LIST ─── */}
      <section className="bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              All Verified Supporters
            </h3>
            <p className="text-[11px] text-slate-500">
              Total {leaderboard.allSupporters.length} supporters · Updates every 12 hours
            </p>
          </div>

          {leaderboard.allSupporters.length > 5 && (
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search supporter name..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {filteredSupporters.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            {leaderboard.allSupporters.length === 0
              ? 'No verified supporters yet. Submit your UTR above to join the board!'
              : 'No supporters found matching search.'}
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {filteredSupporters.map((sup, idx) => (
              <div key={sup.id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-400 font-mono font-bold w-5">#{idx + 1}</span>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {sup.name}
                    </span>
                    {sup.message && (
                      <span className="text-[11px] text-slate-500 italic truncate block">
                        "{sup.message}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    ₹{sup.amount.toLocaleString('en-IN')}
                  </span>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
