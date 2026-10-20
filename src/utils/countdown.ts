import type { DateStatus } from '../types/exam';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
  isToday: boolean;
  hasExactTime: boolean;
  status: DateStatus;
  formattedTargetDate: string;
  statusLabel: string;
}

/**
 * Parses target date and optional time string safely with IST/Kolkata timezone support.
 * Never throws on malformed input; returns null.
 */
export function getTargetTimestamp(dateStr: string, timeStr?: string, _timezone: string = 'Asia/Kolkata'): number | null {
  if (!dateStr) return null;

  try {
    // If dateStr contains full ISO or time
    if (dateStr.includes('T')) {
      const parsed = new Date(dateStr).getTime();
      return isNaN(parsed) ? null : parsed;
    }

    // Date-only: YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return null;

    let hour = 0;
    let minute = 0;

    if (timeStr && timeStr.includes(':')) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!isNaN(h)) hour = h;
      if (!isNaN(m)) minute = m;
    }

    // Force IST (+05:30) offset representation in UTC timestamp
    // IST is UTC + 5h 30m = 330 minutes
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const utcDate = Date.UTC(year, month - 1, day, hour, minute, 0);
    return utcDate - istOffsetMs;
  } catch {
    return null;
  }
}

/**
 * Calculates countdown from now to target timestamp with zero drift,
 * checking against absolute Date.now().
 */
export function calculateCountdown(
  dateStr: string,
  timeStr?: string,
  status: DateStatus = 'official',
  timezone: string = 'Asia/Kolkata',
  nowMs: number = Date.now()
): CountdownResult {
  const targetMs = getTargetTimestamp(dateStr, timeStr, timezone);

  const statusLabels: Record<DateStatus, string> = {
    official: 'Official Confirmed',
    tentative: 'Tentative (Official Calendar)',
    expected: 'Expected Schedule',
    not_announced: 'Date Not Announced',
    postponed: 'Officially Postponed',
    rescheduled: 'Rescheduled',
    completed: 'Concluded',
    cancelled: 'Cancelled',
  };

  let formattedDate = dateStr;
  try {
    const d = new Date(dateStr);
    formattedDate = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    // fallback
  }

  if (!targetMs || status === 'not_announced' || status === 'cancelled') {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isPast: false,
      isToday: false,
      hasExactTime: Boolean(timeStr),
      status,
      formattedTargetDate: formattedDate,
      statusLabel: statusLabels[status] || 'Unknown',
    };
  }

  const diffMs = targetMs - nowMs;
  const totalSeconds = Math.floor(diffMs / 1000);
  const isPast = totalSeconds <= 0;

  if (isPast) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isPast: true,
      isToday: Math.abs(diffMs) < 24 * 60 * 60 * 1000,
      hasExactTime: Boolean(timeStr),
      status: status === 'official' || status === 'tentative' ? 'completed' : status,
      formattedTargetDate: formattedDate,
      statusLabel: 'Concluded',
    };
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isPast: false,
    isToday: days === 0,
    hasExactTime: Boolean(timeStr),
    status,
    formattedTargetDate: formattedDate,
    statusLabel: statusLabels[status] || 'Active',
  };
}

/**
 * Formats a short friendly display (e.g., "128d 4h 12m" or "Today!")
 */
export function formatCountdownShort(result: CountdownResult): string {
  if (result.status === 'not_announced') return 'Date TBA';
  if (result.status === 'postponed') return 'Postponed';
  if (result.isPast) return 'Concluded';
  if (result.days > 0) {
    return `${result.days}d ${result.hours}h ${result.minutes}m`;
  }
  return `${result.hours}h ${result.minutes}m ${result.seconds}s`;
}
