import React, { useState, useEffect } from 'react';
import { calculateCountdown, type CountdownResult } from '../utils/countdown';
import { storageService } from '../utils/storage';
import { EXAM_REGISTRY } from '../data/exams';
import { siteConfig } from '../config/site';
import {
  Share2,
  Bookmark,
  Check,
  Calendar,
  Clock,
  ExternalLink,
  Code2,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function ShareableCountdown() {
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [category, setCategory] = useState('Custom Countdown');
  const [notes, setNotes] = useState('');
  const [isOfficial, setIsOfficial] = useState(false);
  const [officialExam, setOfficialExam] = useState<(typeof EXAM_REGISTRY)[0] | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [savedToCockpit, setSavedToCockpit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const paramExam = urlParams.get('exam');
    const paramTitle = urlParams.get('title');
    const paramDate = urlParams.get('date');
    const paramTime = urlParams.get('time');
    const paramTz = urlParams.get('tz');
    const paramCat = urlParams.get('category');
    const paramNotes = urlParams.get('notes');

    if (paramExam) {
      const found = EXAM_REGISTRY.find((e) => e.id === paramExam || e.slug === paramExam);
      if (found) {
        setExamId(found.id);
        setTitle(found.name);
        setDate(found.dates.examDate);
        setTime(found.startTime || '14:00');
        setTimezone(found.timezone || 'Asia/Kolkata');
        setCategory(found.category.replace(/-/g, ' '));
        setIsOfficial(found.dateStatus === 'official' || found.dateStatus === 'tentative');
        setOfficialExam(found);
        setParamsLoaded(true);
        return;
      }
    }

    if (paramTitle || paramDate) {
      // Validate target date
      if (!paramDate || isNaN(Date.parse(paramDate))) {
        setErrorMsg('The target date provided in this shared link is invalid or incomplete.');
        setParamsLoaded(true);
        return;
      }

      // Sanitize inputs (never execute or treat as HTML)
      setTitle((paramTitle || 'Shared Countdown').trim().slice(0, 100));
      setDate(paramDate.trim().slice(0, 20));
      setTime((paramTime || '14:00').trim().slice(0, 8));
      setTimezone((paramTz || 'Asia/Kolkata').trim().slice(0, 50));
      setCategory((paramCat || 'Custom Goal').trim().slice(0, 40));
      setNotes((paramNotes || '').trim().slice(0, 500));
      setIsOfficial(false);
      setParamsLoaded(true);
      return;
    }

    // If no params, default to NEET UG benchmark
    const defaultExam = EXAM_REGISTRY[0];
    setExamId(defaultExam.id);
    setTitle(defaultExam.name);
    setDate(defaultExam.dates.examDate);
    setTime(defaultExam.startTime || '14:00');
    setTimezone(defaultExam.timezone);
    setCategory(defaultExam.category.replace(/-/g, ' '));
    setIsOfficial(true);
    setOfficialExam(defaultExam);
    setParamsLoaded(true);
  }, []);

  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    calculateCountdown(date || '2027-05-02', time, isOfficial ? 'official' : 'tentative', timezone)
  );

  useEffect(() => {
    if (!date) return;
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(date, time, isOfficial ? 'official' : 'tentative', timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [date, time, isOfficial, timezone]);

  const handleShareLink = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} | IndianTimers`,
          text: `Countdown to ${title}: ${countdown.days} days remaining!`,
          url: currentUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSaveToMyCockpit = () => {
    if (examId && officialExam) {
      storageService.addSavedExam(examId);
    } else {
      storageService.saveCustomCountdown({
        title: title || 'Shared Countdown',
        targetDate: date,
        targetTime: time,
        timezone,
        category,
        notes,
      });
    }
    setSavedToCockpit(true);
    setTimeout(() => setSavedToCockpit(false), 2500);
  };

  if (!paramsLoaded) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading shared countdown...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-[24px] border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Invalid Countdown Link</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">{errorMsg}</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/tools/countdown/" className="btn-primary">
            Create New Custom Timer
          </a>
          <a href="/my-exams/" className="px-4 py-2 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            Open My Cockpit
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Target Status Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            {category}
          </span>
          {isOfficial ? (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#D4FF4F] text-[#111406]">
              Verified Official Schedule
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300">
              Personal / Custom Target
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{timezone}</span>
        </div>
      </div>

      {/* Main Countdown Display Stage */}
      <div className="rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 sm:p-10 text-center shadow-lg">
        {officialExam && (
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            {officialExam.conductingAuthority}
          </p>
        )}

        <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-3">
          {title}
        </h1>

        <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mb-8">
          Target Date: <strong className="text-slate-900 dark:text-white">{countdown.formattedTargetDate}</strong>
          {time && ` at ${time} IST`}
        </p>

        {/* 4-Box Digital Clock */}
        {!countdown.isPast ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 max-w-xl mx-auto mb-8">
            <div className="p-5 sm:p-6 rounded-[22px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-mono-digits font-black text-4xl sm:text-6xl text-slate-900 dark:text-white block leading-none">
                {countdown.days}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-slate-400 mt-2 block">
                Days Left
              </span>
            </div>

            <div className="p-5 sm:p-6 rounded-[22px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-mono-digits font-black text-4xl sm:text-6xl text-slate-900 dark:text-white block leading-none">
                {countdown.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-slate-400 mt-2 block">
                Hours
              </span>
            </div>

            <div className="p-5 sm:p-6 rounded-[22px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-mono-digits font-black text-4xl sm:text-6xl text-slate-900 dark:text-white block leading-none">
                {countdown.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-slate-400 mt-2 block">
                Minutes
              </span>
            </div>

            <div className="p-5 sm:p-6 rounded-[22px] bg-[#D4FF4F] text-[#111406] shadow-md">
              <span className="font-mono-digits font-black text-4xl sm:text-6xl block leading-none">
                {countdown.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-[#111406]/80 mt-2 block">
                Seconds
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-[22px] bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
            Target date has passed.
          </div>
        )}

        {notes && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 max-w-lg mx-auto mb-8 text-xs text-slate-600 dark:text-slate-400 italic">
            "{notes}"
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleShareLink}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
          </button>

          <button
            onClick={handleSaveToMyCockpit}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {savedToCockpit ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{savedToCockpit ? 'Saved to Cockpit ✓' : 'Save to My Cockpit'}</span>
          </button>

          <a
            href={`/tools/countdown/embed/?title=${encodeURIComponent(title)}&date=${date}&time=${time}`}
            className="px-4 py-2.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Get Embed Code</span>
          </a>
        </div>
      </div>

      {/* Disclaimers & Provenance */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          {isOfficial ? (
            <p>
              This is a verified national examination schedule benchmark. Official notifications and circulars are validated against authentic conducting authorities before publication.
            </p>
          ) : (
            <p>
              <strong>Notice:</strong> This is a custom target created by a user for personal study tracking. It is not an officially gazetted government examination notification.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
