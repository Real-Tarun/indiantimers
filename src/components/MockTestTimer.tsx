import React, { useState, useEffect, useRef } from 'react';
import { soundService, type SoundType } from '../utils/audio';
import { storageService } from '../utils/storage';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  Bell,
} from 'lucide-react';

interface MockPreset {
  name: string;
  durationMinutes: number;
  questionCount: number;
  officialSource: string;
}

const PRESETS: MockPreset[] = [
  { name: 'NEET UG', durationMinutes: 180, questionCount: 180, officialSource: 'NTA NEET UG Pattern (3h / 180 Compulsory Qs)' },
  { name: 'JEE Main', durationMinutes: 180, questionCount: 75, officialSource: 'NTA JEE Main Bulletin (3h)' },
  { name: 'UPSC CSE Prelims', durationMinutes: 120, questionCount: 100, officialSource: 'UPSC Gazette Notification (2h)' },
  { name: 'CAT', durationMinutes: 120, questionCount: 68, officialSource: 'IIM CAT Information Bulletin (2h / 68 Qs)' },
  { name: 'GATE', durationMinutes: 180, questionCount: 65, officialSource: 'IIT GATE Committee (3h)' },
  { name: 'CLAT UG', durationMinutes: 120, questionCount: 120, officialSource: 'Consortium of NLUs (2h)' },
  { name: 'CBSE 10/12 Board', durationMinutes: 180, questionCount: 38, officialSource: 'CBSE Examination Guidelines (3h)' },
];

export default function MockTestTimer() {
  const [selectedPresetName, setSelectedPresetName] = useState('NEET UG');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [questionCount, setQuestionCount] = useState(180);
  const [warnAt30m, setWarnAt30m] = useState(true);
  const [warnAt5m, setWarnAt5m] = useState(true);
  const [warnAt1m, setWarnAt1m] = useState(false);

  const [remainingSeconds, setRemainingSeconds] = useState(180 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [soundType, setSoundType] = useState<SoundType>(soundService.getSoundType());
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  // Non-drifting timestamp references
  const targetEndTimestampRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const hasAlerted30mRef = useRef(false);
  const hasAlerted5mRef = useRef(false);
  const hasAlerted1mRef = useRef(false);

  const handleSelectPreset = (preset: MockPreset) => {
    soundService.unlockAudio();
    setIsActive(false);
    setSelectedPresetName(preset.name);
    setDurationMinutes(preset.durationMinutes);
    setQuestionCount(preset.questionCount);
    setRemainingSeconds(preset.durationMinutes * 60);
    setIsCompleted(false);
    hasAlerted30mRef.current = false;
    hasAlerted5mRef.current = false;
    hasAlerted1mRef.current = false;
  };

  const handleDurationChange = (newMins: number) => {
    soundService.unlockAudio();
    const val = Math.max(1, Math.min(600, newMins));
    setDurationMinutes(val);
    setSelectedPresetName('Custom Time');
    if (!isActive) {
      setRemainingSeconds(val * 60);
      setIsCompleted(false);
      hasAlerted30mRef.current = false;
      hasAlerted5mRef.current = false;
      hasAlerted1mRef.current = false;
    }
  };

  const handleStart = () => {
    soundService.unlockAudio();
    setIsActive(true);
    setIsCompleted(false);
    targetEndTimestampRef.current = Date.now() + remainingSeconds * 1000;
  };

  const handlePause = () => {
    soundService.unlockAudio();
    setIsActive(false);
    targetEndTimestampRef.current = null;
  };

  const handleReset = () => {
    soundService.unlockAudio();
    setIsActive(false);
    setIsCompleted(false);
    targetEndTimestampRef.current = null;
    setRemainingSeconds(durationMinutes * 60);
    hasAlerted30mRef.current = false;
    hasAlerted5mRef.current = false;
    hasAlerted1mRef.current = false;
  };

  const handleTestSound = () => {
    soundService.unlockAudio();
    setIsPlayingTestSound(true);
    soundService.testSound();
    setTimeout(() => {
      setIsPlayingTestSound(false);
    }, 1200);
  };

  const handleSoundTypeChange = (type: SoundType) => {
    soundService.unlockAudio();
    soundService.setSoundType(type);
    setSoundType(type);
    soundService.testSound();
  };

  // Timer Tick loop with timestamp drift protection
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
        if (warnAt1m && secs <= 60 && secs > 50 && !hasAlerted1mRef.current) {
          hasAlerted1mRef.current = true;
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
  }, [isActive, durationMinutes, selectedPresetName, warnAt30m, warnAt5m, warnAt1m]);

  // ─────────────────────────────────────────────────────────────────────────────
  // TRUE NATIVE BROWSER FULLSCREEN CONTROLLER
  // Hides OS taskbar, browser tabs, and URL bar for 100% pure screen takeover.
  // ─────────────────────────────────────────────────────────────────────────────
  const requestTrueNativeFullscreen = async () => {
    try {
      const el = fullscreenContainerRef.current || document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      } else if ((el as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
        await (el as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
      }
    } catch {
      // Graceful fallback if restricted by browser security policies
    }
  };

  const exitTrueNativeFullscreen = async () => {
    try {
      if (document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        }
      }
    } catch {
      // Graceful fallback
    }
  };

  const handleMaximize = () => {
    soundService.unlockAudio();
    setIsFullscreen(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    requestTrueNativeFullscreen();
  };

  const handleMinimize = () => {
    soundService.unlockAudio();
    setIsFullscreen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    exitTrueNativeFullscreen();
  };

  // Synchronize state with browser native fullscreen events (e.g. user presses Esc key)
  useEffect(() => {
    const handleNativeFullscreenChange = () => {
      const isNative = Boolean(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isNative);
      if (!isNative && typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleMinimize();
      }
      if (e.code === 'Space' && isFullscreen) {
        e.preventDefault();
        if (isActive) {
          handlePause();
        } else {
          handleStart();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleNativeFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isFullscreen, isActive]);

  const elapsedSeconds = durationMinutes * 60 - remainingSeconds;
  const timePerQuestionSeconds = questionCount > 0 ? (durationMinutes * 60) / questionCount : 0;
  const progressRatio = Math.min(1, Math.max(0, elapsedSeconds / (durationMinutes * 60)));

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formatHMS = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarningTime = remainingSeconds <= 300; // Final 5 minutes

  return (
    <div ref={containerRef} className="relative">
      {/* ─────────────────────────────────────────────────────────────────────────
          STANDARD INLINE VIEW: Clean Bento Card
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] shadow-xs transition-all relative overflow-hidden">
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
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
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
              style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
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
                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
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
                onChange={(e) => {
                  soundService.unlockAudio();
                  setQuestionCount(parseInt(e.target.value) || 1);
                }}
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
            className="w-12 h-12 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={isActive ? handlePause : handleStart}
            className={`px-8 py-3.5 rounded-full text-sm font-bold flex items-center gap-2.5 shadow-md transition-all active:scale-95 cursor-pointer ${
              isActive
                ? 'bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038]'
                : 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black dark:hover:bg-slate-100'
            }`}
            aria-label={isActive ? 'Pause Exam' : 'Commence Mock Test'}
          >
            {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isActive ? 'Pause Exam' : 'Commence Mock Test'}</span>
          </button>

          {/* Maximize to Pure Aesthetic Fullscreen */}
          <button
            onClick={handleMaximize}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 group"
            title="Full Screen True Minimalist View"
            aria-label="Maximize Full Screen"
          >
            <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Sound Options & Warning Controls Bar */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Warning Alert Checkboxes */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={warnAt30m}
                  onChange={(e) => {
                    soundService.unlockAudio();
                    soundService.playFeedback();
                    setWarnAt30m(e.target.checked);
                  }}
                  className="rounded text-blue-600 w-3.5 h-3.5 accent-[#18181B] dark:accent-[#D4FF4F] cursor-pointer"
                />
                <span>Audio bell at 30m left</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={warnAt5m}
                  onChange={(e) => {
                    soundService.unlockAudio();
                    soundService.playFeedback();
                    setWarnAt5m(e.target.checked);
                  }}
                  className="rounded text-blue-600 w-3.5 h-3.5 accent-[#18181B] dark:accent-[#D4FF4F] cursor-pointer"
                />
                <span>Audio bell at 5m left</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={warnAt1m}
                  onChange={(e) => {
                    soundService.unlockAudio();
                    soundService.playFeedback();
                    setWarnAt1m(e.target.checked);
                  }}
                  className="rounded text-blue-600 w-3.5 h-3.5 accent-[#18181B] dark:accent-[#D4FF4F] cursor-pointer"
                />
                <span>1m final warning</span>
              </label>
            </div>

            {/* Sound Mute/Unmute Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const nextMute = !isMuted;
                  soundService.unlockAudio();
                  soundService.setMuted(nextMute);
                  setIsMuted(nextMute);
                  if (!nextMute) {
                    soundService.playFeedback();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#D4FF4F]" />}
                <span className="font-semibold">{isMuted ? 'Muted' : 'Sound On'}</span>
              </button>
            </div>
          </div>

          {/* Sound Style Picker & Instant Test Bell Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-dashed border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bell Sound:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg">
                {(
                  [
                    { id: 'exam-bell', label: 'Brass Bell 🔔' },
                    { id: 'digital-chime', label: 'Digital 🎵' },
                    { id: 'gong', label: 'Gong 🧘' },
                    { id: 'marimba', label: 'Marimba 🎶' },
                  ] as const
                ).map((snd) => (
                  <button
                    key={snd.id}
                    onClick={() => handleSoundTypeChange(snd.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      soundType === snd.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Sound Button with instant audio verification */}
            <button
              onClick={handleTestSound}
              disabled={isPlayingTestSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isPlayingTestSound
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60'
              }`}
              title="Click to test warning bell sound"
            >
              <Bell className={`w-3.5 h-3.5 ${isPlayingTestSound ? 'animate-bounce' : ''}`} />
              <span>{isPlayingTestSound ? 'Ringing Bell...' : 'Test Sound 🔔'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          MILLION-DOLLAR MINIMALIST LOFI FULLSCREEN OVERLAY
          Pure Zen Typography, Zero AI Glitz, Zero Clutter, True Screen Takeover
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        ref={fullscreenContainerRef}
        className={`fixed inset-0 z-[999999] w-screen h-screen min-h-screen bg-[#08090C] text-white flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-300 ease-out ${
          isFullscreen
            ? 'opacity-100 pointer-events-auto scale-100'
            : 'opacity-0 pointer-events-none scale-[0.98]'
        }`}
        style={{ willChange: 'opacity, transform' }}
        onClick={() => {
          // Tap anywhere to pause or play
          if (isActive) handlePause();
          else handleStart();
        }}
      >
        {/* Subtle, Peaceful Lofi Warm Vignette (Not cyber neon!) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            background: isWarningTime
              ? 'radial-gradient(circle at 50% 50%, rgba(226, 153, 92, 0.07) 0%, transparent 65%)'
              : 'radial-gradient(circle at 50% 50%, rgba(250, 248, 245, 0.04) 0%, transparent 65%)',
          }}
        />

        {/* Minimalist Floating Exit Button (Top Right Only - Pure & Subtle) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMinimize();
          }}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50 p-3 sm:p-3.5 rounded-full text-white/35 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.15] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          title="Exit Fullscreen (Esc)"
          aria-label="Exit Fullscreen"
        >
          <Minimize2 className="w-5 h-5 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-95" />
        </button>

        {/* CENTERPIECE: Pure, Elegant Architectural Typography */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 w-full text-center">
          {/* Majestic Lofi Digits (Clean Rounded Zeros, No Slashes, High Aesthetic) */}
          <div
            className={`lofi-digit font-[280] tracking-tight leading-none select-none transition-all duration-500 ${
              !isActive && !isCompleted ? 'opacity-40' : 'opacity-100'
            } ${
              isWarningTime
                ? 'text-[#F3BA78] lofi-glow-amber'
                : 'text-[#FAF8F5] lofi-glow-ivory'
            }`}
            style={{
              fontSize: 'clamp(4.2rem, 16vw, 15.5rem)',
              letterSpacing: '-0.04em',
            }}
          >
            <span>{hours.toString().padStart(2, '0')}</span>
            <span className={`animate-colon-pulse mx-1 sm:mx-2 md:mx-3 font-[200] ${isWarningTime ? 'text-[#F3BA78]/40' : 'text-white/20'}`}>
              :
            </span>
            <span>{minutes.toString().padStart(2, '0')}</span>
            <span className={`animate-colon-pulse mx-1 sm:mx-2 md:mx-3 font-[200] ${isWarningTime ? 'text-[#F3BA78]/40' : 'text-white/20'}`}>
              :
            </span>
            <span>{seconds.toString().padStart(2, '0')}</span>
          </div>

          {/* Understated Zen Paused Caption */}
          {!isActive && !isCompleted && (
            <div className="text-[11px] sm:text-xs font-sans tracking-[0.25em] uppercase text-white/30 mt-6 sm:mt-8 select-none animate-pulse">
              PAUSED · TAP TO RESUME
            </div>
          )}

          {/* Clean Concluded Notice */}
          {isCompleted && (
            <div className="text-xs sm:text-sm font-sans tracking-[0.2em] uppercase text-[#F3BA78] mt-6 sm:mt-8 select-none">
              EXAMINATION CONCLUDED
            </div>
          )}
        </div>

        {/* Understated Minimalist Hairline Progress Line at Bottom Edge */}
        <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-white/[0.04] z-20 pointer-events-none">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              isWarningTime ? 'bg-[#F3BA78]/40' : 'bg-white/25'
            }`}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
