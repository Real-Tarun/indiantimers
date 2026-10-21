import React, { useState, useMemo } from 'react';
import { EXAM_REGISTRY } from '../data/exams';
import { siteConfig } from '../config/site';
import { Copy, Check, Code2, Sliders, ExternalLink, Sparkles } from 'lucide-react';

export default function EmbedBuilder() {
  const [selectedExamId, setSelectedExamId] = useState<string>('neet-ug-2027');
  const [customTitle, setCustomTitle] = useState('NEET UG 2027');
  const [customDate, setCustomDate] = useState('2027-05-02');
  const [customTime, setCustomTime] = useState('14:00');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [layout, setLayout] = useState<'large' | 'compact'>('large');
  const [showLabels, setShowLabels] = useState(true);
  const [isCustom, setIsCustom] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // When exam is chosen from dropdown
  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    if (examId === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const found = EXAM_REGISTRY.find((e) => e.id === examId);
      if (found) {
        setCustomTitle(found.name);
        setCustomDate(found.dates.examDate);
        setCustomTime(found.startTime || '14:00');
      }
    }
  };

  // Build the embed URL
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (!isCustom && selectedExamId && selectedExamId !== 'custom') {
      params.set('exam', selectedExamId);
    } else {
      params.set('title', customTitle);
      params.set('date', customDate);
      if (customTime) params.set('time', customTime);
    }

    if (theme !== 'auto') params.set('theme', theme);
    if (layout !== 'large') params.set('layout', layout);
    if (!showLabels) params.set('labels', '0');

    // Use actual siteConfig production origin
    return `${siteConfig.url}/embed/countdown/?${params.toString()}`;
  }, [isCustom, selectedExamId, customTitle, customDate, customTime, theme, layout, showLabels]);

  const frameHeight = layout === 'compact' ? 140 : 220;

  // Iframe code snippet
  const embedSnippet = useMemo(() => {
    return `<iframe src="${embedUrl}" title="${customTitle} Countdown" width="100%" height="${frameHeight}" loading="lazy" style="border:0; border-radius:16px; overflow:hidden;" sandbox="allow-scripts allow-same-origin"></iframe>`;
  }, [embedUrl, customTitle, frameHeight]);

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    } catch {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Configuration Controls */}
      <div className="lg:col-span-5 rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">
            Widget Customization Controls
          </h2>
        </div>

        {/* Exam selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Examination or Target
          </label>
          <select
            value={isCustom ? 'custom' : selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <optgroup label="Verified Benchmark Exams">
              {EXAM_REGISTRY.slice(0, 20).map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.dates.examDate})
                </option>
              ))}
            </optgroup>
            <option value="custom">✏️ Custom Milestone / Coaching Test...</option>
          </select>
        </div>

        {/* Custom Inputs if custom is chosen */}
        {isCustom && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Custom Event Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Class 12 Pre-Board Chemistry"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Time (IST)
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Layout Style */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Widget Layout
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setLayout('large')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                layout === 'large'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-white font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              Large Stage (220px)
            </button>
            <button
              type="button"
              onClick={() => setLayout('compact')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                layout === 'compact'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-white font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              Compact Bar (140px)
            </button>
          </div>
        </div>

        {/* Theme Preference */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Color Theme
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'auto', label: 'Auto (System)' },
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  theme === t.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-white font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Labels toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show Units Labels (Days, Hours, Minutes, Seconds)</span>
          </label>
        </div>
      </div>

      {/* Right Column: Live Iframe Preview & Embed Code Snippet */}
      <div className="lg:col-span-7 space-y-6">
        {/* Live Preview Stage */}
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Iframe Widget Preview
              </h3>
            </div>
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Test Standalone View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Embedded iframe container */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <iframe
              src={embedUrl}
              title="Countdown Preview"
              width="100%"
              height={frameHeight}
              style={{ border: 0, borderRadius: '16px', overflow: 'hidden' }}
            />
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Rendered using sandbox isolation with zero tracking cookies or external scripts.
          </p>
        </div>

        {/* HTML Embed Snippet Box */}
        <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#171923] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                HTML Embed Snippet
              </h3>
            </div>

            <button
              onClick={handleCopySnippet}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Copied to Clipboard!' : 'Copy Embed Code'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={3}
              value={embedSnippet}
              className="w-full p-3 font-mono text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none select-all"
            />
          </div>

          {/* Quick Integration Guidance */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1.5">
            <div className="font-bold text-slate-800 dark:text-slate-200">Where can this widget be embedded?</div>
            <p>
              • <strong>WordPress & Ghost</strong>: Paste into a "Custom HTML" block.<br />
              • <strong>Notion</strong>: Type <code>/embed</code> and paste the standalone URL.<br />
              • <strong>Coaching Portals & Blogs</strong>: Insert directly into any HTML page or student LMS dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
