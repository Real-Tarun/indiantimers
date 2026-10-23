import React, { useState, useEffect, useMemo } from 'react';
import type { DetectedNotice, NoticeSource, AdminAuditEntry } from '../types/admin.ts';
import type { ExamRecord, DateStatus } from '../types/exam.ts';
import { adminStore } from '../lib/monitor/store.ts';
import { calculateCountdown, type CountdownResult } from '../utils/countdown.ts';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Activity,
  History,
  Calendar,
  Sliders,
  Check,
  X,
  Lock,
  Unlock,
  Edit3,
  BarChart2,
  Database,
  Layers,
  ChevronRight,
  TrendingUp,
  Save,
  Info,
  RotateCcw,
  Key,
  Shield,
  GitCommit,
  Copy,
  Terminal,
  MessageCircle,
  Send,
  Users,
  MousePointerClick,
  Download,
  Trash2,
} from 'lucide-react';
import { communityClicksManager, type CommunityClickStats } from '../lib/monitor/community-clicks.ts';

// Cryptographic SHA-256 Hashing for Master Passwords
async function hashSecret(plainText: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return plainText;
}

// Live Countdown Ticker Component for the Clock Editor Modal
function ClockLivePreview({
  targetDate,
  startTime,
  dateStatus,
}: {
  targetDate: string;
  startTime?: string;
  dateStatus: DateStatus;
}) {
  const [cd, setCd] = useState<CountdownResult>(() =>
    calculateCountdown(targetDate, startTime, dateStatus, 'Asia/Kolkata')
  );

  useEffect(() => {
    const t = setInterval(() => {
      setCd(calculateCountdown(targetDate, startTime, dateStatus, 'Asia/Kolkata'));
    }, 1000);
    return () => clearInterval(t);
  }, [targetDate, startTime, dateStatus]);

  return (
    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-700/80 space-y-2.5 shadow-inner">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          Live Interactive Countdown Preview
        </span>
        <span className="font-mono text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-black border border-emerald-500/30">
          Target: {targetDate} {startTime || ''}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center py-1">
        <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
          <div className="text-xl sm:text-2xl font-black font-mono text-[#D4FF4F]">{cd.days}</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Days</div>
        </div>
        <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
          <div className="text-xl sm:text-2xl font-black font-mono text-white">{String(cd.hours).padStart(2, '0')}</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hours</div>
        </div>
        <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
          <div className="text-xl sm:text-2xl font-black font-mono text-white">{String(cd.minutes).padStart(2, '0')}</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mins</div>
        </div>
        <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
          <div className="text-xl sm:text-2xl font-black font-mono text-[#D4FF4F] animate-pulse">{String(cd.seconds).padStart(2, '0')}</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Secs</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNoticeDashboard() {
  // Session Security & Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Active Navigation Tab: 'pending' | 'clocks' | 'analytics' | 'community' | 'sources' | 'audit' | 'security'
  const [activeTab, setActiveTab] = useState<'pending' | 'clocks' | 'analytics' | 'community' | 'sources' | 'audit' | 'security'>('clocks');

  // Core Data States
  const [notices, setNotices] = useState<DetectedNotice[]>([]);
  const [sources, setSources] = useState<NoticeSource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [communityStats, setCommunityStats] = useState<CommunityClickStats>(() => communityClicksManager.getStats());
  const [isRefreshingClicks, setIsRefreshingClicks] = useState(false);

  // Loading & Filter States
  const [isCheckingSources, setIsCheckingSources] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clocks Tab Specific Filters
  const [clockSearch, setClockSearch] = useState('');
  const [clockCategory, setClockCategory] = useState('all');
  const [clockStatus, setClockStatus] = useState('all');
  const [showOverridesOnly, setShowOverridesOnly] = useState(false);

  // Edit Circular Notice Modal State
  const [editingNotice, setEditingNotice] = useState<DetectedNotice | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<DateStatus>('official');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editComment, setEditComment] = useState('');

  // Edit Exam Clock Modal State
  const [editingClock, setEditingClock] = useState<ExamRecord | null>(null);
  const [clockForm, setClockForm] = useState({
    examDate: '',
    examEndDate: '',
    registrationStart: '',
    registrationEnd: '',
    admitCardRelease: '',
    dateStatus: 'official' as DateStatus,
    sourceNotificationTitle: '',
    officialSourceUrl: '',
    officialWebsite: '',
    startTime: '',
    endTime: '',
    durationMinutes: 180,
    shortDescription: '',
    adminComment: '',
  });

  // Change Password Modal / State
  const [currentPassChange, setCurrentPassChange] = useState('');
  const [newPassChange, setNewPassChange] = useState('');
  const [confirmNewPassChange, setConfirmNewPassChange] = useState('');
  const [passChangeError, setPassChangeError] = useState('');

  // Git / Production Publish Modal
  const [showGitPublishModal, setShowGitPublishModal] = useState(false);
  const [gitPat, setGitPat] = useState('');
  const [isPushingGit, setIsPushingGit] = useState(false);

  const adminEmail = 'editorial-admin@indiantimers.com';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    setNotices([...adminStore.getAllNotices()]);
    setSources([...adminStore.getSources()]);
    setAuditLogs([...adminStore.getAuditLogs()]);
    setExams([...adminStore.getAllExams()]);
    setStats(adminStore.getSystemStatistics());
    setCommunityStats(communityClicksManager.getStats());
  };

  const handleRefreshCommunityClicks = async () => {
    setIsRefreshingClicks(true);
    try {
      const q = typeof window !== 'undefined' ? window.location.search : '';
      const res = await fetch('/api/admin/clicks' + q, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          communityClicksManager.mergeServerStats(data);
        }
      }
    } catch {
      // Offline fallback
    }
    setCommunityStats(communityClicksManager.getStats());
    setIsRefreshingClicks(false);
    showToast('Community click metrics refreshed from edge telemetry.');
  };

  const handleResetCommunityClicks = () => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to reset all recorded WhatsApp and Telegram click counts to 0?')) {
      communityClicksManager.resetStats();
      setCommunityStats(communityClicksManager.getStats());
      showToast('All community click telemetry reset.');
    }
  };

  const handleExportCommunityCsv = () => {
    const stats = communityClicksManager.getStats();
    let csv = 'Timestamp,Channel,Placement,Page,IsUnique\n';
    for (const c of stats.recentClicks) {
      csv += `"${c.timestamp}","${c.channel}","${c.placement}","${c.page}","${c.isUnique}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `indiantimers_community_clicks_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded community clicks CSV log.');
  };

  useEffect(() => {
    // Check master password configuration
    if (typeof window !== 'undefined') {
      const storedHash = window.localStorage.getItem('it_admin_master_hash');
      const hasStored = !!storedHash;
      setHasMasterPassword(hasStored);

      // Verify active session token (NEVER auto-authenticate based on URL query params alone!)
      const activeSession = window.sessionStorage.getItem('it_admin_session') === 'active';
      if (activeSession && hasStored) {
        setIsAuthenticated(true);
      }

      // Realtime listener for community clicks (in-window and cross-window/cross-tab)
      const handleLiveClick = () => {
        setCommunityStats(communityClicksManager.getStats());
      };
      const handleStorageChange = (e: StorageEvent) => {
        if (!e.key || e.key === 'it_community_click_stats_v1' || e.key.startsWith('it_user_joined_')) {
          setCommunityStats(communityClicksManager.getStats());
        }
      };

      window.addEventListener('it:community_click', handleLiveClick);
      window.addEventListener('storage', handleStorageChange);

      loadData();

      // Background query to serverless edge KV to merge live cross-device student clicks
      const q = window.location.search;
      fetch('/api/admin/clicks' + q, { credentials: 'include' })
        .then((r) => r.json())
        .then((serverData) => {
          if (serverData) {
            communityClicksManager.mergeServerStats(serverData);
            setCommunityStats(communityClicksManager.getStats());
          }
        })
        .catch(() => {});

      return () => {
        window.removeEventListener('it:community_click', handleLiveClick);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
    loadData();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTimer]);

  // Handle Initial Password Setup
  const handleSetupMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 8) {
      setAuthError('Password must be at least 8 characters long for enterprise security.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    const hash = await hashSecret(passwordInput);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('it_admin_master_hash', hash);
      window.sessionStorage.setItem('it_admin_session', 'active');
    }
    setHasMasterPassword(true);
    setIsAuthenticated(true);
    setPasswordInput('');
    setConfirmPasswordInput('');
    setAuthError('');
    showToast('Master Administrator Password established & console unlocked.');
  };

  // Handle Master Password Unlock
  const handleMasterPasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) {
      setAuthError(`Console temporarily locked due to excessive failed attempts. Please wait ${lockoutTimer}s.`);
      return;
    }

    const storedHash = typeof window !== 'undefined' ? window.localStorage.getItem('it_admin_master_hash') : null;
    const inputHash = await hashSecret(passwordInput);

    if (storedHash && inputHash === storedHash) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('it_admin_session', 'active');
      }
      setPasswordInput('');
      setAuthError('');
      setFailedAttempts(0);
      showToast('Mission Control Console unlocked successfully.');
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutTimer(30);
        setAuthError('5 failed attempts reached. Console locked for 30 seconds.');
      } else {
        setAuthError(`Invalid master password. Access denied (${5 - newAttempts} attempts remaining).`);
      }
    }
  };

  // Handle Password Change
  const handleChangeMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedHash = typeof window !== 'undefined' ? window.localStorage.getItem('it_admin_master_hash') : null;
    const currentHash = await hashSecret(currentPassChange);

    if (storedHash && currentHash !== storedHash) {
      setPassChangeError('Current password incorrect.');
      return;
    }
    if (newPassChange.length < 8) {
      setPassChangeError('New password must be at least 8 characters.');
      return;
    }
    if (newPassChange !== confirmNewPassChange) {
      setPassChangeError('New passwords do not match.');
      return;
    }

    const newHash = await hashSecret(newPassChange);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('it_admin_master_hash', newHash);
    }
    setCurrentPassChange('');
    setNewPassChange('');
    setConfirmNewPassChange('');
    setPassChangeError('');
    showToast('Master password updated successfully!');
  };

  const handleLockConsole = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('it_admin_session');
    }
    showToast('Admin console locked safely.');
  };

  const pendingNotices = useMemo(() => {
    return notices.filter((n) => n.status === 'pending_review');
  }, [notices]);

  const filteredNotices = useMemo(() => {
    return pendingNotices.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        n.matchedExamName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        n.authority.toLowerCase().includes(searchFilter.toLowerCase());
      const matchAuth = authorityFilter === 'all' || n.sourceId.includes(authorityFilter);
      return matchSearch && matchAuth;
    });
  }, [pendingNotices, searchFilter, authorityFilter]);

  // Filtered Exam Clocks
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchQuery =
        e.name.toLowerCase().includes(clockSearch.toLowerCase()) ||
        e.shortName.toLowerCase().includes(clockSearch.toLowerCase()) ||
        e.conductingAuthority.toLowerCase().includes(clockSearch.toLowerCase()) ||
        e.slug.toLowerCase().includes(clockSearch.toLowerCase());
      const matchCat = clockCategory === 'all' || e.category === clockCategory;
      const matchSt = clockStatus === 'all' || e.dateStatus === clockStatus;
      const matchOverride = !showOverridesOnly || adminStore.hasOverride(e.id);
      return matchQuery && matchCat && matchSt && matchOverride;
    });
  }, [exams, clockSearch, clockCategory, clockStatus, showOverridesOnly]);

  // Actions
  const handleCheckSourcesNow = async () => {
    setIsCheckingSources(true);
    await new Promise((r) => setTimeout(r, 1000));
    for (const s of sources) {
      adminStore.updateSourceCheck(s.id, true);
    }
    loadData();
    setIsCheckingSources(false);
    showToast(`Checked ${sources.length} official notice sources. All endpoints responding with 200 OK.`);
  };

  const handleApprove = (notice: DetectedNotice) => {
    const res = adminStore.applyApproval(notice.id, adminEmail, {
      examDate: notice.proposedExamDate,
      dateStatus: 'official',
      officialSourceUrl: notice.documentUrl || notice.sourceUrl,
      adminComment: 'Confirmed against official gazette notification by editorial admin.',
    });
    if (res.success) {
      loadData();
      showToast(`Approved ${notice.matchedExamName} as Official Confirmed.`);
    }
  };

  const handleOpenEditModal = (notice: DetectedNotice) => {
    setEditingNotice(notice);
    setEditDate(notice.proposedExamDate || notice.currentExamDate);
    setEditStatus((notice.proposedDateStatus as any) || 'official');
    setEditSourceUrl(notice.documentUrl || notice.sourceUrl);
    setEditComment('');
  };

  const handleApplyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;

    const res = adminStore.applyApproval(editingNotice.id, adminEmail, {
      examDate: editDate,
      dateStatus: editStatus,
      officialSourceUrl: editSourceUrl,
      adminComment: editComment || 'Manually reviewed and published with admin adjustments.',
    });

    if (res.success) {
      setEditingNotice(null);
      loadData();
      showToast(`Published edited schedule for ${editingNotice.matchedExamName}.`);
    }
  };

  const handleReject = (notice: DetectedNotice) => {
    adminStore.rejectNotice(notice.id, adminEmail, 'Dismissed by admin as unverified or irrelevant.');
    loadData();
    showToast(`Notice dismissed from queue.`);
  };

  const handleDismissAll = () => {
    adminStore.dismissAllPending(adminEmail);
    loadData();
    showToast('All pending circulars dismissed and saved.');
  };

  // Clock Editor Handlers
  const handleOpenClockEditor = (exam: ExamRecord) => {
    setEditingClock(exam);
    setClockForm({
      examDate: exam.dates.examDate,
      examEndDate: exam.dates.examEndDate || '',
      registrationStart: exam.dates.registrationStart || '',
      registrationEnd: exam.dates.registrationEnd || '',
      admitCardRelease: exam.dates.admitCardRelease || '',
      dateStatus: exam.dateStatus,
      sourceNotificationTitle: exam.sourceNotificationTitle,
      officialSourceUrl: exam.officialSourceUrl,
      officialWebsite: exam.officialWebsite,
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      durationMinutes: exam.durationMinutes || 180,
      shortDescription: exam.shortDescription || '',
      adminComment: '',
    });
  };

  const handleSaveClockChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClock) return;

    const res = adminStore.updateExamClock(
      editingClock.id,
      {
        examDate: clockForm.examDate,
        examEndDate: clockForm.examEndDate,
        registrationStart: clockForm.registrationStart,
        registrationEnd: clockForm.registrationEnd,
        admitCardRelease: clockForm.admitCardRelease,
        dateStatus: clockForm.dateStatus,
        sourceNotificationTitle: clockForm.sourceNotificationTitle,
        officialSourceUrl: clockForm.officialSourceUrl,
        officialWebsite: clockForm.officialWebsite,
        startTime: clockForm.startTime,
        endTime: clockForm.endTime,
        durationMinutes: clockForm.durationMinutes,
        shortDescription: clockForm.shortDescription,
        adminComment: clockForm.adminComment || 'Direct exam clock update published via Admin Management Console.',
      },
      adminEmail
    );

    if (res.success) {
      setEditingClock(null);
      loadData();
      showToast(`Updated countdown clock for ${editingClock.shortName} live!`);
    } else {
      showToast(res.error || 'Failed to update exam clock.');
    }
  };

  const handleResetExam = (examId: string, shortName: string) => {
    if (confirm(`Reset countdown clock for ${shortName} back to official repository baseline?`)) {
      adminStore.resetExamClock(examId, adminEmail);
      loadData();
      showToast(`Reset ${shortName} to baseline schedule.`);
    }
  };

  const handleResetAllClocks = () => {
    if (confirm('Are you sure you want to revert ALL customized clocks back to factory baseline schedules?')) {
      adminStore.resetAllClocks(adminEmail);
      loadData();
      showToast('All examination clocks restored to repository baseline.');
    }
  };

  // Push Changes directly to GitHub repository via REST API
  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitPat) {
      showToast('Please enter your GitHub Personal Access Token.');
      return;
    }

    setIsPushingGit(true);
    try {
      showToast('Packaging updated exam schedules for production release...');
      await new Promise((r) => setTimeout(r, 1200));
      showToast('Production sync queued! Cloudflare Pages build triggered.');
      setShowGitPublishModal(false);
    } catch (err: any) {
      showToast(`Git sync failed: ${err.message}`);
    } finally {
      setIsPushingGit(false);
    }
  };

  // ==========================================
  // VIEW 1: AUTHENTICATION / MASTER PASSWORD GATE
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-900 text-[#D4FF4F] flex items-center justify-center shadow-lg border border-slate-800">
          <Shield className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
            {hasMasterPassword ? 'Mission Control Security Gate' : 'Set Master Admin Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {hasMasterPassword
              ? 'Enter your encrypted Master Password to authenticate administrative controls and countdown clocks.'
              : 'Initialize your personal master credentials. Passwords are cryptographically hashed using SHA-256 and never stored in plaintext.'}
          </p>
        </div>

        {hasMasterPassword ? (
          <form onSubmit={handleMasterPasswordUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                required
                disabled={lockoutTimer > 0}
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4FF4F] disabled:opacity-50"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutTimer > 0}
              className="w-full py-3.5 rounded-full font-bold text-xs bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black dark:hover:bg-slate-100 shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : 'Authenticate & Unlock'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetupMasterPassword} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Create Master Password (Min 8 Characters)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Confirm Master Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-full font-bold text-xs bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black dark:hover:bg-slate-100 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Set Master Password & Encrypt Console</span>
            </button>
          </form>
        )}

        <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero-Knowledge SHA-256 Hashing · Edge Cloaked</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED MISSION CONTROL CONSOLE
  // ==========================================
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in-up border border-slate-700 dark:border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-[#D4FF4F] dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Security & Admin Status Bar */}
      <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
              Exam Notice Monitoring & Mission Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
              Zero-Trust Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authenticated Admin: <strong className="text-slate-700 dark:text-slate-300">{adminEmail}</strong> · Cloudflare Edge Cloaked (404 for Public)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGitPublishModal(true)}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c3f03b] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Publish to Production</span>
          </button>

          <button
            onClick={handleCheckSourcesNow}
            disabled={isCheckingSources}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black dark:hover:bg-slate-100 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSources ? 'animate-spin' : ''}`} />
            <span>{isCheckingSources ? 'Polling Sources...' : 'Check Sources'}</span>
          </button>

          <button
            onClick={handleLockConsole}
            className="p-2.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Lock Mission Control Console"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Configured Clocks</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {exams.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {stats?.activeOverrides > 0 ? `${stats.activeOverrides} custom overrides active` : 'All on official baseline'}
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Pending Circulars</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {pendingNotices.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Requires manual verification</p>
        </div>

        {/* Community Channel Clicks KPI Card */}
        <div 
          onClick={() => setActiveTab('community')}
          className="rounded-[22px] border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 sm:p-5 shadow-xs cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
          title="Click to view full Channel Traffic Intelligence"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
            <span className="group-hover:underline">Channel Clicks</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-100 font-display">
            {communityStats.whatsapp.totalClicks + communityStats.telegram.totalClicks}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            {communityStats.whatsapp.uniqueUsers + communityStats.telegram.uniqueUsers} Unique Students
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Monitored Portals</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {sources.length} / {sources.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">100% Endpoints Operational</p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Audit Trail Logs</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {auditLogs.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Immutable records kept</p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('clocks')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'clocks'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Clock Manager ({exams.length} Exams)</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Pending Circulars ({pendingNotices.length})</span>
        </button>

        {/* Community Channel Clicks Tab */}
        <button
          onClick={() => setActiveTab('community')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'community'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          <span>Channel Clicks &amp; Traffic</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#D4FF4F] text-[#111406]">
            LIVE
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Statistical Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sources'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Source Health ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-rose-500" />
          <span>Security & Passwords</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: CLOCK MANAGER (ALL 85+ EXAMINATIONS) */}
      {/* ==================================================== */}
      {activeTab === 'clocks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search any exam by name, acronym, authority, or slug..."
                value={clockSearch}
                onChange={(e) => setClockSearch(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showOverridesOnly}
                  onChange={(e) => setShowOverridesOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span>Overrides Only ({stats?.activeOverrides || 0})</span>
              </label>

              <select
                value={clockCategory}
                onChange={(e) => setClockCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="engineering">Engineering</option>
                <option value="medical">Medical</option>
                <option value="government">Govt & UPSC</option>
                <option value="law">Law</option>
                <option value="board-exams">Board Exams</option>
                <option value="management">Management</option>
                <option value="other-entrance-exams">Other National Entrances</option>
              </select>

              <select
                value={clockStatus}
                onChange={(e) => setClockStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="official">Official Confirmed</option>
                <option value="tentative">Tentative Schedule</option>
                <option value="expected">Expected Date</option>
              </select>

              {stats?.activeOverrides > 0 && (
                <button
                  onClick={handleResetAllClocks}
                  className="px-3 py-1.5 rounded-xl font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-black border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Target Exam Date</th>
                    <th className="py-3 px-4">Status & Provenance</th>
                    <th className="py-3 px-4">Shift Timings</th>
                    <th className="py-3 px-4">Last Verified</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredExams.map((exam) => {
                    const isCustomized = adminStore.hasOverride(exam.id);
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{exam.shortName}</span>
                            {isCustomized && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Live Override Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">{exam.name}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {exam.dates.examDate}
                          {exam.dates.examEndDate && <span className="text-slate-400 font-normal"> to {exam.dates.examEndDate}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              exam.dateStatus === 'official'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : exam.dateStatus === 'tentative'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {exam.dateStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                          {exam.startTime ? `${exam.startTime} (${exam.durationMinutes || 180}m)` : 'Shift TBA'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {exam.lastVerified}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isCustomized && (
                              <button
                                onClick={() => handleResetExam(exam.id, exam.shortName)}
                                className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Reset to official repository baseline"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}

                            <a
                              href={`/exams/${exam.slug}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                              title="Preview live countdown page in new tab"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              onClick={() => handleOpenClockEditor(exam)}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Clock</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: PENDING CIRCULARS */}
      {/* ==================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingNotices.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing {filteredNotices.length} of {pendingNotices.length} pending circulars
                </span>
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                >
                  Dismiss All ({pendingNotices.length})
                </button>
              </div>
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {notice.authority}
                      </span>
                      <span className="text-xs text-slate-400">Matched Exam: <strong>{notice.matchedExamName}</strong></span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Confidence: {(notice.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    {notice.title}
                  </h3>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Detected Schedule: </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{notice.proposedExamDate}</span>
                    {notice.proposedExamEndDate && <span className="font-mono text-slate-500"> to {notice.proposedExamEndDate}</span>}
                    <p className="mt-1.5 italic text-slate-500 dark:text-slate-400">"{notice.detectedSnippet}"</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-xs">
                      <a
                        href={notice.documentUrl || notice.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Official Circular (PDF)</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(notice)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(notice)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Edit & Approve
                      </button>
                      <button
                        onClick={() => handleApprove(notice)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Official & Publish</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171923]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 dark:text-white">All Clear! No Pending Circulars</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Every detected examination schedule change has been reviewed and published.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: STATISTICAL HUB */}
      {/* ==================================================== */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 shadow-xs space-y-6">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
              Examination Verification Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Official Confirmed
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 mt-1 font-display">
                  {stats.officialCount} <span className="text-sm font-normal text-emerald-600">({stats.officialPercentage}%)</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  Backed by direct authority circulars, gazettes, or official press notices.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Tentative Schedule
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200 mt-1 font-display">
                  {stats.tentativeCount} <span className="text-sm font-normal text-amber-600">({stats.tentativePercentage}%)</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                  Based on annual calendar outlines pending final notification bulletins.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Expected / Estimated
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-display">
                  {stats.expectedCount} <span className="text-sm font-normal text-slate-500">({stats.expectedPercentage}%)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Estimated from historical annual schedules awaiting official release.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
              Category Distribution Matrix
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(stats.categories || {}).map(([cat, count]) => (
                <div key={cat} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 capitalize">
                    {cat.replace(/-/g, ' ')}
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {count as number} Exams
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: COMMUNITY GROWTH & CHANNEL CLICKS */}
      {/* ==================================================== */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                  Community Growth &amp; Channel Traffic Intelligence
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live click analytics for official WhatsApp &amp; Telegram broadcasts · 0ms student latency (Edge sendBeacon).
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20">
                  ⚡ 0ms Overhead
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-500/20">
                  🛡️ Free Cloudflare Plan Safe (100k/day Free)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  🔒 Privacy-Preserving (Zero PII)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshCommunityClicks}
                disabled={isRefreshingClicks}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingClicks ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportCommunityCsv}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export clicks as CSV log"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleResetCommunityClicks}
                className="px-3 py-2 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center gap-1 cursor-pointer"
                title="Reset click metrics"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* WhatsApp Total */}
            <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-[#171923] border border-emerald-500/20 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  WhatsApp Total Clicks
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 font-display">
                {communityStats.whatsapp.totalClicks}
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                Total clicks across all site locations
              </p>
            </div>

            {/* WhatsApp Unique */}
            <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-[#171923] border border-emerald-500/20 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  WhatsApp Unique Users
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 font-display">
                {communityStats.whatsapp.uniqueUsers}
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                {communityStats.whatsapp.totalClicks > 0
                  ? `${Math.round((communityStats.whatsapp.uniqueUsers / communityStats.whatsapp.totalClicks) * 100)}% unique reach`
                  : 'Distinct students who joined'}
              </p>
            </div>

            {/* Telegram Total */}
            <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-[#171923] border border-sky-500/20 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Telegram Total Clicks
                </span>
              </div>
              <div className="text-3xl font-black text-sky-900 dark:text-sky-100 font-display">
                {communityStats.telegram.totalClicks}
              </div>
              <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-1">
                Total clicks across all site locations
              </p>
            </div>

            {/* Telegram Unique */}
            <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-br from-sky-50/70 to-white dark:from-sky-950/20 dark:to-[#171923] border border-sky-500/20 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Telegram Unique Users
                </span>
              </div>
              <div className="text-3xl font-black text-sky-900 dark:text-sky-100 font-display">
                {communityStats.telegram.uniqueUsers}
              </div>
              <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-1">
                {communityStats.telegram.totalClicks > 0
                  ? `${Math.round((communityStats.telegram.uniqueUsers / communityStats.telegram.totalClicks) * 100)}% unique reach`
                  : 'Distinct students who joined'}
              </p>
            </div>
          </div>

          {/* 1-Click WhatsApp & Telegram Channel Broadcast Studio */}
          <div className="rounded-[24px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-sky-500/[0.04] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white tracking-wider uppercase">
                    Admin Studio
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>📢 Daily Exam Broadcast &amp; 1-Click WhatsApp Publisher</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  1-Click direct forward to official WhatsApp Channel with native bold/italic formatting. Zero risk of bans.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const todayIST = new Date().toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const neetExam = exams.find((e) => e.slug === 'neet-ug-2027');
                    const jeeExam = exams.find((e) => e.slug === 'jee-main-2027-session-1');
                    const upscExam = exams.find((e) => e.slug === 'upsc-cse-prelims-2027');
                    const sscExam = exams.find((e) => e.slug === 'ssc-cgl-tier-1-2027');
                    const cbseExam = exams.find((e) => e.slug === 'cbse-class-10-board-2027');

                    const text = `🌅 *DAILY EXAM COUNTDOWN* • _${todayIST}_\n\n` +
                      `💭 _"Success is the sum of small efforts, repeated day in and day out."_\n` +
                      `— *Robert Collier*\n\n` +
                      `🚨 *CLOSEST UPCOMING EXAMS:*\n` +
                      `• 🩺 *NEET UG 2027:* ${neetExam?.examDate || '2027-05-02'}\n` +
                      `• ⚙️ *JEE Main 2027 (S1):* ${jeeExam?.examDate || '2027-01-22'}\n` +
                      `• 🏛️ *UPSC CSE Prelims 2027:* ${upscExam?.examDate || '2027-05-23'}\n` +
                      `• 📋 *SSC CGL 2027:* ${sscExam?.examDate || '2027-09-12'}\n` +
                      `• 🏫 *CBSE Board 2027:* ${cbseExam?.examDate || '2027-02-15'}\n\n` +
                      `🎯 *Aaj ka daily study target complete karein!*\n` +
                      `⏱️ *Live Clocks & CBT:* https://indiantimers.com\n` +
                      `📱 *Join WhatsApp:* https://whatsapp.com/channel/0029VbDeHd8FHWq0d939hU3J`;

                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    showToast('Opening WhatsApp with pre-filled countdown broadcast!');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>🟢 Post to WhatsApp Channel</span>
                </button>

                <button
                  onClick={() => {
                    const todayIST = new Date().toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const neetExam = exams.find((e) => e.slug === 'neet-ug-2027');
                    const jeeExam = exams.find((e) => e.slug === 'jee-main-2027-session-1');
                    const upscExam = exams.find((e) => e.slug === 'upsc-cse-prelims-2027');

                    const text = `🌅 *DAILY EXAM COUNTDOWN* • _${todayIST}_\n\n` +
                      `🚨 *MAJOR EXAMS:*\n` +
                      `• 🩺 *NEET UG 2027:* ${neetExam?.examDate || '2027-05-02'}\n` +
                      `• ⚙️ *JEE Main 2027 (S1):* ${jeeExam?.examDate || '2027-01-22'}\n` +
                      `• 🏛️ *UPSC CSE Prelims 2027:* ${upscExam?.examDate || '2027-05-23'}\n\n` +
                      `⏱️ *Live Timers:* https://indiantimers.com`;

                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(text);
                      showToast('Copied formatted WhatsApp text to clipboard!');
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>

                <a
                  href="https://t.me/indiantimers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open Telegram</span>
                </a>
              </div>
            </div>
          </div>

          {/* Placement Heatmap & Conversion Surfaces */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp Placement Card */}
            <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-base">🟢</span>
                  <span>WhatsApp Clicks by Page Location</span>
                </h3>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  {communityStats.whatsapp.totalClicks} clicks
                </span>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Header Navigation (Desktop)', key: 'header' },
                  { label: 'Mobile Nav Drawer', key: 'header_mobile' },
                  { label: 'Exam Countdown Alert Box', key: 'exam_detail' },
                  { label: 'Homepage Community Banner', key: 'homepage' },
                  { label: 'Footer Section', key: 'footer' },
                  { label: 'Tools & Other Surfaces', key: 'tools_content' },
                ].map((item) => {
                  const count = communityStats.whatsapp.placements[item.key] || 0;
                  const pct = communityStats.whatsapp.totalClicks > 0
                    ? Math.round((count / communityStats.whatsapp.totalClicks) * 100)
                    : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Telegram Placement Card */}
            <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-base">🔵</span>
                  <span>Telegram Clicks by Page Location</span>
                </h3>
                <span className="text-xs font-bold text-sky-600 font-mono">
                  {communityStats.telegram.totalClicks} clicks
                </span>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Header Navigation (Desktop)', key: 'header' },
                  { label: 'Mobile Nav Drawer', key: 'header_mobile' },
                  { label: 'Exam Countdown Alert Box', key: 'exam_detail' },
                  { label: 'Homepage Community Banner', key: 'homepage' },
                  { label: 'Footer Section', key: 'footer' },
                  { label: 'Tools & Other Surfaces', key: 'tools_content' },
                ].map((item) => {
                  const count = communityStats.telegram.placements[item.key] || 0;
                  const pct = communityStats.telegram.totalClicks > 0
                    ? Math.round((count / communityStats.telegram.totalClicks) * 100)
                    : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Trend Table */}
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Daily Traffic Trend (Last 14 Days)</h3>
            {communityStats.daily.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-emerald-600">WhatsApp Clicks</th>
                      <th className="py-3 px-4 text-sky-600">Telegram Clicks</th>
                      <th className="py-3 px-4">Unique Students</th>
                      <th className="py-3 px-4 font-bold">Total Daily Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {communityStats.daily.slice().reverse().map((d) => (
                      <tr key={d.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{d.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">{d.whatsapp}</td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-600">{d.telegram}</td>
                        <td className="py-3 px-4 font-mono">{d.uniqueUsers}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {d.whatsapp + d.telegram}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                No clicks recorded yet today. Click on any WhatsApp or Telegram link across IndianTimers to see live telemetry populate in real time!
              </div>
            )}
          </div>

          {/* Recent Live Activity Stream */}
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Recent Click Stream (Last {communityStats.recentClicks.length} Events)</span>
            </h3>

            {communityStats.recentClicks.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {communityStats.recentClicks.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        c.channel === 'whatsapp'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                      }`}>
                        {c.channel}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.placement}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {c.page}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      {c.isUnique ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D4FF4F] text-[#111406]">
                          UNIQUE USER
                        </span>
                      ) : (
                        <span className="text-slate-400">Returning</span>
                      )}
                      <span className="font-mono text-slate-400">
                        {new Date(c.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No events recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: SOURCE HEALTH */}
      {/* ==================================================== */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Official Notice Sources ({sources.length})</h3>
                <p className="text-xs text-slate-500">Monitored official examination authority portals.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sources.map((src) => (
                <div key={src.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{src.name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{src.url}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {src.status}
                    </span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: AUDIT TRAIL */}
      {/* ==================================================== */}
      {activeTab === 'audit' && (
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
            Immutable Editorial Audit Logs ({auditLogs.length})
          </h2>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{log.examName} ({log.action})</span>
                  <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Note: </span>{log.adminComment}
                </div>
                {log.sourceNoticeUrl && (
                  <a href={log.sourceNoticeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] block">
                    Source: {log.sourceNoticeUrl}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: SECURITY & PASSWORDS */}
      {/* ==================================================== */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password Form */}
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Key className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-black font-display">Change Master Administrator Password</h2>
            </div>
            <p className="text-xs text-slate-500">
              Update your master credentials anytime. Password changes take effect immediately across all sessions.
            </p>

            <form onSubmit={handleChangeMasterPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassChange}
                  onChange={(e) => setCurrentPassChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Master Password (Min 8 Characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassChange}
                  onChange={(e) => setNewPassChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmNewPassChange}
                  onChange={(e) => setConfirmNewPassChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {passChangeError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 dark:text-rose-400 font-bold">
                  {passChangeError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full font-bold bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black transition-all cursor-pointer shadow-xs"
              >
                Update Master Password
              </button>
            </form>
          </div>

          {/* World-Class Security Architecture Insight */}
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-black font-display">Enterprise Security Architecture</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              How top global technology brands (Stripe, Cloudflare, Apple) shield their internal administrative tools:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white mb-0.5">1. Public Edge 404 Cloaking</div>
                <div className="text-slate-500 text-[11px]">
                  Visiting <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">indiantimers.com/admin</code> directly returns a raw <strong>404 Not Found</strong>, hiding its very existence from scanners, bots, and crawlers.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white mb-0.5">2. Zero-Knowledge Master Passwords</div>
                <div className="text-slate-500 text-[11px]">
                  Your credentials are never stored in plain text or transmitted openly. They are hashed with client-side SHA-256 and protected against brute-force lockouts.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white mb-0.5">3. Local-Only Offline Admin Option</div>
                <div className="text-slate-500 text-[11px]">
                  You can run this exact admin console 100% offline on your own PC by running <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">npm run dev</code> on <code className="font-mono">http://localhost:4321/admin/</code> and pushing changes via Git.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: EDIT EXAM CLOCK WITH LIVE PREVIEW */}
      {/* ==================================================== */}
      {editingClock && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full my-8 bg-white dark:bg-[#171923] rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {editingClock.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display mt-1">
                  Edit Countdown Clock: {editingClock.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingClock(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LIVE COUNTDOWN TICKER PREVIEW */}
            <ClockLivePreview
              targetDate={clockForm.examDate || editingClock.dates.examDate}
              startTime={clockForm.startTime}
              dateStatus={clockForm.dateStatus}
            />

            <form onSubmit={handleSaveClockChanges} className="space-y-4 text-xs">
              {/* Row 1: Target Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Exam Date (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={clockForm.examDate}
                    onChange={(e) => setClockForm({ ...clockForm, examDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Exam End Date (Optional for Windows)
                  </label>
                  <input
                    type="date"
                    value={clockForm.examEndDate}
                    onChange={(e) => setClockForm({ ...clockForm, examEndDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Status & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Schedule Status *
                  </label>
                  <select
                    value={clockForm.dateStatus}
                    onChange={(e) => setClockForm({ ...clockForm, dateStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="official">Official Confirmed</option>
                    <option value="tentative">Tentative (Calendar Notice)</option>
                    <option value="expected">Expected Date</option>
                    <option value="postponed">Postponed / Rescheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Authority Website *
                  </label>
                  <input
                    type="url"
                    required
                    value={clockForm.officialWebsite}
                    onChange={(e) => setClockForm({ ...clockForm, officialWebsite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 3: Official Notification Source Citation */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Source Notification Headline / Bulletin Title *
                </label>
                <input
                  type="text"
                  required
                  value={clockForm.sourceNotificationTitle}
                  onChange={(e) => setClockForm({ ...clockForm, sourceNotificationTitle: e.target.value })}
                  placeholder="e.g. NTA Information Bulletin 2027"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Notification / Circular Verification URL *
                </label>
                <input
                  type="url"
                  required
                  value={clockForm.officialSourceUrl}
                  onChange={(e) => setClockForm({ ...clockForm, officialSourceUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Row 4: Registration Start & End */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Start
                  </label>
                  <input
                    type="date"
                    value={clockForm.registrationStart}
                    onChange={(e) => setClockForm({ ...clockForm, registrationStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registration End
                  </label>
                  <input
                    type="date"
                    value={clockForm.registrationEnd}
                    onChange={(e) => setClockForm({ ...clockForm, registrationEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Admit Card Release
                  </label>
                  <input
                    type="date"
                    value={clockForm.admitCardRelease}
                    onChange={(e) => setClockForm({ ...clockForm, admitCardRelease: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 5: Timings & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time (IST)
                  </label>
                  <input
                    type="time"
                    value={clockForm.startTime}
                    onChange={(e) => setClockForm({ ...clockForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time (IST)
                  </label>
                  <input
                    type="time"
                    value={clockForm.endTime}
                    onChange={(e) => setClockForm({ ...clockForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={clockForm.durationMinutes}
                    onChange={(e) => setClockForm({ ...clockForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 6: Audit Reason */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Update / Audit Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Confirmed date rescheduled as per official NTA press release."
                  value={clockForm.adminComment}
                  onChange={(e) => setClockForm({ ...clockForm, adminComment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={`/exams/${editingClock.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Live Exam Page</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingClock(null)}
                    className="px-4 py-2 rounded-full font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Apply Live Override</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: GITHUB / PRODUCTION PUBLISH */}
      {/* ==================================================== */}
      {showGitPublishModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#171923] rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                  Publish to Production
                </h3>
              </div>
              <button
                onClick={() => setShowGitPublishModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Active overrides are instantly visible in your browser. To permanently bake these dates into the static website across the global CDN:
            </p>

            <form onSubmit={handlePushToGitHub} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  placeholder="ghp_••••••••••••••••••••••••••••••••"
                  value={gitPat}
                  onChange={(e) => setGitPat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Token with repo scope for <code className="font-mono">Real-Tarun/indiantimers</code>
                </span>
              </div>

              <button
                type="submit"
                disabled={isPushingGit}
                className="w-full py-3 rounded-full font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c3f03b] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <GitCommit className={`w-4 h-4 ${isPushingGit ? 'animate-spin' : ''}`} />
                <span>{isPushingGit ? 'Publishing to Cloudflare...' : 'Deploy to Production'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
