import React, { useState, useEffect } from 'react';
import { calculateCountdown, type CountdownResult } from '../utils/countdown';
import { EXAM_REGISTRY } from '../data/exams';

export default function EmbedCountdown() {
  const [title, setTitle] = useState('Exam Countdown');
  const [date, setDate] = useState('2027-05-02');
  const [time, setTime] = useState('14:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [layout, setLayout] = useState<'large' | 'compact'>('large');
  const [showLabels, setShowLabels] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [authority, setAuthority] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const paramExam = params.get('exam');
    const paramTitle = params.get('title');
    const paramDate = params.get('date');
    const paramTime = params.get('time');
    const paramTz = params.get('tz');
    const paramTheme = params.get('theme') as 'light' | 'dark' | 'auto';
    const paramLayout = params.get('layout') as 'large' | 'compact';
    const paramLabels = params.get('labels');
    const paramProgress = params.get('progress');

    if (paramExam) {
      const exam = EXAM_REGISTRY.find((e) => e.id === paramExam || e.slug === paramExam);
      if (exam) {
        setTitle(exam.name);
        setDate(exam.dates.examDate);
        setTime(exam.startTime || '14:00');
        setTimezone(exam.timezone || 'Asia/Kolkata');
        setAuthority(exam.conductingAuthority);
      }
    } else if (paramTitle || paramDate) {
      if (!paramDate || isNaN(Date.parse(paramDate))) {
        setError('Invalid exam target date.');
        return;
      }
      setTitle((paramTitle || 'Countdown').trim().slice(0, 80));
      setDate(paramDate.trim());
      if (paramTime) setTime(paramTime.trim());
      if (paramTz) setTimezone(paramTz.trim());
    }

    if (paramTheme && ['light', 'dark', 'auto'].includes(paramTheme)) {
      setTheme(paramTheme);
    }
    if (paramLayout && ['large', 'compact'].includes(paramLayout)) {
      setLayout(paramLayout);
    }
    if (paramLabels !== null) {
      setShowLabels(paramLabels !== '0' && paramLabels !== 'false');
    }
    if (paramProgress !== null) {
      setShowProgress(paramProgress === '1' || paramProgress === 'true');
    }
  }, []);

  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    calculateCountdown(date, time, 'official', timezone)
  );

  useEffect(() => {
    if (!date) return;
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(date, time, 'official', timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [date, time, timezone]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center text-xs text-red-500 bg-red-50 font-sans">
        {error}
      </div>
    );
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'auto' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const containerClasses = `w-full h-full p-4 sm:p-5 flex flex-col justify-between font-sans select-none overflow-hidden ${
    isDark ? 'bg-[#0E1017] text-white' : 'bg-white text-slate-900'
  }`;

  if (layout === 'compact') {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm truncate leading-tight">{title}</h3>
            <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {countdown.formattedTargetDate} · {time} IST
            </p>
          </div>
          <a
            href="https://indiantimers.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[#D4FF4F] bg-black px-2 py-0.5 rounded-full shrink-0"
          >
            IndianTimers
          </a>
        </div>

        {/* Compact Digits row */}
        <div className="grid grid-cols-4 gap-2 text-center my-auto">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <span className="font-black text-lg sm:text-xl block leading-none font-mono">
              {countdown.days}
            </span>
            {showLabels && <span className="text-[9px] uppercase font-bold text-slate-400">Days</span>}
          </div>
          <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <span className="font-black text-lg sm:text-xl block leading-none font-mono">
              {countdown.hours.toString().padStart(2, '0')}
            </span>
            {showLabels && <span className="text-[9px] uppercase font-bold text-slate-400">Hrs</span>}
          </div>
          <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <span className="font-black text-lg sm:text-xl block leading-none font-mono">
              {countdown.minutes.toString().padStart(2, '0')}
            </span>
            {showLabels && <span className="text-[9px] uppercase font-bold text-slate-400">Min</span>}
          </div>
          <div className="p-2 rounded-xl bg-[#D4FF4F] text-[#111406]">
            <span className="font-black text-lg sm:text-xl block leading-none font-mono">
              {countdown.seconds.toString().padStart(2, '0')}
            </span>
            {showLabels && <span className="text-[9px] uppercase font-black text-[#111406]/75">Sec</span>}
          </div>
        </div>
      </div>
    );
  }

  // Large Layout
  return (
    <div className={containerClasses}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {authority && (
            <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {authority}
            </p>
          )}
          <h2 className="font-extrabold text-sm sm:text-base truncate leading-tight">
            {title}
          </h2>
        </div>
        <a
          href="https://indiantimers.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          indiantimers.com ↗
        </a>
      </div>

      {/* 4 Block Digital Display */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 my-2 text-center">
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="font-black text-2xl sm:text-3xl block leading-none font-mono">
            {countdown.days}
          </span>
          {showLabels && (
            <span className="text-[9px] uppercase font-bold text-slate-400 mt-1 block">
              Days
            </span>
          )}
        </div>
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="font-black text-2xl sm:text-3xl block leading-none font-mono">
            {countdown.hours.toString().padStart(2, '0')}
          </span>
          {showLabels && (
            <span className="text-[9px] uppercase font-bold text-slate-400 mt-1 block">
              Hours
            </span>
          )}
        </div>
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="font-black text-2xl sm:text-3xl block leading-none font-mono">
            {countdown.minutes.toString().padStart(2, '0')}
          </span>
          {showLabels && (
            <span className="text-[9px] uppercase font-bold text-slate-400 mt-1 block">
              Mins
            </span>
          )}
        </div>
        <div className="p-3 rounded-2xl bg-[#D4FF4F] text-[#111406] shadow-sm">
          <span className="font-black text-2xl sm:text-3xl block leading-none font-mono">
            {countdown.seconds.toString().padStart(2, '0')}
          </span>
          {showLabels && (
            <span className="text-[9px] uppercase font-black text-[#111406]/80 mt-1 block">
              Secs
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className={`flex items-center justify-between text-[11px] pt-1.5 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
        <span>Date: <strong>{countdown.formattedTargetDate}</strong> {time ? `· ${time} IST` : ''}</span>
        <span className="font-medium text-[10px]">Verified Live Timer</span>
      </div>
    </div>
  );
}
