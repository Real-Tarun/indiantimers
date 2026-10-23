import React, { useState, useEffect } from 'react';
import type { SupporterRecord } from '../types/support.ts';
import { supportStore } from '../lib/support/store.ts';
import {
  Heart,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertCircle,
  DollarSign,
  Users,
} from 'lucide-react';

export default function AdminDonationsTab({
  adminSecretKey,
  showToast,
}: {
  adminSecretKey?: string;
  showToast: (msg: string) => void;
}) {
  const [pendingList, setPendingList] = useState<SupporterRecord[]>([]);
  const [approvedList, setApprovedList] = useState<SupporterRecord[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCollected: 0,
    pendingAmount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved'>('pending');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch admin donations
  const loadDonations = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (adminSecretKey) {
        headers['x-admin-key'] = adminSecretKey;
      }
      const res = await fetch('/api/admin/donations', { headers });
      if (res.ok) {
        const data = await res.json();
        setPendingList(data.pending || []);
        setApprovedList(data.approved || []);
        setStats(data.stats || {
          pendingCount: (data.pending || []).length,
          approvedCount: (data.approved || []).length,
          rejectedCount: 0,
          totalCollected: (data.approved || []).reduce((a: number, c: any) => a + c.amount, 0),
          pendingAmount: (data.pending || []).reduce((a: number, c: any) => a + c.amount, 0),
        });
      } else {
        // Fallback to local store
        const data = supportStore.getAdminData();
        setPendingList(data.pending);
        setApprovedList(data.approved);
        setStats(data.stats);
      }
    } catch (err) {
      // Local fallback
      const data = supportStore.getAdminData();
      setPendingList(data.pending);
      setApprovedList(data.approved);
      setStats(data.stats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [adminSecretKey]);

  // Handle Approve
  const handleApprove = async (id: string, name: string, amount: number) => {
    setActionLoadingId(id);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminSecretKey) {
        headers['x-admin-key'] = adminSecretKey;
      }
      const res = await fetch('/api/admin/donations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'approve', donationId: id }),
      });

      if (res.ok) {
        showToast(`Approved ₹${amount} contribution from ${name}! Leaderboard updated.`);
        await loadDonations();
      } else {
        // Fallback store approve
        supportStore.approveDonation(id, 'admin@indiantimers.com');
        showToast(`Approved locally: ₹${amount} from ${name}`);
        const data = supportStore.getAdminData();
        setPendingList(data.pending);
        setApprovedList(data.approved);
        setStats(data.stats);
      }
    } catch (err) {
      supportStore.approveDonation(id, 'admin@indiantimers.com');
      showToast(`Approved locally: ₹${amount} from ${name}`);
      const data = supportStore.getAdminData();
      setPendingList(data.pending);
      setApprovedList(data.approved);
      setStats(data.stats);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject
  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to dismiss the submission from ${name}?`)) return;

    setActionLoadingId(id);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminSecretKey) {
        headers['x-admin-key'] = adminSecretKey;
      }
      const res = await fetch('/api/admin/donations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'reject', donationId: id }),
      });

      if (res.ok) {
        showToast(`Dismissed donation submission from ${name}.`);
        await loadDonations();
      } else {
        supportStore.rejectDonation(id, 'admin@indiantimers.com');
        showToast(`Dismissed donation from ${name}.`);
        const data = supportStore.getAdminData();
        setPendingList(data.pending);
        setStats(data.stats);
      }
    } catch (err) {
      supportStore.rejectDonation(id, 'admin@indiantimers.com');
      showToast(`Dismissed donation from ${name}.`);
      const data = supportStore.getAdminData();
      setPendingList(data.pending);
      setStats(data.stats);
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyUtr = (utr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(utr);
      setCopiedUtr(utr);
      setTimeout(() => setCopiedUtr(null), 2000);
      showToast(`Copied UTR: ${utr}`);
    }
  };

  const filteredItems = (activeSubTab === 'pending' ? pendingList : approvedList).filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.utr.toLowerCase().includes(q) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.phone && item.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-white flex items-center gap-2">
              <span>Supporter Verification &amp; Leaderboard Console</span>
              {stats.pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-slate-950 animate-pulse">
                  {stats.pendingCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Verify 12-digit UTR numbers against your UPI bank statement, approve to update public Hall of Fame.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/support/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>View Public Support Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={loadDonations}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            {stats.pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            ₹{stats.pendingAmount.toLocaleString('en-IN')} pending verification
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approved Patrons</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            {stats.approvedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Published on Hall of Fame</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-xs col-span-2">
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Total Verified Contributions</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Reconciled against UPI ID: <code>tarun.in@fam</code>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'pending'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Pending Submissions</span>
            {stats.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-slate-950 font-black">
                {stats.pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('approved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'approved'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Approved Supporter List</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200">
              {stats.approvedCount}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by name or UTR..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4FF4F]"
          />
        </div>
      </div>

      {/* Item List / Cards */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] text-slate-400 text-xs">
          {activeSubTab === 'pending'
            ? 'No pending donation requests! All caught up.'
            : 'No approved donations found matching search.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#171923] border border-black/[0.08] dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-black text-base text-slate-900 dark:text-white">
                    {item.name}
                  </span>
                  {item.isAnonymous && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Masked Name
                    </span>
                  )}
                  <span className="font-mono font-black text-base text-emerald-600 dark:text-[#D4FF4F]">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* UTR Pill with 1-click copy */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">UTR / Transaction ID:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">
                    <span>{item.utr}</span>
                    <button
                      type="button"
                      onClick={() => copyUtr(item.utr)}
                      className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer ml-1"
                      title="Copy UTR to verify in UPI app"
                    >
                      {copiedUtr === item.utr ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {item.email && (
                    <span className="text-slate-500 dark:text-slate-400">· ✉️ {item.email}</span>
                  )}
                  {item.phone && (
                    <span className="text-slate-500 dark:text-slate-400">· 📱 {item.phone}</span>
                  )}
                </div>

                {item.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{item.message}"
                  </p>
                )}

                <div className="text-[10px] text-slate-400">
                  Submitted {new Date(item.createdAt).toLocaleString('en-IN')}
                  {item.approvedAt && ` · Approved ${new Date(item.approvedAt).toLocaleString('en-IN')}`}
                </div>
              </div>

              {/* Action Buttons for Pending */}
              {activeSubTab === 'pending' && (
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleApprove(item.id, item.name, item.amount)}
                    disabled={actionLoadingId === item.id}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Publish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(item.id, item.name)}
                    disabled={actionLoadingId === item.id}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    title="Dismiss submission"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Dismiss</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
