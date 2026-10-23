export interface ClickEventPayload {
  channel: 'whatsapp' | 'telegram';
  placement?: string;
  page?: string;
  isUnique?: boolean;
  timestamp?: string;
}

export interface CommunityClickStats {
  whatsapp: {
    totalClicks: number;
    uniqueUsers: number;
    placements: Record<string, number>;
  };
  telegram: {
    totalClicks: number;
    uniqueUsers: number;
    placements: Record<string, number>;
  };
  daily: Array<{
    date: string; // YYYY-MM-DD
    whatsapp: number;
    telegram: number;
    uniqueUsers: number;
  }>;
  recentClicks: Array<{
    id: string;
    channel: 'whatsapp' | 'telegram';
    placement: string;
    page: string;
    timestamp: string;
    isUnique: boolean;
  }>;
}

const STORAGE_KEY = 'it_community_click_stats_v1';

// Seed baseline metrics for demonstration if zero stored
const INITIAL_STATS: CommunityClickStats = {
  whatsapp: {
    totalClicks: 0,
    uniqueUsers: 0,
    placements: {
      header: 0,
      footer: 0,
      exam_detail: 0,
      homepage: 0,
    },
  },
  telegram: {
    totalClicks: 0,
    uniqueUsers: 0,
    placements: {
      header: 0,
      footer: 0,
      exam_detail: 0,
      homepage: 0,
    },
  },
  daily: [],
  recentClicks: [],
};

class CommunityClicksManager {
  private stats: CommunityClickStats;

  constructor() {
    this.stats = this.loadStats();
  }

  private loadStats(): CommunityClickStats {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.stats ? this.stats : JSON.parse(JSON.stringify(INITIAL_STATS));
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(INITIAL_STATS));
      const parsed = JSON.parse(raw);
      return {
        whatsapp: {
          totalClicks: parsed.whatsapp?.totalClicks || 0,
          uniqueUsers: parsed.whatsapp?.uniqueUsers || 0,
          placements: parsed.whatsapp?.placements || { header: 0, footer: 0, exam_detail: 0, homepage: 0 },
        },
        telegram: {
          totalClicks: parsed.telegram?.totalClicks || 0,
          uniqueUsers: parsed.telegram?.uniqueUsers || 0,
          placements: parsed.telegram?.placements || { header: 0, footer: 0, exam_detail: 0, homepage: 0 },
        },
        daily: Array.isArray(parsed.daily) ? parsed.daily : [],
        recentClicks: Array.isArray(parsed.recentClicks) ? parsed.recentClicks : [],
      };
    } catch {
      return JSON.parse(JSON.stringify(INITIAL_STATS));
    }
  }

  private saveStats(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Ignore quota storage exceptions
    }
  }

  public getStats(): CommunityClickStats {
    this.stats = this.loadStats();
    return JSON.parse(JSON.stringify(this.stats));
  }

  public mergeServerStats(serverStats: any): void {
    if (!serverStats) return;
    this.stats = this.loadStats();

    if (serverStats.whatsapp) {
      this.stats.whatsapp.totalClicks = Math.max(this.stats.whatsapp.totalClicks, serverStats.whatsapp.totalClicks || 0);
      this.stats.whatsapp.uniqueUsers = Math.max(this.stats.whatsapp.uniqueUsers, serverStats.whatsapp.uniqueUsers || 0);
      if (serverStats.whatsapp.placements) {
        for (const [k, v] of Object.entries(serverStats.whatsapp.placements)) {
          this.stats.whatsapp.placements[k] = Math.max(this.stats.whatsapp.placements[k] || 0, Number(v) || 0);
        }
      }
    }

    if (serverStats.telegram) {
      this.stats.telegram.totalClicks = Math.max(this.stats.telegram.totalClicks, serverStats.telegram.totalClicks || 0);
      this.stats.telegram.uniqueUsers = Math.max(this.stats.telegram.uniqueUsers, serverStats.telegram.uniqueUsers || 0);
      if (serverStats.telegram.placements) {
        for (const [k, v] of Object.entries(serverStats.telegram.placements)) {
          this.stats.telegram.placements[k] = Math.max(this.stats.telegram.placements[k] || 0, Number(v) || 0);
        }
      }
    }

    if (Array.isArray(serverStats.recentClicks) && serverStats.recentClicks.length > 0) {
      const existingIds = new Set(this.stats.recentClicks.map((r) => r.id));
      for (const rc of serverStats.recentClicks) {
        if (!existingIds.has(rc.id)) {
          this.stats.recentClicks.unshift(rc);
          existingIds.add(rc.id);
        }
      }
      this.stats.recentClicks.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (this.stats.recentClicks.length > 50) {
        this.stats.recentClicks = this.stats.recentClicks.slice(0, 50);
      }
    }

    this.saveStats();
  }

  public recordClick(payload: ClickEventPayload): void {
    const channel = payload.channel;
    if (channel !== 'whatsapp' && channel !== 'telegram') return;

    this.stats = this.loadStats();

    const placement = payload.placement || 'general';
    const isUnique = !!payload.isUnique;
    const page = payload.page || '/';
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Increment channel totals
    this.stats[channel].totalClicks++;
    if (isUnique) {
      this.stats[channel].uniqueUsers++;
    }

    // Increment placement
    if (!this.stats[channel].placements[placement]) {
      this.stats[channel].placements[placement] = 0;
    }
    this.stats[channel].placements[placement]++;

    // Daily breakdown
    let dayEntry = this.stats.daily.find((d) => d.date === today);
    if (!dayEntry) {
      dayEntry = { date: today, whatsapp: 0, telegram: 0, uniqueUsers: 0 };
      this.stats.daily.push(dayEntry);
    }
    dayEntry[channel]++;
    if (isUnique) {
      dayEntry.uniqueUsers++;
    }

    // Keep only last 14 days
    if (this.stats.daily.length > 14) {
      this.stats.daily.sort((a, b) => a.date.localeCompare(b.date));
      this.stats.daily = this.stats.daily.slice(-14);
    }

    // Recent clicks stream (capped at 50)
    this.stats.recentClicks.unshift({
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channel,
      placement,
      page,
      timestamp: now.toISOString(),
      isUnique,
    });
    if (this.stats.recentClicks.length > 50) {
      this.stats.recentClicks.pop();
    }

    this.saveStats();
  }

  public resetStats(): void {
    this.stats = JSON.parse(JSON.stringify(INITIAL_STATS));
    this.saveStats();
  }
}

export const communityClicksManager = new CommunityClicksManager();

