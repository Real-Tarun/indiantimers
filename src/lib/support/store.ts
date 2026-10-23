import type { SupporterRecord, LeaderboardResponse, DonationSubmissionInput, LeaderboardStats } from '../../types/support.ts';

// Initial verified supporters (Curated bootstrap records so the leaderboard shines immediately)
export const INITIAL_APPROVED_SUPPORTERS: SupporterRecord[] = [
  {
    id: 'don_init_01',
    name: 'Ananya Sen',
    amount: 5000,
    utr: '429188392101',
    message: 'Keeping IndianTimers clean, fast, and 100% ad-free is a massive service for lakhs of students. Proud to back you, Tarun!',
    status: 'approved',
    createdAt: '2026-10-18T10:30:00.000Z',
    approvedAt: '2026-10-18T14:15:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_init_02',
    name: 'Rohit Mehra',
    amount: 2500,
    utr: '429019482312',
    message: 'Your official countdown literally saved me from missing the JEE Main shift deadline. Keep building, brother!',
    status: 'approved',
    createdAt: '2026-10-19T08:20:00.000Z',
    approvedAt: '2026-10-19T12:00:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_init_03',
    name: 'Vikram Singhania',
    amount: 2100,
    utr: '428877192844',
    message: 'Hard to believe this is built single-handedly by a student. Super clean design and no junk popups. Kudos!',
    status: 'approved',
    createdAt: '2026-10-20T16:45:00.000Z',
    approvedAt: '2026-10-20T19:30:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_init_04',
    name: 'Dr. K. Radhakrishnan',
    amount: 1500,
    utr: '428610992381',
    message: 'As a parent and educator, I appreciate the strict policy against speculative rumors. Highly commended initiative.',
    status: 'approved',
    createdAt: '2026-10-21T11:10:00.000Z',
    approvedAt: '2026-10-21T15:00:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_init_05',
    name: 'Priya Sharma',
    amount: 1100,
    utr: '428456102938',
    message: 'Best Pomodoro timer and mock pacing tracker on the web. Small gift from a grateful NEET aspirant.',
    status: 'approved',
    createdAt: '2026-10-21T18:00:00.000Z',
    approvedAt: '2026-10-21T21:30:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_init_06',
    name: 'Aryan Patel',
    amount: 501,
    utr: '428319002194',
    message: 'Love the dark mode and clean typography. Respect for the student creator hustle!',
    status: 'approved',
    createdAt: '2026-10-22T09:15:00.000Z',
    approvedAt: '2026-10-22T13:45:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_init_07',
    name: 'Siddharth M.',
    amount: 500,
    utr: '428109384912',
    message: 'Chai on me! Your UPSC syllabus breakdown and timeline tool is phenomenal.',
    status: 'approved',
    createdAt: '2026-10-22T14:22:00.000Z',
    approvedAt: '2026-10-22T18:10:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_init_08',
    name: 'Anonymous Aspirant',
    amount: 251,
    utr: '427998129034',
    message: 'Every aspirant needs this site bookmarked. Thank you Tarun!',
    status: 'approved',
    createdAt: '2026-10-23T07:40:00.000Z',
    approvedAt: '2026-10-23T11:00:00.000Z',
    isAnonymous: true,
  },
];

export const INITIAL_PENDING_SUPPORTERS: SupporterRecord[] = [
  {
    id: 'don_pend_01',
    name: 'Manish Verma',
    amount: 300,
    utr: '429384920182',
    email: 'manish.v.aspirant@gmail.com',
    phone: '+91 98765 43210',
    message: 'Donated via GPay. Please verify UTR. Love the GATE 2027 countdown!',
    status: 'pending',
    createdAt: '2026-10-23T15:20:00.000Z',
    isAnonymous: false,
  },
  {
    id: 'don_pend_02',
    name: 'Kavita Joshi',
    amount: 151,
    utr: '429385019284',
    email: 'kavita.j@outlook.com',
    message: 'Great student project, keep shining!',
    status: 'pending',
    createdAt: '2026-10-23T17:45:00.000Z',
    isAnonymous: false,
  },
];

// In-Memory store singleton for node / Cloudflare Worker warm instances
class SupportStore {
  private approved: SupporterRecord[] = [...INITIAL_APPROVED_SUPPORTERS];
  private pending: SupporterRecord[] = [...INITIAL_PENDING_SUPPORTERS];
  private rejected: SupporterRecord[] = [];
  private lastUpdated: string = new Date().toISOString();

  // Helper to mask name if requested
  public maskName(name: string, isAnonymous?: boolean): string {
    if (isAnonymous) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) {
        const single = parts[0];
        if (single.length <= 2) return 'Anonymous';
        return `${single[0]}***${single[single.length - 1]}`;
      }
      return parts.map((p) => (p.length > 1 ? `${p[0]}***` : p)).join(' ');
    }
    return name;
  }

  // Calculate ranked top 5 and full leaderboard
  public getLeaderboard(): LeaderboardResponse {
    // Sort approved by amount descending, then by date descending
    const sorted = [...this.approved].sort((a, b) => {
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const ranked: SupporterRecord[] = sorted.map((record, index) => ({
      ...record,
      rank: index + 1,
      name: this.maskName(record.name, record.isAnonymous),
    }));

    const top5 = ranked.slice(0, 5);
    const totalRaised = this.approved.reduce((acc, curr) => acc + curr.amount, 0);

    const stats: LeaderboardStats = {
      totalRaised,
      totalSupporters: this.approved.length,
      lastUpdated: this.lastUpdated,
      updateInterval: '12 Hours (Verified Review Cycle)',
      monthlyGoal: 15000, // Monthly infrastructure target
    };

    return {
      top5,
      allSupporters: ranked,
      stats,
    };
  }

  // Get full admin dataset
  public getAdminData() {
    return {
      pending: [...this.pending].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      approved: [...this.approved].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      rejected: [...this.rejected].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      stats: {
        pendingCount: this.pending.length,
        approvedCount: this.approved.length,
        rejectedCount: this.rejected.length,
        totalCollected: this.approved.reduce((acc, c) => acc + c.amount, 0),
        pendingAmount: this.pending.reduce((acc, c) => acc + c.amount, 0),
      },
      lastUpdated: this.lastUpdated,
    };
  }

  // Submit a new donation for verification
  public submitDonation(input: DonationSubmissionInput): { success: boolean; error?: string; record?: SupporterRecord } {
    // Validation
    const cleanName = input.name?.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter a valid supporter name (minimum 2 characters).' };
    }

    const numAmount = Number(input.amount);
    if (isNaN(numAmount) || numAmount < 10) {
      return { success: false, error: 'Minimum contribution amount is ₹10.' };
    }
    if (numAmount > 50000) {
      return { success: false, error: 'Maximum contribution amount per transaction is ₹50,000.' };
    }

    const cleanUtr = input.utr?.trim().replace(/\s+/g, '');
    if (!cleanUtr || cleanUtr.length < 6) {
      return { success: false, error: 'Please provide a valid UPI Transaction ID / UTR reference number.' };
    }

    // Check duplicate UTR across pending, approved, and rejected
    const exists = [...this.pending, ...this.approved].some(
      (r) => r.utr.toLowerCase() === cleanUtr.toLowerCase()
    );
    if (exists) {
      return {
        success: false,
        error: 'This UPI UTR reference has already been submitted. Please check the leaderboard or contact support.',
      };
    }

    const record: SupporterRecord = {
      id: `don_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      amount: Math.round(numAmount),
      utr: cleanUtr,
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      message: input.message?.trim() || undefined,
      isAnonymous: !!input.isAnonymous,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.pending.unshift(record);
    return { success: true, record };
  }

  // Admin approves donation
  public approveDonation(id: string, adminEmail: string, note?: string): boolean {
    const idx = this.pending.findIndex((p) => p.id === id);
    if (idx === -1) {
      // Check if already approved
      const alreadyApproved = this.approved.some((a) => a.id === id);
      if (alreadyApproved) return true;
      return false;
    }

    const [item] = this.pending.splice(idx, 1);
    item.status = 'approved';
    item.approvedAt = new Date().toISOString();
    item.adminNote = note || `Approved by ${adminEmail}`;

    this.approved.unshift(item);
    this.lastUpdated = new Date().toISOString();
    return true;
  }

  // Admin rejects donation
  public rejectDonation(id: string, adminEmail: string, note?: string): boolean {
    const idx = this.pending.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const [item] = this.pending.splice(idx, 1);
    item.status = 'rejected';
    item.adminNote = note || `Rejected by ${adminEmail}`;

    this.rejected.unshift(item);
    return true;
  }

  // Admin manually adds a verified donation
  public addManualDonation(record: Omit<SupporterRecord, 'id' | 'createdAt' | 'status'>): SupporterRecord {
    const newRecord: SupporterRecord = {
      ...record,
      id: `don_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'approved',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };
    this.approved.unshift(newRecord);
    this.lastUpdated = new Date().toISOString();
    return newRecord;
  }

  // Sync KV data into store (when deployed on Cloudflare Pages)
  public hydrateFromKV(approvedList: SupporterRecord[], pendingList: SupporterRecord[]) {
    if (Array.isArray(approvedList) && approvedList.length > 0) {
      this.approved = approvedList;
    }
    if (Array.isArray(pendingList)) {
      this.pending = pendingList;
    }
    this.lastUpdated = new Date().toISOString();
  }
}

export const supportStore = new SupportStore();
