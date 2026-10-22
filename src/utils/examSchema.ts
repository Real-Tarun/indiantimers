import type { ExamRecord } from '../types/exam';

/**
 * Generates Google Search Console compliant JSON-LD structured data for an Exam page.
 * Includes complete Event schema addressing all required and recommended fields:
 * - description
 * - image
 * - performer
 * - offers
 * - eventAttendanceMode
 * - eventStatus
 * - location & organizer
 */
export function getExamJsonLd(exam: ExamRecord, siteUrl: string) {
  const eventStatusMap: Record<string, string> = {
    official: 'https://schema.org/EventScheduled',
    tentative: 'https://schema.org/EventScheduled',
    expected: 'https://schema.org/EventScheduled',
    postponed: 'https://schema.org/EventPostponed',
    rescheduled: 'https://schema.org/EventRescheduled',
    cancelled: 'https://schema.org/EventCancelled',
    completed: 'https://schema.org/EventScheduled',
  };

  const eventStatus = eventStatusMap[exam.dateStatus] || 'https://schema.org/EventScheduled';

  const eventDescription =
    exam.shortDescription ||
    exam.detailedOverview ||
    `Official examination schedule, verified dates, live countdown, and conducting authority notification details for ${exam.name}.`;

  const eventStartDate = exam.startTime
    ? `${exam.dates.examDate}T${exam.startTime}:00+05:30`
    : exam.dates.examDate;

  const eventEndDate = exam.endTime
    ? `${exam.dates.examEndDate || exam.dates.examDate}T${exam.endTime}:00+05:30`
    : (exam.dates.examEndDate || exam.dates.examDate);

  const eventImages = [
    `${siteUrl}/og-image.png`,
    `${siteUrl}/logo-512.png`,
  ];

  const authorityName = exam.conductingAuthority || 'National Examination Authority';
  const authorityUrl = exam.officialWebsite || exam.officialSourceUrl || `${siteUrl}/exams/${exam.slug}/`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${exam.name} Countdown & Schedule`,
    description: exam.shortDescription || eventDescription,
    url: `${siteUrl}/exams/${exam.slug}/`,
    publisher: {
      '@type': 'Organization',
      name: 'IndianTimers',
      url: siteUrl,
      logo: `${siteUrl}/logo-512.png`,
    },
    mainEntity: {
      '@type': 'Event',
      name: exam.name,
      description: eventDescription,
      image: eventImages,
      startDate: eventStartDate,
      endDate: eventEndDate,
      eventStatus,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      organizer: {
        '@type': 'Organization',
        name: authorityName,
        url: authorityUrl,
      },
      performer: {
        '@type': 'Organization',
        name: authorityName,
        url: authorityUrl,
      },
      location: {
        '@type': 'Place',
        name: 'Designated Examination Centres across India',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IN',
        },
      },
      offers: {
        '@type': 'Offer',
        name: `${exam.shortName} Application & Examination Registration`,
        url: authorityUrl,
        price: '0',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        ...(exam.dates.registrationStart ? { validFrom: exam.dates.registrationStart } : {}),
      },
    },
  };
}
