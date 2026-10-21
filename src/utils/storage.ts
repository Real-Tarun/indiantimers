import type {
  PersonalCountdownItem,
  StudySessionLog,
  CockpitPreferences,
  UserDataBackup,
  ImportValidationResult,
} from '../types/exam.ts';
import { EXAM_REGISTRY } from '../data/exams.ts';

const SCHEMA_VERSION = 1;

const STORAGE_KEYS = {
  SCHEMA_VERSION: 'indiantimers_v1_schema_version',
  SAVED_EXAMS: 'indiantimers_v1_saved_exams',
  FAVORITES: 'indiantimers_v1_favourites',
  CUSTOM_COUNTDOWNS: 'indiantimers_v1_custom_countdowns',
  PREFERENCES: 'indiantimers_v1_preferences',
  STUDY_SESSIONS: 'indiantimers_v1_study_sessions',
  // Legacy keys for migration
  LEGACY_FAVORITES: 'indiantimers_favorites',
  LEGACY_CUSTOM: 'indiantimers_custom_countdowns',
  LEGACY_SESSIONS: 'indiantimers_study_sessions',
};

const DEFAULT_PREFERENCES: CockpitPreferences = {
  theme: 'light',
  countdownDisplay: 'expanded',
  dashboardSort: 'date_asc',
  timerSettings: {
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    soundEnabled: true,
    autoStartBreaks: false,
  },
};

const DEFAULT_FEATURED_EXAMS = [
  'neet-ug-2027',
  'jee-main-2027-session-1',
  'upsc-cse-prelims-2027',
  'gate-2027',
];

// Memory fallback if localStorage is unavailable / blocked
const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return memoryStore[key] || null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryStore[key] || null;
  }
}

function safeSetItem(key: string, value: string): void {
  memoryStore[key] = value;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage blocked or private browsing
  }
}

function safeRemoveItem(key: string): void {
  delete memoryStore[key];
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // storage blocked
  }
}

// Ensure legacy migration happens seamlessly on first initialization
function runLegacyMigration() {
  if (typeof window === 'undefined') return;
  try {
    const existingVersion = safeGetItem(STORAGE_KEYS.SCHEMA_VERSION);
    if (!existingVersion) {
      // Check legacy favorites
      const legacyFavs = safeGetItem(STORAGE_KEYS.LEGACY_FAVORITES);
      if (legacyFavs && !safeGetItem(STORAGE_KEYS.FAVORITES)) {
        safeSetItem(STORAGE_KEYS.FAVORITES, legacyFavs);
        safeSetItem(STORAGE_KEYS.SAVED_EXAMS, legacyFavs);
      }

      // Check legacy custom
      const legacyCustom = safeGetItem(STORAGE_KEYS.LEGACY_CUSTOM);
      if (legacyCustom && !safeGetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS)) {
        safeSetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, legacyCustom);
      }

      // Check legacy sessions
      const legacySessions = safeGetItem(STORAGE_KEYS.LEGACY_SESSIONS);
      if (legacySessions && !safeGetItem(STORAGE_KEYS.STUDY_SESSIONS)) {
        safeSetItem(STORAGE_KEYS.STUDY_SESSIONS, legacySessions);
      }

      safeSetItem(STORAGE_KEYS.SCHEMA_VERSION, String(SCHEMA_VERSION));
    }
  } catch {
    // Graceful no-op
  }
}

export const storageService = {
  // --- Saved Examinations (Cockpit Active Tracked Exams) ---
  getSavedExamIds(): string[] {
    runLegacyMigration();
    try {
      const data = safeGetItem(STORAGE_KEYS.SAVED_EXAMS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Validate IDs against registry
          return parsed.filter((id) => typeof id === 'string' && EXAM_REGISTRY.some((e) => e.id === id));
        }
      }
      // Default: Top national benchmark exams
      return DEFAULT_FEATURED_EXAMS;
    } catch {
      return DEFAULT_FEATURED_EXAMS;
    }
  },

  setSavedExamIds(ids: string[]): void {
    const validIds = ids.filter((id) => typeof id === 'string' && EXAM_REGISTRY.some((e) => e.id === id));
    safeSetItem(STORAGE_KEYS.SAVED_EXAMS, JSON.stringify(validIds));
    this.dispatchCockpitUpdate();
  },

  addSavedExam(examId: string): boolean {
    if (!EXAM_REGISTRY.some((e) => e.id === examId)) return false;
    const current = this.getSavedExamIds();
    if (current.includes(examId)) return false;
    const updated = [examId, ...current];
    this.setSavedExamIds(updated);
    return true;
  },

  removeSavedExam(examId: string): void {
    const current = this.getSavedExamIds();
    const updated = current.filter((id) => id !== examId);
    this.setSavedExamIds(updated);
  },

  reorderSavedExams(newOrderIds: string[]): void {
    this.setSavedExamIds(newOrderIds);
  },

  // --- Favourites ---
  getFavorites(): string[] {
    runLegacyMigration();
    try {
      const data = safeGetItem(STORAGE_KEYS.FAVORITES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((id) => typeof id === 'string');
        }
      }
      return ['neet-ug-2027', 'jee-main-2027-session-1', 'upsc-cse-prelims-2027'];
    } catch {
      return [];
    }
  },

  isFavorite(examId: string): boolean {
    return this.getFavorites().includes(examId);
  },

  toggleFavorite(examId: string): boolean {
    const current = this.getFavorites();
    const exists = current.includes(examId);
    let updated: string[];
    if (exists) {
      updated = current.filter((id) => id !== examId);
    } else {
      updated = [...current, examId];
      // If user favorites an exam, also ensure it's in saved exams
      const saved = this.getSavedExamIds();
      if (!saved.includes(examId)) {
        this.setSavedExamIds([examId, ...saved]);
      }
    }
    safeSetItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    safeSetItem(STORAGE_KEYS.LEGACY_FAVORITES, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('indiantimers:favorites-updated', { detail: updated }));
    }
    this.dispatchCockpitUpdate();
    return !exists;
  },

  // --- Custom Personal Deadlines & Mock Tests ---
  getCustomCountdowns(): PersonalCountdownItem[] {
    runLegacyMigration();
    try {
      const data = safeGetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item) => item && typeof item.title === 'string' && typeof item.targetDate === 'string'
          );
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  saveCustomCountdown(
    item: Omit<PersonalCountdownItem, 'id' | 'createdAt'>,
    existingId?: string
  ): PersonalCountdownItem {
    const list = this.getCustomCountdowns();
    const sanitizedTitle = (item.title || 'Untitled Target').trim().slice(0, 100);
    const sanitizedNotes = (item.notes || '').trim().slice(0, 500);

    if (existingId) {
      const index = list.findIndex((x) => x.id === existingId);
      if (index !== -1) {
        const updatedItem: PersonalCountdownItem = {
          ...list[index],
          title: sanitizedTitle,
          targetDate: item.targetDate,
          targetTime: item.targetTime,
          timezone: item.timezone || 'Asia/Kolkata',
          category: item.category || 'Personal Goal',
          notes: sanitizedNotes,
        };
        list[index] = updatedItem;
        safeSetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, JSON.stringify(list));
        safeSetItem(STORAGE_KEYS.LEGACY_CUSTOM, JSON.stringify(list));
        this.dispatchCockpitUpdate();
        return updatedItem;
      }
    }

    const newItem: PersonalCountdownItem = {
      ...item,
      title: sanitizedTitle,
      notes: sanitizedNotes,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newItem);
    safeSetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, JSON.stringify(list));
    safeSetItem(STORAGE_KEYS.LEGACY_CUSTOM, JSON.stringify(list));
    this.dispatchCockpitUpdate();
    return newItem;
  },

  deleteCustomCountdown(id: string): void {
    const list = this.getCustomCountdowns().filter((item) => item.id !== id);
    safeSetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, JSON.stringify(list));
    safeSetItem(STORAGE_KEYS.LEGACY_CUSTOM, JSON.stringify(list));
    this.dispatchCockpitUpdate();
  },

  // --- User Preferences ---
  getPreferences(): CockpitPreferences {
    try {
      const data = safeGetItem(STORAGE_KEYS.PREFERENCES);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          timerSettings: {
            ...DEFAULT_PREFERENCES.timerSettings,
            ...(parsed.timerSettings || {}),
          },
        };
      }
      return DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: Partial<CockpitPreferences>): CockpitPreferences {
    const current = this.getPreferences();
    const updated: CockpitPreferences = {
      ...current,
      ...prefs,
      timerSettings: {
        ...current.timerSettings,
        ...(prefs.timerSettings || {}),
      },
    };
    safeSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    this.dispatchCockpitUpdate();
    return updated;
  },

  // --- Study Sessions History ---
  getStudySessions(): StudySessionLog[] {
    runLegacyMigration();
    try {
      const data = safeGetItem(STORAGE_KEYS.STUDY_SESSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  },

  logStudySession(session: Omit<StudySessionLog, 'id' | 'timestamp' | 'date'>): void {
    const list = this.getStudySessions();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newLog: StudySessionLog = {
      ...session,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      timestamp: Date.now(),
    };

    list.unshift(newLog);
    // keep max 200 logs
    const trimmed = list.slice(0, 200);
    safeSetItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(trimmed));
    safeSetItem(STORAGE_KEYS.LEGACY_SESSIONS, JSON.stringify(trimmed));
    this.dispatchCockpitUpdate();
  },

  getWeeklyFocusMinutes(): number {
    const sessions = this.getStudySessions();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions
      .filter((s) => s.timestamp >= oneWeekAgo)
      .reduce((acc, curr) => acc + (Number(curr.durationMinutes) || 0), 0);
  },

  getTodayFocusMinutes(): number {
    const today = new Date().toISOString().split('T')[0];
    const sessions = this.getStudySessions();
    return sessions
      .filter((s) => s.date === today)
      .reduce((acc, curr) => acc + (Number(curr.durationMinutes) || 0), 0);
  },

  // --- Export Personal Data (Schema Version 1) ---
  exportAllUserData(): string {
    const backup: UserDataBackup = {
      app: 'IndianTimers',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        savedExamIds: this.getSavedExamIds(),
        favouriteExamIds: this.getFavorites(),
        customCountdowns: this.getCustomCountdowns(),
        preferences: this.getPreferences(),
        studySessions: this.getStudySessions(),
      },
    };
    return JSON.stringify(backup, null, 2);
  },

  // --- Import Personal Data (Validation & Application) ---
  validateBackup(jsonString: string): ImportValidationResult {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return {
          valid: false,
          error: 'Empty or invalid file payload provided.',
          counts: { savedExams: 0, favourites: 0, customCountdowns: 0, studySessions: 0 },
        };
      }

      // Check max payload size (1MB safety limit for JSON)
      if (jsonString.length > 1024 * 1024) {
        return {
          valid: false,
          error: 'File exceeds the maximum safe import size limit (1MB).',
          counts: { savedExams: 0, favourites: 0, customCountdowns: 0, studySessions: 0 },
        };
      }

      const parsed = JSON.parse(jsonString);

      // Support Schema Version 1
      if (parsed.app === 'IndianTimers' && parsed.schemaVersion === 1 && parsed.data) {
        const d = parsed.data;
        const validExamIds = (Array.isArray(d.savedExamIds) ? d.savedExamIds : []).filter(
          (id: unknown): id is string => typeof id === 'string' && EXAM_REGISTRY.some((e) => e.id === id)
        );
        const validFavIds = (Array.isArray(d.favouriteExamIds) ? d.favouriteExamIds : []).filter(
          (id: unknown): id is string => typeof id === 'string' && EXAM_REGISTRY.some((e) => e.id === id)
        );
        const validCustom = (Array.isArray(d.customCountdowns) ? d.customCountdowns : []).filter(
          (c: unknown): c is PersonalCountdownItem =>
            !!c &&
            typeof (c as PersonalCountdownItem).title === 'string' &&
            typeof (c as PersonalCountdownItem).targetDate === 'string' &&
            !isNaN(Date.parse((c as PersonalCountdownItem).targetDate))
        );
        const validSessions = (Array.isArray(d.studySessions) ? d.studySessions : []).filter(
          (s: unknown): s is StudySessionLog =>
            !!s &&
            typeof (s as StudySessionLog).durationMinutes === 'number' &&
            (s as StudySessionLog).durationMinutes > 0
        );

        return {
          valid: true,
          schemaVersion: 1,
          counts: {
            savedExams: validExamIds.length,
            favourites: validFavIds.length,
            customCountdowns: validCustom.length,
            studySessions: validSessions.length,
          },
          parsedData: {
            savedExamIds: validExamIds,
            favouriteExamIds: validFavIds,
            customCountdowns: validCustom,
            preferences: d.preferences || DEFAULT_PREFERENCES,
            studySessions: validSessions,
          },
        };
      }

      // Legacy fallback parser for older IndianTimers backup format
      if (parsed.platform === 'IndianTimers' || Array.isArray(parsed.favorites)) {
        const favs = (Array.isArray(parsed.favorites) ? parsed.favorites : []).filter(
          (id: unknown): id is string => typeof id === 'string' && EXAM_REGISTRY.some((e) => e.id === id)
        );
        const custom = (Array.isArray(parsed.customCountdowns) ? parsed.customCountdowns : []).filter(
          (c: unknown): c is PersonalCountdownItem =>
            !!c && typeof (c as PersonalCountdownItem).title === 'string'
        );
        const sessions = (Array.isArray(parsed.studySessions) ? parsed.studySessions : []).filter(
          (s: unknown): s is StudySessionLog => !!s && typeof (s as StudySessionLog).durationMinutes === 'number'
        );

        return {
          valid: true,
          schemaVersion: 0,
          counts: {
            savedExams: favs.length,
            favourites: favs.length,
            customCountdowns: custom.length,
            studySessions: sessions.length,
          },
          parsedData: {
            savedExamIds: favs,
            favouriteExamIds: favs,
            customCountdowns: custom,
            preferences: DEFAULT_PREFERENCES,
            studySessions: sessions,
          },
        };
      }

      return {
        valid: false,
        error: 'Unsupported backup format or missing IndianTimers signature.',
        counts: { savedExams: 0, favourites: 0, customCountdowns: 0, studySessions: 0 },
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid JSON file. Please verify the file is an intact .json backup.',
        counts: { savedExams: 0, favourites: 0, customCountdowns: 0, studySessions: 0 },
      };
    }
  },

  importUserData(
    validatedData: UserDataBackup['data'],
    mode: 'merge' | 'replace'
  ): { success: boolean; error?: string } {
    // Snapshot existing dataset for rollback safety
    const snapshot = {
      savedExams: safeGetItem(STORAGE_KEYS.SAVED_EXAMS),
      favs: safeGetItem(STORAGE_KEYS.FAVORITES),
      custom: safeGetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS),
      prefs: safeGetItem(STORAGE_KEYS.PREFERENCES),
      sessions: safeGetItem(STORAGE_KEYS.STUDY_SESSIONS),
    };

    try {
      if (mode === 'replace') {
        safeSetItem(STORAGE_KEYS.SAVED_EXAMS, JSON.stringify(validatedData.savedExamIds));
        safeSetItem(STORAGE_KEYS.FAVORITES, JSON.stringify(validatedData.favouriteExamIds));
        safeSetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, JSON.stringify(validatedData.customCountdowns));
        safeSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(validatedData.preferences));
        safeSetItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(validatedData.studySessions));
      } else {
        // Merge mode: Deduplicate and union
        const currentSaved = this.getSavedExamIds();
        const mergedSaved = Array.from(new Set([...currentSaved, ...validatedData.savedExamIds]));

        const currentFavs = this.getFavorites();
        const mergedFavs = Array.from(new Set([...currentFavs, ...validatedData.favouriteExamIds]));

        const currentCustom = this.getCustomCountdowns();
        // Prevent duplicate custom countdowns (match on title + targetDate)
        const customMap = new Map<string, PersonalCountdownItem>();
        for (const item of currentCustom) {
          customMap.set(`${item.title.toLowerCase()}::${item.targetDate}`, item);
        }
        for (const item of validatedData.customCountdowns) {
          const key = `${item.title.toLowerCase()}::${item.targetDate}`;
          if (!customMap.has(key)) {
            customMap.set(key, item);
          }
        }
        const mergedCustom = Array.from(customMap.values());

        const currentSessions = this.getStudySessions();
        const sessionIds = new Set(currentSessions.map((s) => s.id));
        const mergedSessions = [...currentSessions];
        for (const s of validatedData.studySessions) {
          if (!sessionIds.has(s.id)) {
            mergedSessions.push(s);
          }
        }

        const mergedPrefs = {
          ...this.getPreferences(),
          ...(validatedData.preferences || {}),
        };

        safeSetItem(STORAGE_KEYS.SAVED_EXAMS, JSON.stringify(mergedSaved));
        safeSetItem(STORAGE_KEYS.FAVORITES, JSON.stringify(mergedFavs));
        safeSetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, JSON.stringify(mergedCustom));
        safeSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(mergedPrefs));
        safeSetItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(mergedSessions.slice(0, 200)));
      }

      // Sync legacy keys for backward compatibility
      safeSetItem(STORAGE_KEYS.LEGACY_FAVORITES, safeGetItem(STORAGE_KEYS.FAVORITES) || '[]');
      safeSetItem(STORAGE_KEYS.LEGACY_CUSTOM, safeGetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS) || '[]');
      safeSetItem(STORAGE_KEYS.LEGACY_SESSIONS, safeGetItem(STORAGE_KEYS.STUDY_SESSIONS) || '[]');

      this.dispatchCockpitUpdate();
      return { success: true };
    } catch (err) {
      // Rollback to prior snapshot
      if (snapshot.savedExams !== null) safeSetItem(STORAGE_KEYS.SAVED_EXAMS, snapshot.savedExams);
      if (snapshot.favs !== null) safeSetItem(STORAGE_KEYS.FAVORITES, snapshot.favs);
      if (snapshot.custom !== null) safeSetItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS, snapshot.custom);
      if (snapshot.prefs !== null) safeSetItem(STORAGE_KEYS.PREFERENCES, snapshot.prefs);
      if (snapshot.sessions !== null) safeSetItem(STORAGE_KEYS.STUDY_SESSIONS, snapshot.sessions);

      return {
        success: false,
        error: `Import failed and changes were safely rolled back: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  // --- Reset / Clear Data ---
  clearAllData(): void {
    safeRemoveItem(STORAGE_KEYS.SAVED_EXAMS);
    safeRemoveItem(STORAGE_KEYS.FAVORITES);
    safeRemoveItem(STORAGE_KEYS.CUSTOM_COUNTDOWNS);
    safeRemoveItem(STORAGE_KEYS.PREFERENCES);
    safeRemoveItem(STORAGE_KEYS.STUDY_SESSIONS);
    safeRemoveItem(STORAGE_KEYS.LEGACY_FAVORITES);
    safeRemoveItem(STORAGE_KEYS.LEGACY_CUSTOM);
    safeRemoveItem(STORAGE_KEYS.LEGACY_SESSIONS);

    this.dispatchCockpitUpdate();
  },

  dispatchCockpitUpdate(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('indiantimers:cockpit-updated'));
    window.dispatchEvent(new CustomEvent('indiantimers:favorites-updated', { detail: this.getFavorites() }));
    window.dispatchEvent(new CustomEvent('indiantimers:custom-updated'));
    window.dispatchEvent(new CustomEvent('indiantimers:sessions-updated'));
  },
};
