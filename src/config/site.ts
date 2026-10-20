export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string; // Configurable production domain; can be overridden via import.meta.env.SITE_URL
  defaultTimezone: string;
  author: {
    name: string;
    website: string;
  };
  links: {
    privacy: string;
    terms: string;
    editorialPolicy: string;
    contact: string;
    about: string;
  };
  navigation: Array<{
    name: string;
    href: string;
    badge?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
  }>;
}

const siteUrl = (typeof process !== 'undefined' && process.env?.SITE_URL)
  ? process.env.SITE_URL.replace(/\/$/, '')
  : 'https://indiantimers.com';

export const siteConfig: SiteConfig = {
  name: 'IndianTimers',
  tagline: "India's Premier Exam Countdown & Student Focus Platform",
  description: "Accurate live countdowns, verified official dates, and precision study timers for NEET, JEE, UPSC, GATE, CBSE, CUET, and Indian competitive examinations.",
  url: siteUrl,
  defaultTimezone: 'Asia/Kolkata',
  author: {
    name: 'IndianTimers Editorial & Verification Team',
    website: siteUrl,
  },
  links: {
    privacy: '/privacy-policy/',
    terms: '/terms/',
    editorialPolicy: '/editorial-policy/',
    contact: '/contact/',
    about: '/about/',
  },
  navigation: [
    { name: 'Home', href: '/' },
    { name: 'All Exams', href: '/exams/' },
    { name: '2027 Calendar', href: '/calendar/2027/', badge: 'Official' },
    { name: 'Timers', href: '/tools/pomodoro-timer/' },
    { name: 'Mock Timer', href: '/tools/mock-test-timer/' },
    { name: 'Dashboard', href: '/dashboard/' },
    { name: 'Guides', href: '/blog/' },
  ],
  categories: [
    {
      id: 'medical',
      name: 'Medical Entrance',
      slug: 'medical',
      description: 'NEET UG, NEET PG, INI-CET, AIIMS nursing and medical admissions.',
      icon: 'Stethoscope',
    },
    {
      id: 'engineering',
      name: 'Engineering Entrance',
      slug: 'engineering',
      description: 'JEE Main, JEE Advanced, GATE, BITSAT, VITEEE, and State CETs.',
      icon: 'Compass',
    },
    {
      id: 'board-exams',
      name: 'Board Exams',
      slug: 'board-exams',
      description: 'CBSE Class 10 & 12, ICSE, ISC, and major State Boards.',
      icon: 'GraduationCap',
    },
    {
      id: 'government',
      name: 'Government & Civil Services',
      slug: 'government',
      description: 'UPSC CSE, NDA, CDS, SSC CGL, RRB, and Banking examinations.',
      icon: 'Building2',
    },
    {
      id: 'law',
      name: 'Law Entrance',
      slug: 'law',
      description: 'CLAT UG & PG, AILET, SLAT, and State Law Entrance tests.',
      icon: 'Scale',
    },
    {
      id: 'management',
      name: 'Management (MBA)',
      slug: 'management',
      description: 'CAT, XAT, SNAP, NMAT, CMAT, and IIFT management entrances.',
      icon: 'Briefcase',
    },
    {
      id: 'other-entrance-exams',
      name: 'Other National Exams',
      slug: 'other-entrance-exams',
      description: 'CUET UG, NIFT, NID, UCEED, UGC NET, IELTS, and creative entrances.',
      icon: 'Sparkles',
    },
  ],
};
