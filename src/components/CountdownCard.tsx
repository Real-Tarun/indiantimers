import React, { useState, useEffect } from 'react';
import type { ExamRecord } from '../types/exam';
import { calculateCountdown, type CountdownResult } from '../utils/countdown';
import { storageService } from '../utils/storage';
import { downloadICS, getGoogleCalendarUrl } from '../utils/calendar';
import { siteConfig } from '../config/site';
import { Bookmark, BookmarkCheck, Calendar, ExternalLink, Share2, Check } from 'lucide-react';

interface Props {
  exam: ExamRecord;
  compact?: boolean;
}

export default function CountdownCard({ exam, compact = false }: Props) {
  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    calculateCountdown(exam.dates.examDate, exam.startTime, exam.dateStatus, exam.timezone)
  );
  const [isFav, setIsFav] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setIsFav(storageService.isFavorite(exam.id));

    const handleFavChange = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail) {
        setIsFav(customEvent.detail.includes(exam.id));
      }
    };

    window.addEventListener('indiantimers:favorites-updated', handleFavChange);

    const timer = setInterval(() => {
      setCountdown(calculateCountdown(exam.dates.examDate, exam.startTime, exam.dateStatus, exam.timezone));
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('indiantimers:favorites-updated', handleFavChange);
    };
  }, [exam]);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = storageService.toggleFavorite(exam.id);
    setIsFav(newState);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${siteConfig.url}/exams/${exam.slug}/`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${exam.shortName} Countdown | IndianTimers`,
          text: `Countdown to ${exam.shortName} (${countdown.formattedTargetDate}): ${countdown.days} days left.`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked
    }
  };

  const handleCalendarDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadICS(exam, siteConfig.url);
  };

  // Status badge styling
  const statusBadge = () => {
    switch (exam.dateStatus) {
      case 'official':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Official Confirmed
          </span>
        );
      case 'tentative':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Tentative Schedule
          </span>
        );
      case 'not_announced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Date Not Announced
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {countdown.statusLabel}
          </span>
        );
    }
  };

  return (
    <div className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Top Bar: Authority + Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={exam.conductingAuthority}>
            {exam.conductingAuthority}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors"
              title="Share countdown link"
              aria-label="Share countdown"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleToggleFav}
              type="button"
              className={`p-1.5 rounded-md transition-colors ${
                isFav
                  ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={isFav ? 'Remove from favorites' : 'Save to favorites'}
              aria-label="Toggle favorite"
            >
              {isFav ? <BookmarkCheck className="w-4 h-4 fill-amber-500/20" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1">
          <a href={`/exams/${exam.slug}/`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {exam.shortName}
          </a>
        </h3>

        {/* Target Date & Status */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {countdown.formattedTargetDate}
            {exam.startTime && ` • ${exam.startTime} IST`}
          </span>
          {statusBadge()}
        </div>

        {/* Countdown Digits */}
        {exam.dateStatus !== 'not_announced' && !countdown.isPast ? (
          <div className="grid grid-cols-4 gap-1.5 py-3 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center mb-4">
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-tabular leading-none">
                {countdown.days}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mt-1">
                Days
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-tabular leading-none">
                {countdown.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mt-1">
                Hours
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-tabular leading-none">
                {countdown.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mt-1">
                Mins
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-tabular leading-none">
                {countdown.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mt-1">
                Secs
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center mb-4 text-xs text-slate-500 dark:text-slate-400">
            {countdown.isPast
              ? 'This examination cycle has concluded.'
              : 'Official dates awaiting conducting body notification.'}
          </div>
        )}
      </div>

      {/* Footer link & quick calendar add */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <a
          href={`/exams/${exam.slug}/`}
          className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View Details & Prep
        </a>
        <div className="flex items-center gap-2">
          {exam.dateStatus !== 'not_announced' && !countdown.isPast && (
            <button
              onClick={handleCalendarDownload}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              title="Add to Calendar (.ics)"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>.ICS</span>
            </button>
          )}
          <a
            href={exam.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Official Source Announcement"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
