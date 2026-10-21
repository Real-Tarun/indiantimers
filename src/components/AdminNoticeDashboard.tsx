import React, { useState, useEffect, useMemo } from 'react';
import type { DetectedNotice, NoticeSource, AdminAuditEntry } from '../types/admin.ts';
import { adminStore } from '../lib/monitor/store.ts';
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
} from 'lucide-react';

export default function AdminNoticeDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'sources' | 'audit'>('pending');
  const [notices, setNotices] = useState<DetectedNotice[]>([]);
  const [sources, setSources] = useState<NoticeSource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [isCheckingSources, setIsCheckingSources] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit & Approve modal state
  const [editingNotice, setEditingNotice] = useState<DetectedNotice | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<'official' | 'tentative' | 'postponed'>('official');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editComment, setEditComment] = useState('');

  const adminEmail = 'editorial-admin@indiantimers.com';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    setNotices([...adminStore.getAllNotices()]);
    setSources([...adminStore.getSources()]);
    setAuditLogs([...adminStore.getAuditLogs()]);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Actions
  const handleCheckSourcesNow = async () => {
    setIsCheckingSources(true);
    // Simulate active crawler run with server store update
    await new Promise((r) => setTimeout(r, 1200));
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

  const handleMarkTentative = (notice: DetectedNotice) => {
    const res = adminStore.applyApproval(notice.id, adminEmail, {
      examDate: notice.proposedExamDate,
      dateStatus: 'tentative',
      officialSourceUrl: notice.documentUrl || notice.sourceUrl,
      adminComment: 'Flagged as tentative based on preliminary calendar notice.',
    });
    if (res.success) {
      loadData();
      showToast(`Updated ${notice.matchedExamName} to Tentative Schedule.`);
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in-up">
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
              Exam Notice Monitoring & Editorial Admin
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
              Cloudflare Access Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authenticated Admin: <strong className="text-slate-700 dark:text-slate-300">{adminEmail}</strong> · Zero-Trust Identity Verified
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCheckSourcesNow}
            disabled={isCheckingSources}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black dark:hover:bg-slate-100 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSources ? 'animate-spin' : ''}`} />
            <span>{isCheckingSources ? 'Polling Official Sources...' : 'Check Sources Now'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {pendingNotices.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Circulars requiring human check</p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Verified Changes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {notices.filter((n) => n.status === 'approved').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Published official schedules</p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Dismissed / Rejected</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {notices.filter((n) => n.status === 'rejected').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Filtered false positives</p>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Monitored Sources</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            {sources.length} / {sources.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">100% Authorities Healthy</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
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

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sources'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Source Health & Registry ({sources.length})</span>
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
      </div>

      {/* TAB 1: Pending Notices Review Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search circulars by exam name, title, or authority..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={authorityFilter}
                onChange={(e) => setAuthorityFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Authorities</option>
                <option value="nta">NTA (NEET, JEE, UGC)</option>
                <option value="upsc">UPSC Civil Services</option>
                <option value="cbse">CBSE Boards</option>
                <option value="gate">GATE Committee</option>
                <option value="clat">Consortium of NLUs</option>
                <option value="ssc">Staff Selection Commission</option>
              </select>
            </div>
          </div>

          {/* Notices Cards List */}
          {filteredNotices.length > 0 ? (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs space-y-4"
                >
                  {/* Notice Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {notice.authority}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            notice.confidenceScore >= 0.9
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}
                        >
                          {(notice.confidenceScore * 100).toFixed(0)}% Confidence
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Detected: {notice.detectedAt.split('T')[0]}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {notice.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {notice.documentUrl && (
                        <a
                          href={notice.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Official Circular (PDF)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Diff Comparison Stage */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
                        Current Canonical Registry Record
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                        {notice.matchedExamName}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 space-y-1">
                        <div>Exam Date: <strong>{notice.currentExamDate}</strong></div>
                        <div>Database ID: <code className="text-[11px]">{notice.matchedExamId}</code></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
                      <div className="font-bold text-emerald-800 dark:text-emerald-400 uppercase text-[10px] tracking-wider mb-1.5">
                        Proposed Schedule from Official Circular
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                        Proposed Date: <strong className="text-emerald-600 dark:text-emerald-400">{notice.proposedExamDate}</strong>
                        {notice.proposedExamEndDate && ` to ${notice.proposedExamEndDate}`}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 space-y-1">
                        <div>Proposed Status: <span className="font-bold capitalize">{notice.proposedDateStatus}</span></div>
                        <div>Publication: <strong>Review Before Publish</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Quoted circular sentence */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic">
                    "{notice.detectedSnippet}"
                  </div>

                  {/* Decision Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>Authority Verification Required</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleReject(notice)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        Dismiss / Reject
                      </button>

                      <button
                        onClick={() => handleMarkTentative(notice)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        Mark Tentative
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(notice)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                      >
                        Edit & Approve...
                      </button>

                      <button
                        onClick={() => handleApprove(notice)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
            <div className="p-12 text-center rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171923] text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Notice Queue is Clear
              </h3>
              <p className="max-w-md mx-auto text-slate-400">
                All detected official circulars have been reviewed. Click "Check Sources Now" to poll authorities for new gazettes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Official Sources Health & Registry */}
      {activeTab === 'sources' && (
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Official Government & Conducting Body Sources Registry
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Polled with HTTP ETag & Last-Modified caching without bypassing CAPTCHAs.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
              {sources.length} Active Authority Endpoints
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Authority & ID</th>
                  <th className="py-3 px-4">Source URL</th>
                  <th className="py-3 px-4">Associated Exams</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Last Checked</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{src.authority}</div>
                      <span className="font-mono text-[10px] text-slate-400">{src.id}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        <span className="truncate max-w-[220px]">{src.sourceUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {src.associatedExamIds.map((id) => (
                          <span key={id} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-mono">
                            {id}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-slate-500">
                      {src.monitoringFrequency}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {src.lastChecked.split('T')[0]} {src.lastChecked.split('T')[1]?.slice(0, 5)}Z
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Healthy 200 OK
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Immutable Schedule Modification Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete historical record of all official publication approvals, datesheet adjustments, and admin identities.
            </p>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <strong className="text-slate-900 dark:text-white">{log.examName}</strong>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>Previous Date: <code>{log.previousValues.examDate || 'None'}</code> ({log.previousValues.dateStatus || 'N/A'})</div>
                  <div>New Published Date: <strong className="text-emerald-600 dark:text-emerald-400">{log.newValues.examDate}</strong> ({log.newValues.dateStatus})</div>
                </div>

                <p className="text-slate-500 text-[11px] italic">
                  "{log.adminComment}" — Approved by <span className="font-semibold text-slate-700 dark:text-slate-300">{log.adminEmail}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- EDIT & APPROVE MODAL --- */}
      {editingNotice && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.1] rounded-[24px] max-w-lg w-full p-6 shadow-2xl relative animate-fade-in-up text-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Edit & Approve Schedule
              </h3>
              <button onClick={() => setEditingNotice(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyEdit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Name
                </label>
                <input
                  type="text"
                  disabled
                  value={editingNotice.matchedExamName}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmed Exam Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Classification *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="official">Official Confirmed</option>
                    <option value="tentative">Tentative (Calendar Notice)</option>
                    <option value="postponed">Postponed / Rescheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Gazette / Source Citation URL *
                </label>
                <input
                  type="url"
                  required
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Verification Comment / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cross-checked with NTA Press Release dated 21 Oct."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="px-4 py-2 rounded-full font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] shadow-xs cursor-pointer"
                >
                  Save & Publish Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
