import type { PersonalCountdownItem, StudySessionLog } from '../types/exam';

const STORAGE_KEYS = {
  FAVORITES: 'indiantimers_favorites',
  CUSTOM_COUNTDOWNS: 'indiantimers_custom_countdowns',
  STUDY_SESSIONS: 'indiantimers_study_sessions',
  THEME: 'indiantimers_theme',
  POMODORO_PREFS: 'indiantimers_pomodoro_prefs',
};

export const storageService = {
  // --- Favorites ---
  getFavorites(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : ['neet-ug-2027', 'jee-main-2027-session-1', 'upsc-cse-prelims-2027'];
    } catch {
      return [];
    }
  },

  isFavorite(examId: string): boolean {
    return this.getFavorites().includes(examId);
  },

  toggleFavorite(examId: string): boolean {
    if (typeof window === 'undefined') return false;
    const current = this.getFavorites();
    const exists = current.includes(examId);
    let updated: string[];
    if (exists) {
      updated = current.filter((id) => id !== examId);
    } else {
      updated = [...current, examId];
    }
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('indiantimers:favorites-updated', { detail: updated }));
    } catch {
      // storage blocked
    }
    return !exists;
  },

  // --- Custom Personal Deadlines ---
  getCustomCountdowns(): PersonalCountdownItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomCountdown(item: Omit<PersonalCountdownItem, 'id' | 'createdAt'>): PersonalCountdownItem {
    const list = this.getCustomCountdowns();
    const newItem: PersonalCountdownItem = {
      ...item,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newItem);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('indiantimers:custom-updated'));
    }
    return newItem;
  },

  deleteCustomCountdown(id: string) {
    if (typeof window === 'undefined') return;
    const list = this.getCustomCountdowns().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('indiantimers:custom-updated'));
  },

  // --- Study Sessions History ---
  getStudySessions(): StudySessionLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  logStudySession(session: Omit<StudySessionLog, 'id' | 'timestamp' | 'date'>) {
    if (typeof window === 'undefined') return;
    const list = this.getStudySessions();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newLog: StudySessionLog = {
      ...session,
      id: `log_${Date.now()}`,
      date: dateStr,
      timestamp: Date.now(),
    };

    list.unshift(newLog);
    // keep max 200 logs
    const trimmed = list.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('indiantimers:sessions-updated'));
  },

  getWeeklyFocusMinutes(): number {
    const sessions = this.getStudySessions();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions
      .filter((s) => s.timestamp >= oneWeekAgo)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
  },

  getTodayFocusMinutes(): number {
    const today = new Date().toISOString().split('T')[0];
    const sessions = this.getStudySessions();
    return sessions
      .filter((s) => s.date === today)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
  },

  // --- Data Export & Privacy Clear ---
  exportAllUserData(): string {
    const payload = {
      favorites: this.getFavorites(),
      customCountdowns: this.getCustomCountdowns(),
      studySessions: this.getStudySessions(),
      exportTimestamp: new Date().toISOString(),
      platform: 'IndianTimers',
    };
    return JSON.stringify(payload, null, 2);
  },

  clearAllData() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS);
    localStorage.removeItem(STORAGE_KEYS.STUDY_SESSIONS);
    window.dispatchEvent(new CustomEvent('indiantimers:favorites-updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('indiantimers:custom-updated'));
    window.dispatchEvent(new CustomEvent('indiantimers:sessions-updated'));
  },
};
