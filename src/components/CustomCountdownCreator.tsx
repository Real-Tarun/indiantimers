import React, { useState, useEffect } from 'react';
import { calculateCountdown, type CountdownResult } from '../utils/countdown';
import { storageService } from '../utils/storage';
import { siteConfig } from '../config/site';
import { Calendar, Share2, PlusCircle, Check, Copy, ArrowRight } from 'lucide-react';

export default function CustomCountdownCreator() {
  const [title, setTitle] = useState('My Physics Mock Test 4');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks ahead by default
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('14:00');
  const [category, setCategory] = useState('Coaching Mock');
  const [notes, setNotes] = useState('Target: Complete 45 questions with >80% accuracy.');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Read URL query params on load if visiting a shared link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTitle = params.get('title');
      const urlDate = params.get('date');
      const urlTime = params.get('time');
      const urlNotes = params.get('notes');
      if (urlTitle) setTitle(urlTitle);
      if (urlDate) setDate(urlDate);
      if (urlTime) setTime(urlTime);
      if (urlNotes) setNotes(urlNotes);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (next) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  const [previewCountdown, setPreviewCountdown] = useState<CountdownResult>(() =>
    calculateCountdown(date, time, 'official', siteConfig.defaultTimezone)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewCountdown(calculateCountdown(date, time, 'official', siteConfig.defaultTimezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [date, time]);

  const handleSaveToDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveCustomCountdown({
      title: title.trim() || 'Untitled Deadline',
      targetDate: date,
      targetTime: time,
      timezone: siteConfig.defaultTimezone,
      category,
      notes,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const generateShareableUrl = () => {
    const baseUrl = `${siteConfig.url}/tools/countdown/`;
    const params = new URLSearchParams({
      title: title.trim(),
      date,
      time,
      notes: notes.trim(),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleCopyShareLink = async () => {
    const url = generateShareableUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // clipboard blocked
    }
  };

  const downloadPersonalICS = () => {
    const cleanDate = date.replace(/-/g, '');
    const [h, m] = (time || '09:00').split(':');
    const dtStart = `${cleanDate}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IndianTimers//Custom Student Countdown//EN',
      'BEGIN:VEVENT',
      `UID:custom-${Date.now()}@indiantimers.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dtStart}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${notes}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}-deadline.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Form Input Area */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">
          Configure Your Custom Countdown
        </h3>
        <form onSubmit={handleSaveToDashboard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event / Target Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Allen Minor Test 3, Chemistry Revision, College Form"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Time (Optional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Coaching Mock">Coaching Test</option>
                <option value="School / College">School / College Exam</option>
                <option value="Application Deadline">Application Deadline</option>
                <option value="Syllabus Milestone">Syllabus Completion Goal</option>
                <option value="Other">Other Personal Event</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Timezone
              </label>
              <input
                type="text"
                disabled
                value="IST (Indian Standard Time, UTC+05:30)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Notes / Action Items
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring Admit Card, Calculator, Revise Organic Chemistry formulas..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons (Flux Pills) */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#18181B] dark:bg-white hover:bg-black text-white dark:text-[#111406] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#D4FF4F]" />
                  <span>Saved to Dashboard!</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-[#D4FF4F] dark:text-[#111406]" />
                  <span>Save to My Dashboard</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-2.5 rounded-full text-xs font-bold border border-black/[0.08] dark:border-white/[0.1] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={downloadPersonalICS}
              className="px-4 py-2.5 rounded-full text-xs font-bold border border-black/[0.08] dark:border-white/[0.1] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Download .ICS</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Live Countdown Preview
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406]">
            {category}
          </span>
        </div>

        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-display">
          {title || 'Your Event Title'}
        </h4>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
          Scheduled for: <strong className="text-slate-900 dark:text-slate-200">{previewCountdown.formattedTargetDate}</strong> at {time} IST
        </p>

        {/* Big Preview Digits */}
        {!previewCountdown.isPast ? (
          <div className="grid grid-cols-4 gap-2 py-4 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-black/[0.05] dark:border-white/[0.06] text-center mb-6">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-digits">
                {previewCountdown.days}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Days</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-digits">
                {previewCountdown.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Hours</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-digits">
                {previewCountdown.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Mins</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-digits">
                {previewCountdown.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Secs</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs text-center mb-6 font-bold">
            This target date has already passed.
          </div>
        )}

        {notes && (
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 mb-6">
            <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">Notes:</span>
            {notes}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="font-bold text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-[#D4FF4F] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Full Screen View ⛶</span>
          </button>
          <a href="/dashboard/" className="text-slate-700 dark:text-slate-300 font-semibold hover:underline flex items-center gap-1">
            <span>View in Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Fullscreen Overlay Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-between p-6 sm:p-12 bg-white dark:bg-[#0E1017] transition-all overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#D4FF4F] text-[#111406]">
              {category}
            </span>

            <button
              onClick={toggleFullscreen}
              type="button"
              className="px-4 py-2 rounded-full font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Exit Fullscreen (Esc)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Exit Fullscreen (Esc)</span>
            </button>
          </div>

          {/* Center Main Countdown Stage */}
          <div className="text-center my-auto py-8 w-full max-w-5xl mx-auto">
            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
              {title || 'Untitled Countdown'}
            </h2>
            <p className="text-sm sm:text-lg font-bold text-slate-600 dark:text-slate-300 mb-10">
              Target: <strong className="text-slate-900 dark:text-white">{previewCountdown.formattedTargetDate}</strong> at {time} IST
            </p>

            {/* Giant Digits */}
            {!previewCountdown.isPast ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
                <div className="p-6 sm:p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl text-slate-900 dark:text-white block leading-none">
                    {previewCountdown.days}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-400 mt-3 block">Days</span>
                </div>
                <div className="p-6 sm:p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl text-slate-900 dark:text-white block leading-none">
                    {previewCountdown.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-400 mt-3 block">Hours</span>
                </div>
                <div className="p-6 sm:p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl text-slate-900 dark:text-white block leading-none">
                    {previewCountdown.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-400 mt-3 block">Minutes</span>
                </div>
                <div className="p-6 sm:p-8 rounded-[24px] bg-[#D4FF4F] text-[#111406] shadow-md">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl block leading-none">
                    {previewCountdown.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-extrabold tracking-widest text-[#111406]/80 mt-3 block">Seconds</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-[24px] bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Target date has passed.
              </div>
            )}

            {notes && (
              <p className="mt-8 text-sm text-slate-500 italic max-w-lg mx-auto">
                "{notes}"
              </p>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 w-full max-w-5xl mx-auto pt-6 border-t border-black/[0.05] dark:border-white/[0.05]">
            <span>Tip: Press <kbd className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">Esc</kbd> anytime to exit Fullscreen</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">IndianTimers Personal Focus</span>
          </div>
        </div>
      )}
    </div>
  );
}
