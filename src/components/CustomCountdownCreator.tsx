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

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved to Dashboard!</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Save to My Dashboard</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={downloadPersonalICS}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Download .ICS</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/40 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Live Countdown Preview
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {category}
          </span>
        </div>

        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {title || 'Your Event Title'}
        </h4>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Scheduled for: <strong className="text-slate-800 dark:text-slate-200">{previewCountdown.formattedTargetDate}</strong> at {time} IST
        </p>

        {/* Big Preview Digits */}
        {!previewCountdown.isPast ? (
          <div className="grid grid-cols-4 gap-2 py-4 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center mb-6 shadow-xs">
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-tabular">
                {previewCountdown.days}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Days</span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-tabular">
                {previewCountdown.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Hours</span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-tabular">
                {previewCountdown.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Mins</span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-tabular">
                {previewCountdown.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1">Secs</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs text-center mb-6">
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
          <span>Saved to your browser storage</span>
          <a href="/dashboard/" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
            <span>View in Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
