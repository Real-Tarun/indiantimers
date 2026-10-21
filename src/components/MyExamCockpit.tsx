import React, { useState, useEffect, useMemo, useRef } from 'react';
import type {
  ExamRecord,
  PersonalCountdownItem,
  StudySessionLog,
  CockpitPreferences,
  ImportValidationResult,
} from '../types/exam';
import { storageService } from '../utils/storage';
import { EXAM_REGISTRY } from '../data/exams';
import { calculateCountdown } from '../utils/countdown';
import CountdownCard from './CountdownCard';
import {
  Bookmark,
  Star,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Maximize2,
  Shield,
  AlertTriangle,
  Check,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from 'lucide-react';

export default function MyExamCockpit() {
  const [savedExamIds, setSavedExamIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<PersonalCountdownItem[]>([]);
  const [studySessions, setStudySessions] = useState<StudySessionLog[]>([]);
  const [preferences, setPreferences] = useState<CockpitPreferences>(() => storageService.getPreferences());
  const [todayFocusMins, setTodayFocusMins] = useState(0);
  const [weeklyFocusMins, setWeeklyFocusMins] = useState(0);

  // Search & add exam state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Custom countdown modal state (create / edit)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('14:00');
  const [customCategory, setCustomCategory] = useState('Coaching Mock');
  const [customNotes, setCustomNotes] = useState('');

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importReport, setImportReport] = useState<ImportValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation dialogs
  const [confirmClear, setConfirmClear] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (text: string) => {
    setActionNotice(text);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const loadData = () => {
    setSavedExamIds(storageService.getSavedExamIds());
    setFavoriteIds(storageService.getFavorites());
    setCustomItems(storageService.getCustomCountdowns());
    setStudySessions(storageService.getStudySessions());
    setPreferences(storageService.getPreferences());
    setTodayFocusMins(storageService.getTodayFocusMinutes());
    setWeeklyFocusMins(storageService.getWeeklyFocusMinutes());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('indiantimers:cockpit-updated', handleUpdate);
    window.addEventListener('indiantimers:favorites-updated', handleUpdate);
    window.addEventListener('indiantimers:custom-updated', handleUpdate);
    window.addEventListener('indiantimers:sessions-updated', handleUpdate);

    // Click outside search listener
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('indiantimers:cockpit-updated', handleUpdate);
      window.removeEventListener('indiantimers:favorites-updated', handleUpdate);
      window.removeEventListener('indiantimers:custom-updated', handleUpdate);
      window.removeEventListener('indiantimers:sessions-updated', handleUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and sort saved exams
  const savedExams = useMemo(() => {
    const list = savedExamIds
      .map((id) => EXAM_REGISTRY.find((e) => e.id === id))
      .filter((e): e is ExamRecord => Boolean(e));

    if (preferences.dashboardSort === 'date_asc') {
      return [...list].sort((a, b) => new Date(a.dates.examDate).getTime() - new Date(b.dates.examDate).getTime());
    }
    if (preferences.dashboardSort === 'date_desc') {
      return [...list].sort((a, b) => new Date(b.dates.examDate).getTime() - new Date(a.dates.examDate).getTime());
    }
    if (preferences.dashboardSort === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    // Default / custom order (matches savedExamIds array order)
    return list;
  }, [savedExamIds, preferences.dashboardSort]);

  // Autocomplete search suggestions
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return EXAM_REGISTRY.filter((exam) => {
      const matchName = exam.name.toLowerCase().includes(q);
      const matchShort = exam.shortName.toLowerCase().includes(q);
      const matchAuthority = exam.conductingAuthority.toLowerCase().includes(q);
      const matchAliases = exam.aliases?.some((a) => a.toLowerCase().includes(q));
      return matchName || matchShort || matchAuthority || matchAliases;
    }).slice(0, 8);
  }, [searchQuery]);

  // Handlers for exam management
  const handleAddExam = (examId: string) => {
    const added = storageService.addSavedExam(examId);
    if (added) {
      showNotice('Added examination to your cockpit');
    } else {
      showNotice('Examination already in your cockpit');
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleRemoveExam = (examId: string) => {
    storageService.removeSavedExam(examId);
    showNotice('Removed examination from cockpit');
  };

  const handleMoveExam = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= savedExamIds.length) return;
    const updated = [...savedExamIds];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    storageService.reorderSavedExams(updated);
  };

  const handleToggleFavorite = (examId: string) => {
    storageService.toggleFavorite(examId);
  };

  // Custom countdown handlers
  const openNewCustomModal = () => {
    setEditingCustomId(null);
    setCustomTitle('');
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setCustomDate(d.toISOString().split('T')[0]);
    setCustomTime('14:00');
    setCustomCategory('Coaching Mock');
    setCustomNotes('');
    setIsCustomModalOpen(true);
  };

  const openEditCustomModal = (item: PersonalCountdownItem) => {
    setEditingCustomId(item.id);
    setCustomTitle(item.title);
    setCustomDate(item.targetDate);
    setCustomTime(item.targetTime || '14:00');
    setCustomCategory(item.category || 'Personal Goal');
    setCustomNotes(item.notes || '');
    setIsCustomModalOpen(true);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customDate) return;

    storageService.saveCustomCountdown(
      {
        title: customTitle,
        targetDate: customDate,
        targetTime: customTime,
        timezone: 'Asia/Kolkata',
        category: customCategory,
        notes: customNotes,
      },
      editingCustomId || undefined
    );

    setIsCustomModalOpen(false);
    showNotice(editingCustomId ? 'Updated custom countdown' : 'Created custom countdown');
  };

  const handleDeleteCustom = (id: string) => {
    storageService.deleteCustomCountdown(id);
    showNotice('Deleted custom countdown');
  };

  // Preference updates
  const setViewMode = (mode: 'compact' | 'expanded') => {
    storageService.savePreferences({ countdownDisplay: mode });
  };

  const setSortOrder = (sort: 'date_asc' | 'date_desc' | 'name' | 'custom') => {
    storageService.savePreferences({ dashboardSort: sort });
  };

  // Data Export Handler
  const handleExportBackup = () => {
    const jsonStr = storageService.exportAllUserData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `indiantimers-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Backup downloaded successfully (.JSON)');
  };

  // File picker handler for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      const report = storageService.validateBackup(content);
      setImportReport(report);
    };
    reader.readAsText(file);
  };

  // Import Apply Handler
  const handleApplyImport = () => {
    if (!importReport || !importReport.valid || !importReport.parsedData) return;
    setIsImporting(true);

    const result = storageService.importUserData(importReport.parsedData, importMode);
    setIsImporting(false);

    if (result.success) {
      setIsImportModalOpen(false);
      setImportReport(null);
      setImportJsonText('');
      showNotice(
        importMode === 'merge'
          ? 'Backup merged successfully into your cockpit!'
          : 'Cockpit restored from backup snapshot!'
      );
    } else {
      showNotice(result.error || 'Failed to apply import');
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in-up">
          <Check className="w-4 h-4 text-[#D4FF4F] dark:text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Cockpit Header & Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Tracked Exams</span>
            <Bookmark className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {savedExams.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active exam monitors</p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Pinned Stars</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {favoriteIds.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">High priority targets</p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Custom Deadlines</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {customItems.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Mock tests & assignments</p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Today's Focus</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {Math.floor(todayFocusMins / 60)}h {todayFocusMins % 60}m
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Logged study time today</p>
        </div>
      </div>

      {/* Interactive Search & Add Official Examination */}
      <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs relative">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display mb-1">
          Search & Add Verified National Examinations
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Add any examination from the audited 50+ registry directly to your personal cockpit.
        </p>

        <div ref={searchContainerRef} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by exam name or authority (e.g. NEET UG, JEE Main, UPSC CSE, GATE, CBSE)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((exam) => {
                const isAlreadyAdded = savedExamIds.includes(exam.id);
                return (
                  <div
                    key={exam.id}
                    className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {exam.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {exam.category.replace(/-/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {exam.conductingAuthority} · Date: <strong>{exam.dates.examDate}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddExam(exam.id)}
                      disabled={isAlreadyAdded}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        isAlreadyAdded
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                          : 'bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] shadow-xs cursor-pointer'
                      }`}
                    >
                      {isAlreadyAdded ? 'Added ✓' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Add Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[11px] font-bold text-slate-400">Popular Benchmarks:</span>
          {[
            { id: 'neet-ug-2027', name: 'NEET UG 2027' },
            { id: 'jee-main-2027-session-1', name: 'JEE Main Session 1' },
            { id: 'upsc-cse-prelims-2027', name: 'UPSC CSE Prelims' },
            { id: 'gate-2027', name: 'GATE 2027' },
            { id: 'cbse-class-12-board-2027', name: 'CBSE Class 12' },
          ].map((pill) => {
            const added = savedExamIds.includes(pill.id);
            return (
              <button
                key={pill.id}
                onClick={() => handleAddExam(pill.id)}
                disabled={added}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                  added
                    ? 'border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-800/40'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {added ? `✓ ${pill.name}` : `+ ${pill.name}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tracked Exams Section with View Mode & Sort Controls */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Tracked Examinations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live verified countdowns in your customized display preference.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={preferences.dashboardSort}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-white dark:bg-[#171923] border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="custom">Custom Order</option>
                <option value="date_asc">Exam Date (Soonest first)</option>
                <option value="date_desc">Exam Date (Furthest first)</option>
                <option value="name">Exam Name (A-Z)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('expanded')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  preferences.countdownDisplay === 'expanded'
                    ? 'bg-white dark:bg-[#171923] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Expanded Countdown Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  preferences.countdownDisplay === 'compact'
                    ? 'bg-white dark:bg-[#171923] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Compact Table Layout"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compact</span>
              </button>
            </div>
          </div>
        </div>

        {/* Exams Content */}
        {savedExams.length > 0 ? (
          preferences.countdownDisplay === 'expanded' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedExams.map((exam, index) => (
                <div key={exam.id} className="relative group">
                  <CountdownCard exam={exam} />
                  {/* Cockpit Card Controls overlay bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      {preferences.dashboardSort === 'custom' && (
                        <>
                          <button
                            onClick={() => handleMoveExam(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveExam(index, 'down')}
                            disabled={index === savedExams.length - 1}
                            className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <span>Verified: {exam.lastVerified}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={exam.officialWebsite || exam.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 flex items-center gap-0.5"
                        title="Official portal citation"
                      >
                        <span>Official Source</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        onClick={() => handleRemoveExam(exam.id)}
                        className="text-red-500 hover:text-red-700 p-1 font-bold"
                        title="Remove from Cockpit"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Compact List View */
            <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {savedExams.map((exam, index) => {
                const cd = calculateCountdown(
                  exam.dates.examDate,
                  exam.startTime,
                  exam.dateStatus,
                  exam.timezone
                );
                const isFav = favoriteIds.includes(exam.id);

                return (
                  <div
                    key={exam.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleFavorite(exam.id)}
                        className={`p-1.5 rounded-full mt-0.5 transition-colors ${
                          isFav
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={isFav ? 'Pinned favorite' : 'Pin to favorites'}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/exams/${exam.slug}/`}
                            className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-[#D4FF4F] transition-colors"
                          >
                            {exam.name}
                          </a>
                          {exam.dateStatus === 'official' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#D4FF4F] text-[#111406]">
                              Official
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
                              Tentative
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {exam.conductingAuthority} · Date: <strong>{exam.dates.examDate}</strong>
                          {exam.startTime && ` · ${exam.startTime} IST`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-9 sm:pl-0">
                      {/* Days Remaining Pill */}
                      <div className="text-right">
                        <span className="font-mono-digits font-black text-xl text-slate-900 dark:text-white block leading-none">
                          {cd.isPast ? 'Past' : `${cd.days}d ${cd.hours}h`}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/exams/${exam.slug}/`}
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                          title="Open Details"
                        >
                          Details
                        </a>

                        <button
                          onClick={() => handleRemoveExam(exam.id)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove from Cockpit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="p-8 text-center rounded-[24px] border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#171923]">
            <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Your Cockpit is Empty
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Add your upcoming examinations using the search bar above or choose from popular benchmarks to start monitoring live schedules.
            </p>
            <button
              onClick={() => handleAddExam('neet-ug-2027')}
              className="btn-primary"
            >
              Add NEET UG 2027 Benchmark
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Personal Custom Deadlines & Milestones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Personal Deadlines & Mock Tests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Custom countdowns for school tests, coaching mocks, or personal goals.
            </p>
          </div>
          <button
            onClick={openNewCustomModal}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Timer</span>
          </button>
        </div>

        {customItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customItems.map((item) => {
              const cd = calculateCountdown(item.targetDate, item.targetTime, 'official', item.timezone);
              return (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCustomModal(item)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded"
                          title="Edit Custom Countdown"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustom(item.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded"
                          title="Delete Custom Countdown"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Target: <strong>{item.targetDate}</strong> {item.targetTime ? `· ${item.targetTime} IST` : ''}
                    </p>

                    {/* Countdown Digits */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-3 flex items-center justify-around text-center">
                      <div>
                        <span className="font-mono-digits font-black text-xl text-slate-900 dark:text-white block leading-none">
                          {cd.isPast ? '0' : cd.days}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Days</span>
                      </div>
                      <div>
                        <span className="font-mono-digits font-black text-xl text-slate-900 dark:text-white block leading-none">
                          {cd.isPast ? '0' : cd.hours}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Hours</span>
                      </div>
                      <div>
                        <span className="font-mono-digits font-black text-xl text-slate-900 dark:text-white block leading-none">
                          {cd.isPast ? '0' : cd.minutes}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Mins</span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl mb-2">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <a
                      href={`/countdown/?title=${encodeURIComponent(item.title)}&date=${item.targetDate}&time=${item.targetTime || '14:00'}&category=${encodeURIComponent(item.category)}&notes=${encodeURIComponent(item.notes || '')}`}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-xs flex items-center gap-1"
                    >
                      <span>Share / Live Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center rounded-[22px] border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-white dark:bg-[#171923]">
            No personal milestones created yet. Click "+ Create Custom Timer" to set deadlines for upcoming tests or syllabus targets.
          </div>
        )}
      </div>

      {/* Section 3: Study Tools Quick Launch Bar */}
      <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display mb-1">
          Productivity & Exam Focus Tools
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Integrated timers designed specifically for competitive exam aspirants.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/tools/pomodoro-timer/"
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Pomodoro Focus Timer
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">25/5 & 50/10 Study Cycles</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href="/tools/mock-test-timer/"
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Mock Test Exam Simulator
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Exact 180m & 200m timing</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href="/tools/study-timer/"
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Daily Study Hours Tracker
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Track revision time by subject</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* Section 4: Data Management, Backup Export/Import & Privacy */}
      <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Local-First Data Architecture & Portability
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              All your preferences, custom milestones, and saved exams reside exclusively on your device inside LocalStorage. No accounts, telemetry, or server tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all flex items-center gap-1.5 shadow-xs"
              title="Download standard JSON backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup (.JSON)</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all flex items-center gap-1.5 shadow-xs"
              title="Restore or merge JSON backup"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Backup</span>
            </button>
          </div>
        </div>

        {/* Clear Data warning */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <p className="text-slate-400 text-[11px]">
            Notice: Clearing browser cookies or cache will erase local data unless you save an exported JSON backup file.
          </p>

          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Confirm complete reset?
              </span>
              <button
                onClick={() => {
                  storageService.clearAllData();
                  setConfirmClear(false);
                  showNotice('All local cockpit data cleared');
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: Create / Edit Custom Countdown --- */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.1] rounded-[24px] max-w-lg w-full p-6 shadow-2xl relative animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {editingCustomId ? 'Edit Custom Countdown' : 'Create Custom Milestone / Mock Test'}
              </h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event / Test Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allen Physics Mock Test 4, CBSE Pre-Board"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time (IST)
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Coaching Mock">Coaching Mock Test</option>
                  <option value="School Test">School / College Exam</option>
                  <option value="Assignment">Assignment Submission</option>
                  <option value="Revision Target">Syllabus Revision Target</option>
                  <option value="Personal Goal">Personal Goal</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Notes & Strategy (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Aim for 90% accuracy in Organic Chemistry; 45 mins time limit."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-full font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] shadow-xs cursor-pointer"
                >
                  {editingCustomId ? 'Save Changes' : 'Create Timer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Import Backup Validation & Preview --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.1] rounded-[24px] max-w-lg w-full p-6 shadow-2xl relative animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Import IndianTimers Backup
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportReport(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* File upload drop box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors"
              >
                <Download className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Click to select JSON backup file
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports indiantimers-backup-*.json (Schema v1)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Validation Report & Preview */}
              {importReport && (
                <div
                  className={`p-4 rounded-2xl border ${
                    importReport.valid
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300/40 text-emerald-950 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-300/40 text-red-950 dark:text-red-200'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {importReport.valid ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Valid Backup Verified (Schema v{importReport.schemaVersion})</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Invalid Backup: {importReport.error}</span>
                      </>
                    )}
                  </div>

                  {importReport.valid && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 text-[11px]">
                      <div>Saved Exams: <strong>{importReport.counts.savedExams}</strong></div>
                      <div>Favourites: <strong>{importReport.counts.favourites}</strong></div>
                      <div>Custom Milestones: <strong>{importReport.counts.customCountdowns}</strong></div>
                      <div>Study Logs: <strong>{importReport.counts.studySessions}</strong></div>
                    </div>
                  )}
                </div>
              )}

              {/* Import Mode Selection */}
              {importReport?.valid && (
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Import Application Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('merge')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        importMode === 'merge'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs">Merge Data (Recommended)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Combines new backup with your existing exams without erasing anything.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        importMode === 'replace'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs">Replace Local Data</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Replaces current local items with backup (automatic safety rollback).
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportReport(null);
                  }}
                  className="px-4 py-2 rounded-full font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importReport?.valid || isImporting}
                  onClick={handleApplyImport}
                  className="px-5 py-2 rounded-full font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isImporting ? 'Applying...' : `Apply ${importMode === 'merge' ? 'Merge' : 'Restore'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
