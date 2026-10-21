import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../utils/audio';
import { storageService } from '../utils/storage';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Clock,
} from 'lucide-react';

interface MockPreset {
  name: string;
  durationMinutes: number;
  questionCount: number;
  officialSource: string;
}

const PRESETS: MockPreset[] = [
  { name: 'NEET UG', durationMinutes: 200, questionCount: 200, officialSource: 'NTA NEET UG Bulletin (3h 20m)' },
  { name: 'JEE Main', durationMinutes: 180, questionCount: 75, officialSource: 'NTA JEE Main Bulletin (3h)' },
  { name: 'UPSC CSE Prelims', durationMinutes: 120, questionCount: 100, officialSource: 'UPSC Gazette Notification (2h)' },
  { name: 'CAT', durationMinutes: 120, questionCount: 66, officialSource: 'IIM CAT Information Bulletin (2h)' },
  { name: 'GATE', durationMinutes: 180, questionCount: 65, officialSource: 'IIT GATE Committee (3h)' },
  { name: 'CLAT UG', durationMinutes: 120, questionCount: 120, officialSource: 'Consortium of NLUs (2h)' },
  { name: 'CBSE 10/12 Board', durationMinutes: 180, questionCount: 38, officialSource: 'CBSE Examination Guidelines (3h)' },
];

export default function MockTestTimer() {
  const [selectedPresetName, setSelectedPresetName] = useState('NEET UG');
  const [durationMinutes, setDurationMinutes] = useState(200);
  const [questionCount, setQuestionCount] = useState(200);
  const [warnAt30m, setWarnAt30m] = useState(true);
  const [warnAt5m, setWarnAt5m] = useState(true);

  const [remainingSeconds, setRemainingSeconds] = useState(200 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());

  // Non-drifting timestamp references
  const targetEndTimestampRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAlerted30mRef = useRef(false);
  const hasAlerted5mRef = useRef(false);

  const handleSelectPreset = (preset: MockPreset) => {
    setIsActive(false);
    setSelectedPresetName(preset.name);
    setDurationMinutes(preset.durationMinutes);
    setQuestionCount(preset.questionCount);
    setRemainingSeconds(preset.durationMinutes * 60);
    setIsCompleted(false);
    hasAlerted30mRef.current = false;
    hasAlerted5mRef.current = false;
  };

  const handleDurationChange = (newMins: number) => {
    const val = Math.max(1, Math.min(600, newMins));
    setDurationMinutes(val);
    setSelectedPresetName('Custom Time');
    if (!isActive) {
      setRemainingSeconds(val * 60);
      setIsCompleted(false);
      hasAlerted30mRef.current = false;
      hasAlerted5mRef.current = false;
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setIsCompleted(false);
    targetEndTimestampRef.current = Date.now() + remainingSeconds * 1000;
  };

  const handlePause = () => {
    setIsActive(false);
    targetEndTimestampRef.current = null;
  };

  const handleReset = () => {
    setIsActive(false);
    setIsCompleted(false);
    targetEndTimestampRef.current = null;
    setRemainingSeconds(durationMinutes * 60);
    hasAlerted30mRef.current = false;
    hasAlerted5mRef.current = false;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (!targetEndTimestampRef.current) return;
        const now = Date.now();
        const diffMs = targetEndTimestampRef.current - now;
        const secs = Math.max(0, Math.ceil(diffMs / 1000));

        setRemainingSeconds(secs);

        // Warning alerts
        if (warnAt30m && secs <= 30 * 60 && secs > 29 * 60 && !hasAlerted30mRef.current) {
          hasAlerted30mRef.current = true;
          soundService.playWarningAlert();
        }
        if (warnAt5m && secs <= 5 * 60 && secs > 4 * 60 && !hasAlerted5mRef.current) {
          hasAlerted5mRef.current = true;
          soundService.playWarningAlert();
        }

        if (secs <= 0) {
          setIsActive(false);
          setIsCompleted(true);
          soundService.playSessionComplete();
          storageService.logStudySession({
            durationMinutes,
            sessionType: 'mock-test',
            subject: `Mock Test: ${selectedPresetName}`,
          });
          if (interval) clearInterval(interval);
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, durationMinutes, selectedPresetName, warnAt30m, warnAt5m]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const elapsedSeconds = durationMinutes * 60 - remainingSeconds;
  const timePerQuestionSeconds = questionCount > 0 ? (durationMinutes * 60) / questionCount : 0;

  const formatHMS = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8 bg-white dark:bg-[#0E1017]' : 'p-6 sm:p-8 shadow-xs rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923]'
      }`}
    >
      {/* Preset Badges Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Examination Preset or Custom Time:
          </label>
          <span className="text-xs font-bold text-indigo-600 dark:text-[#D4FF4F]">
            {durationMinutes} Minutes ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleSelectPreset(p)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedPresetName === p.name
                  ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {p.name} ({p.durationMinutes}m)
            </button>
          ))}
          <button
            onClick={() => handleDurationChange(durationMinutes)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedPresetName === 'Custom Time'
                ? 'bg-[#D4FF4F] text-[#111406] shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
            }`}
          >
            ✏️ Custom Duration
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="text-center my-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4FF4F] text-[#111406] mb-4 shadow-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{selectedPresetName} ({durationMinutes}m)</span>
        </div>

        <div className="text-6xl sm:text-7xl md:text-8xl font-black font-tabular tracking-tight text-slate-900 dark:text-white leading-none">
          {formatHMS(remainingSeconds)}
        </div>

        {/* Elapsed vs Remaining Progress */}
        <div className="flex items-center justify-between max-w-sm mx-auto text-xs text-slate-400 mt-4 px-1 font-semibold">
          <span>Elapsed: {formatHMS(elapsedSeconds)}</span>
          <span>Remaining: {formatHMS(remainingSeconds)}</span>
        </div>

        <div className="w-full max-w-md mx-auto mt-2 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#18181B] dark:bg-[#D4FF4F] transition-all duration-500"
            style={{ width: `${Math.min(100, (elapsedSeconds / (durationMinutes * 60)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Real-time Time & Question Pacing Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-black/[0.05] dark:border-white/[0.06] text-xs mb-8">
        {/* Custom Duration Input */}
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Duration (Minutes)</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={durationMinutes}
              min="1"
              max="600"
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
              className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 font-semibold">mins</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            {[30, 60, 90, 120, 180].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleDurationChange(m)}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Questions count */}
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Total Questions</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={questionCount}
              min="1"
              max="500"
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
              className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 font-semibold">items</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            For pacing accuracy
          </p>
        </div>

        {/* Recommended Pacing */}
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Pacing Target</span>
          <span className="font-extrabold text-slate-900 dark:text-[#D4FF4F] text-sm block">
            {timePerQuestionSeconds.toFixed(1)}s / Q
          </span>
          <span className="text-[10px] text-slate-400 block font-medium mt-1">
            ({(timePerQuestionSeconds / 60).toFixed(2)} min per question)
          </span>
        </div>
      </div>

      {/* Control Buttons (Flux Pills) */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={isActive ? handlePause : handleStart}
          className={`px-8 py-3.5 rounded-full text-sm font-bold flex items-center gap-2.5 shadow-md transition-all active:scale-95 ${
            isActive
              ? 'bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038]'
              : 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black'
          }`}
        >
          {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isActive ? 'Pause Exam' : 'Commence Mock Test'}</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Warning Alert Checkboxes & Mute */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={warnAt30m}
              onChange={(e) => setWarnAt30m(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Audio bell at 30 mins left</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={warnAt5m}
              onChange={(e) => setWarnAt5m(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Audio bell at 5 mins left</span>
          </label>
        </div>

        <button
          onClick={() => {
            const nextMute = !isMuted;
            soundService.setMuted(nextMute);
            setIsMuted(nextMute);
          }}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>
      </div>
    </div>
  );
}
