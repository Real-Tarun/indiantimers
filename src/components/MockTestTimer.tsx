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
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8' : 'p-6 sm:p-8 shadow-xs'
      }`}
    >
      {/* Preset Badges Bar */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
          Select Official Examination Paper Simulation:
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedPresetName === p.name
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {p.name} ({p.durationMinutes}m)
            </button>
          ))}
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="text-center my-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>{selectedPresetName} Mock Simulation</span>
        </div>

        <div className="text-6xl sm:text-7xl md:text-8xl font-black font-tabular tracking-tight text-slate-900 dark:text-slate-50 leading-none">
          {formatHMS(remainingSeconds)}
        </div>

        {/* Elapsed vs Remaining Progress */}
        <div className="flex items-center justify-between max-w-sm mx-auto text-xs text-slate-400 mt-4 px-1">
          <span>Elapsed: {formatHMS(elapsedSeconds)}</span>
          <span>Remaining: {formatHMS(remainingSeconds)}</span>
        </div>

        <div className="w-full max-w-md mx-auto mt-2 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, (elapsedSeconds / (durationMinutes * 60)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Real-time Time-per-question Pacing Insight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs mb-8">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Total Questions</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={questionCount}
              min="1"
              max="500"
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
            />
            <span className="text-slate-400">Questions</span>
          </div>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Recommended Pacing</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
            {timePerQuestionSeconds.toFixed(1)}s / question
          </span>
          <span className="text-[10px] text-slate-400 block">
            ({(timePerQuestionSeconds / 60).toFixed(2)} min)
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={handleReset}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={isActive ? handlePause : handleStart}
          className={`px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-2.5 shadow-md transition-transform active:scale-95 ${
            isActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isActive ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
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
