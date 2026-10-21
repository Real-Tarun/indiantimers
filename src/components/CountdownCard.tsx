import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ExamRecord } from '../types/exam';
import { calculateCountdown, type CountdownResult } from '../utils/countdown';
import { storageService } from '../utils/storage';
import { downloadICS } from '../utils/calendar';
import { siteConfig } from '../config/site';

interface Props {
  exam: ExamRecord;
  compact?: boolean;
}

export default function CountdownCard({ exam: initialExam, compact = false }: Props) {
  const [exam, setExam] = useState<ExamRecord>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = JSON.parse(window.localStorage.getItem('it_clock_overrides') || '{}');
        if (stored[initialExam.id]) {
          const ov = stored[initialExam.id];
          return {
            ...initialExam,
            dates: { ...initialExam.dates, ...(ov.dates || {}) },
            dateStatus: ov.dateStatus || initialExam.dateStatus,
            startTime: ov.startTime || initialExam.startTime,
            endTime: ov.endTime || initialExam.endTime,
            officialSourceUrl: ov.officialSourceUrl || initialExam.officialSourceUrl,
            sourceNotificationTitle: ov.sourceNotificationTitle || initialExam.sourceNotificationTitle,
          };
        }
      } catch (e) {}
    }
    return initialExam;
  });

  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    calculateCountdown(exam.dates.examDate, exam.startTime, exam.dateStatus, exam.timezone)
  );
  const [isFav, setIsFav] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [secFlash, setSecFlash] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevSecsRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ examId: string; exam?: Partial<ExamRecord> }>;
      if (customEvent.detail) {
        if (customEvent.detail.examId === exam.id && customEvent.detail.exam) {
          setExam((prev) => {
            const next = { ...prev, ...customEvent.detail.exam } as ExamRecord;
            setCountdown(calculateCountdown(next.dates.examDate, next.startTime, next.dateStatus, next.timezone));
            return next;
          });
        } else if (customEvent.detail.examId === 'all') {
          setExam(initialExam);
          setCountdown(calculateCountdown(initialExam.dates.examDate, initialExam.startTime, initialExam.dateStatus, initialExam.timezone));
        }
      }
    };
    window.addEventListener('indiantimers:clock-updated', handleClockUpdate);
    return () => window.removeEventListener('indiantimers:clock-updated', handleClockUpdate);
  }, [exam.id, initialExam]);

  useEffect(() => {
    setIsFav(storageService.isFavorite(exam.id));

    const handleFavChange = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail) setIsFav(customEvent.detail.includes(exam.id));
    };
    window.addEventListener('indiantimers:favorites-updated', handleFavChange);

    const timer = setInterval(() => {
      const next = calculateCountdown(exam.dates.examDate, exam.startTime, exam.dateStatus, exam.timezone);
      setCountdown(next);
      if (next.seconds !== prevSecsRef.current) {
        setSecFlash(true);
        prevSecsRef.current = next.seconds;
        setTimeout(() => setSecFlash(false), 150);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('indiantimers:favorites-updated', handleFavChange);
    };
  }, [exam]);

  // Fullscreen escape key handler
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

  const toggleFullscreen = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav(storageService.toggleFavorite(exam.id));
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${siteConfig.url}/exams/${exam.slug}/`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${exam.shortName} Countdown | IndianTimers`,
          text: `${countdown.days} days left for ${exam.shortName}`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadICS(exam, siteConfig.url);
  };

  const showCountdown = exam.dateStatus !== 'not_announced' && !countdown.isPast;

  return (
    <>
      <div className="card group relative flex flex-col overflow-hidden bg-white dark:bg-[#171923] border border-black/[0.06] dark:border-white/[0.08] rounded-[22px] transition-all duration-200 hover:-translate-y-1">
        <div className="p-5 sm:p-6 flex flex-col flex-1 gap-3.5">
          {/* Top bar: Category badge + authority + actions */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {exam.category.replace(/-/g, ' ')}
                </span>
                {exam.dateStatus === 'official' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#D4FF4F] text-[#111406] shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111406] animate-pulse"></span>
                    Official
                  </span>
                ) : exam.dateStatus === 'tentative' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Tentative
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[180px]">
                {exam.conductingAuthority}
              </p>
            </div>

            {/* Action buttons (Share, Fullscreen, Bookmark) */}
            <div className="flex items-center gap-1 shrink-0 -mt-0.5">
              <button
                onClick={handleShare}
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Share countdown"
                aria-label="Share countdown"
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                )}
              </button>

              <button
                onClick={toggleFullscreen}
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Full Screen Countdown"
                aria-label="Enter full screen countdown"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>

              <button
                onClick={handleToggleFav}
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                style={{ color: isFav ? '#F59E0B' : undefined }}
                title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                aria-label="Toggle favorite"
              >
                <svg className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Exam short name & target date */}
          <div>
            <h3 className="font-display font-bold text-[17px] sm:text-[18px] text-slate-900 dark:text-white leading-tight">
              <a href={`/exams/${exam.slug}/`} className="hover:underline underline-offset-2">
                {exam.shortName}
              </a>
            </h3>
            <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 mt-1">
              {countdown.formattedTargetDate}
              {exam.startTime && ` · ${exam.startTime} IST`}
            </p>
          </div>

          {/* Live Countdown Digits Box */}
          {showCountdown ? (
            <div className="bg-[#F6F7FB] dark:bg-[#1E212D] border border-black/[0.04] dark:border-white/[0.05] rounded-2xl p-3 sm:p-4 flex items-center justify-around">
              {/* Days */}
              <div className="digit-block">
                <span className="font-mono-digits font-extrabold text-[1.8rem] sm:text-[2.2rem] text-slate-900 dark:text-white leading-none">
                  {countdown.days}
                </span>
                <span className="digit-label mt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">Days</span>
              </div>

              <span className="text-slate-300 dark:text-slate-600 font-mono text-xl sm:text-2xl font-bold pb-4 select-none">:</span>

              {/* Hours */}
              <div className="digit-block">
                <span className="font-mono-digits font-extrabold text-[1.8rem] sm:text-[2.2rem] text-slate-900 dark:text-white leading-none">
                  {countdown.hours.toString().padStart(2, '0')}
                </span>
                <span className="digit-label mt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">Hrs</span>
              </div>

              <span className="text-slate-300 dark:text-slate-600 font-mono text-xl sm:text-2xl font-bold pb-4 select-none">:</span>

              {/* Minutes */}
              <div className="digit-block">
                <span className="font-mono-digits font-extrabold text-[1.8rem] sm:text-[2.2rem] text-slate-900 dark:text-white leading-none">
                  {countdown.minutes.toString().padStart(2, '0')}
                </span>
                <span className="digit-label mt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">Min</span>
              </div>

              <span className="text-slate-300 dark:text-slate-600 font-mono text-xl sm:text-2xl font-bold pb-4 select-none">:</span>

              {/* Seconds (Flux Lime Highlight Pill) */}
              <div className="digit-block">
                <div className={`px-2.5 py-1.5 rounded-xl bg-[#D4FF4F] text-[#111406] shadow-xs flex flex-col items-center transition-transform ${secFlash ? 'scale-105' : 'scale-100'}`}>
                  <span className="font-mono-digits font-black text-[1.6rem] sm:text-[1.9rem] leading-none">
                    {countdown.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#111406]/75 mt-0.5">Sec</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {countdown.isPast
                ? '✓ This examination cycle has concluded'
                : '⏳ Awaiting official notification from conducting authority'}
            </div>
          )}

          {/* Footer: View details + ICS export + Fullscreen button */}
          <div className="flex items-center justify-between pt-2 mt-auto border-t border-black/[0.04] dark:border-white/[0.05]">
            <a
              href={`/exams/${exam.slug}/`}
              className="text-[12px] font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-[#D4FF4F] flex items-center gap-1 transition-colors group-hover:translate-x-0.5 duration-150"
            >
              <span>View Details</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                type="button"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                title="Fullscreen presentation"
              >
                <span>Full Screen ⛶</span>
              </button>

              {exam.dateStatus !== 'not_announced' && !countdown.isPast && (
                <button
                  onClick={handleCal}
                  type="button"
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                  title="Download .ICS calendar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>.ICS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Mode (Mounted directly to body via portal to prevent parent overflow/transform clipping) */}
      {isFullscreen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex flex-col justify-between p-6 sm:p-12 bg-white dark:bg-[#0E1017] transition-all overflow-y-auto w-screen h-screen">
          {/* Top Bar */}
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {exam.category.replace(/-/g, ' ')}
              </span>
              {exam.dateStatus === 'official' && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#D4FF4F] text-[#111406] shadow-xs">
                  Official Schedule
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={`/exams/${exam.slug}/`}
                className="px-3.5 py-2 rounded-full font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all flex items-center gap-1.5 shadow-xs"
                title="Open detailed exam countdown and syllabus"
              >
                <span>Full Exam Page</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

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
          </div>

          {/* Center Main Countdown Stage */}
          <div className="text-center my-auto py-8 w-full max-w-5xl mx-auto">
            <p className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              {exam.conductingAuthority}
            </p>
            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
              {exam.name}
            </h2>
            <p className="text-sm sm:text-lg font-bold text-slate-600 dark:text-slate-300 mb-10">
              Exam Date: <strong className="text-slate-900 dark:text-white">{countdown.formattedTargetDate}</strong>
              {exam.startTime && ` · ${exam.startTime} IST`}
            </p>

            {/* Giant Digits Display */}
            {showCountdown ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
                <div className="p-6 sm:p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl text-slate-900 dark:text-white block leading-none">
                    {countdown.days}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-400 mt-3 block">Days Left</span>
                </div>
                <div className="p-6 sm:p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl text-slate-900 dark:text-white block leading-none">
                    {countdown.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-400 mt-3 block">Hours</span>
                </div>
                <div className="p-6 sm:p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl text-slate-900 dark:text-white block leading-none">
                    {countdown.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-400 mt-3 block">Minutes</span>
                </div>
                <div className="p-6 sm:p-8 rounded-[24px] bg-[#D4FF4F] text-[#111406] shadow-md">
                  <span className="font-mono-digits font-black text-5xl sm:text-7xl md:text-8xl block leading-none">
                    {countdown.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs sm:text-sm uppercase font-extrabold tracking-widest text-[#111406]/80 mt-3 block">Seconds</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-[24px] bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {countdown.isPast ? '✓ Examination Cycle Completed' : 'Awaiting Official Notification'}
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 w-full max-w-5xl mx-auto pt-6 border-t border-black/[0.05] dark:border-white/[0.05]">
            <span>Tip: Press <kbd className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">Esc</kbd> anytime to exit Fullscreen</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">IndianTimers · Verified Schedule Focus Suite</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
