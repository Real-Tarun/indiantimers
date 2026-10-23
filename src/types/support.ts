export type DonationStatus = 'pending' | 'approved' | 'rejected';

export interface SupporterRecord {
  id: string;
  name: string;
  amount: number;
  utr: string; // 12-digit transaction ID or reference
  email?: string;
  phone?: string;
  message?: string;
  isAnonymous?: boolean;
  status: DonationStatus;
  createdAt: string; // ISO 8601 string
  approvedAt?: string;
  adminNote?: string;
  rank?: number;
}

export interface LeaderboardStats {
  totalRaised: number;
  totalSupporters: number;
  lastUpdated: string;
  updateInterval: string;
  monthlyGoal: number;
}

export interface LeaderboardResponse {
  top5: SupporterRecord[];
  allSupporters: SupporterRecord[];
  stats: LeaderboardStats;
}

export interface DonationSubmissionInput {
  name: string;
  amount: number;
  utr: string;
  email?: string;
  phone?: string;
  message?: string;
  isAnonymous?: boolean;
}
