import React, { useState, useEffect } from 'react';
import type { ExamRecord, PersonalCountdownItem, StudySessionLog } from '../types/exam';
import { storageService } from '../utils/storage';
import { EXAM_REGISTRY } from '../data/exams';
import CountdownCard from './CountdownCard';
import {
  Bookmark,
  Clock,
  Trash2,
  Download,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';

export default function PersonalDashboard() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<PersonalCountdownItem[]>([]);
  const [studySessions, setStudySessions] = useState<StudySessionLog[]>([]);
  const [todayFocusMins, setTodayFocusMins] = useState(0);
  const [weeklyFocusMins, setWeeklyFocusMins] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const refreshData = () => {
    setFavoriteIds(storageService.getFavorites());
    setCustomItems(storageService.getCustomCountdowns());
    setStudySessions(storageService.getStudySessions());
    setTodayFocusMins(storageService.getTodayFocusMinutes());
    setWeeklyFocusMins(storageService.getWeeklyFocusMinutes());
  };

  useEffect(() => {
    refreshData();

    const handleFavChange = () => refreshData();
    const handleCustomChange = () => refreshData();
    const handleSessionChange = () => refreshData();

    window.addEventListener('indiantimers:favorites-updated', handleFavChange);
    window.addEventListener('indiantimers:custom-updated', handleCustomChange);
    window.addEventListener('indiantimers:sessions-updated', handleSessionChange);

    return () => {
      window.removeEventListener('indiantimers:favorites-updated', handleFavChange);
      window.removeEventListener('indiantimers:custom-updated', handleCustomChange);
      window.removeEventListener('indiantimers:sessions-updated', handleSessionChange);
    };
  }, []);

  const favoriteExams = EXAM_REGISTRY.filter((exam) => favoriteIds.includes(exam.id));

  const handleDeleteCustom = (id: string) => {
    storageService.deleteCustomCountdown(id);
    refreshData();
  };

  const handleExportData = () => {
    const jsonStr = storageService.exportAllUserData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `indiantimers-study-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearData = () => {
    storageService.clearAllData();
    setConfirmClear(false);
    refreshData();
  };

  return (
    <div className="space-y-10">
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Today's Focus</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {Math.floor(todayFocusMins / 60)}h {todayFocusMins % 60}m
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Logged study intervals today</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Past 7 Days Focus</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {Math.floor(weeklyFocusMins / 60)}h {weeklyFocusMins % 60}m
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Weekly total focus time</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Saved Target Exams</span>
            <Bookmark className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {favoriteExams.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pin exams to track closely</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Custom Deadlines</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {customItems.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mocks, school tests, targets</p>
        </div>
      </div>

      {/* Section 1: Saved Official Examinations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              My Saved Examinations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live countdowns for official exams you have pinned.
            </p>
          </div>
          <a
            href="/exams/"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Browse All Exams</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {favoriteExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteExams.map((exam) => (
              <CountdownCard key={exam.id} exam={exam} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              No saved examinations yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click the bookmark icon on any exam card to pin it here for instant monitoring.
            </p>
            <a
              href="/exams/"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-block"
            >
              Discover Upcoming Exams
            </a>
          </div>
        )}
      </div>

      {/* Section 2: Personal Custom Deadlines */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Personal Deadlines & Mock Tests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Custom countdowns created for coaching exams, assignments, or revision dates.
            </p>
          </div>
          <a
            href="/tools/countdown/"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Countdown</span>
          </a>
        </div>

        {customItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleDeleteCustom(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                      title="Delete deadline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {item.targetDate} {item.targetTime ? `• ${item.targetTime} IST` : ''}
                  </p>
                  {item.notes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mb-3">
                      "{item.notes}"
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <a
                    href={`/tools/countdown/?title=${encodeURIComponent(item.title)}&date=${item.targetDate}&time=${item.targetTime || ''}&notes=${encodeURIComponent(item.notes || '')}`}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-[11px]"
                  >
                    Open Live Screen
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No personal countdowns created yet. Use the{' '}
            <a href="/tools/countdown/" className="text-blue-600 dark:text-blue-400 underline font-medium">
              Custom Countdown Creator
            </a>{' '}
            to set personalized targets.
          </div>
        )}
      </div>

      {/* Section 3: Study Session Log History */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          Recent Focus Session History
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Automatically logged when you conclude Pomodoro or Mock-Test intervals.
        </p>

        {studySessions.length > 0 ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 grid grid-cols-4 border-b border-slate-200 dark:border-slate-800">
              <span>Date</span>
              <span>Tool</span>
              <span>Duration</span>
              <span>Subject / Task</span>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {studySessions.slice(0, 20).map((session) => (
                <div key={session.id} className="px-4 py-2.5 grid grid-cols-4 text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-500">{session.date}</span>
                  <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">
                    {session.sessionType.replace('-', ' ')}
                  </span>
                  <span>{session.durationMinutes} minutes</span>
                  <span className="truncate text-slate-500 dark:text-slate-400">
                    {session.subject || 'General Focus'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No focus sessions logged yet. Start a session with the{' '}
            <a href="/tools/pomodoro-timer/" className="text-blue-600 dark:text-blue-400 underline font-medium">
              Pomodoro Timer
            </a>{' '}
            or{' '}
            <a href="/tools/mock-test-timer/" className="text-blue-600 dark:text-blue-400 underline font-medium">
              Mock Test Timer
            </a>
            .
          </div>
        )}
      </div>

      {/* Section 4: Privacy, Data Backup & Clear Controls */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">
            Privacy & Data Controls
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All data resides securely inside your browser's LocalStorage. No tracking or mandatory sign-ups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup (.JSON)</span>
          </button>

          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Saved Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Confirm delete?
              </span>
              <button
                onClick={handleClearData}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
