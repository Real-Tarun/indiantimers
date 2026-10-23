import type { SupporterRecord, LeaderboardResponse, DonationSubmissionInput, LeaderboardStats } from '../../types/support.ts';

// Clean initial state for live production (No mock or test data)
export const INITIAL_APPROVED_SUPPORTERS: SupporterRecord[] = [];
export const INITIAL_PENDING_SUPPORTERS: SupporterRecord[] = [];

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
      updateInterval: 'Average 12 Hours',
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
