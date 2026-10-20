import type { ExamRecord } from '../types/exam';

/**
 * Formats date as YYYYMMDDTHHmmssZ for ICS
 */
function toICSDateTime(dateStr: string, timeStr?: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    return `${cleanDate}T090000Z`;
  }
  const [h, m] = timeStr.split(':');
  // convert IST approx to UTC for ICS standard
  const istHour = parseInt(h, 10);
  const istMin = parseInt(m, 10);
  let totalMin = istHour * 60 + istMin - 330; // - 5h 30m
  if (totalMin < 0) totalMin += 1440;
  const utcHour = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const utcMin = (totalMin % 60).toString().padStart(2, '0');

  return `${cleanDate}T${utcHour}${utcMin}00Z`;
}

/**
 * Generates an RFC 5545 compliant .ics file content
 */
export function generateICS(exam: ExamRecord, siteUrl: string): string {
  const dtStart = toICSDateTime(exam.dates.examDate, exam.startTime);
  const dtEnd = toICSDateTime(
    exam.dates.examEndDate || exam.dates.examDate,
    exam.endTime || exam.startTime ? '13:00' : '17:00'
  );
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const url = `${siteUrl}/exams/${exam.slug}/`;

  const description = [
    `Examination: ${exam.name}`,
    `Conducting Body: ${exam.conductingAuthority}`,
    `Date Status: ${exam.dateStatus.toUpperCase()}`,
    `Official Notification: ${exam.officialSourceUrl}`,
    `Verified Schedule: ${url}`,
  ].join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IndianTimers//Indian Examination Schedules//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:indiantimers-${exam.id}@indiantimers.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${exam.shortName} Examination`,
    `DESCRIPTION:${description}`,
    `URL:${url}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers browser download of .ics file
 */
export function downloadICS(exam: ExamRecord, siteUrl: string) {
  if (typeof window === 'undefined') return;
  const icsContent = generateICS(exam, siteUrl);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${exam.slug}-indiantimers.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Builds Google Calendar web intent URL
 */
export function getGoogleCalendarUrl(exam: ExamRecord, siteUrl: string): string {
  const dtStart = toICSDateTime(exam.dates.examDate, exam.startTime);
  const dtEnd = toICSDateTime(
    exam.dates.examEndDate || exam.dates.examDate,
    exam.endTime || '13:00'
  );
  const title = encodeURIComponent(`${exam.shortName} Examination`);
  const details = encodeURIComponent(
    `Examination: ${exam.name}\nStatus: ${exam.dateStatus}\nOfficial Portal: ${exam.officialWebsite}\nVerified on IndianTimers: ${siteUrl}/exams/${exam.slug}/`
  );
  const datesParam = `${dtStart}/${dtEnd}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=India`;
}
