import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundService } from '../utils/audio';
import { storageService } from '../utils/storage';
import { wakeLockService } from '../utils/wakeLock';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Mode = 'work' | 'shortBreak' | 'longBreak';

export default function PomodoroTimer() {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);

  const [mode, setMode] = useState<Mode>('work');
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [subjectLabel, setSubjectLabel] = useState('Physics / Biology / General Study');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isScreenAwake, setIsScreenAwake] = useState(wakeLockService.isActive());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Screen Wake Lock subscription
  useEffect(() => {
    const unsub = wakeLockService.subscribe((active) => {
      setIsScreenAwake(active);
    });
    return unsub;
  }, []);

  // Keep screen awake whenever studying or in fullscreen
  useEffect(() => {
    if (isActive || isFullscreen) {
      wakeLockService.acquire();
    } else {
      wakeLockService.release();
    }
    return () => {
      wakeLockService.release();
    };
  }, [isActive, isFullscreen]);

  const currentTotalSeconds =
    mode === 'work'
      ? workMinutes * 60
      : mode === 'shortBreak'
      ? shortBreakMinutes * 60
      : longBreakMinutes * 60;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentTotalSeconds - timeLeftSeconds) / currentTotalSeconds) * 100)
  );

  const handleSessionComplete = useCallback(() => {
    soundService.playSessionComplete();

    if (mode === 'work') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // optional confetti
      }

      // Log to local storage
      storageService.logStudySession({
        durationMinutes: workMinutes,
        sessionType: 'pomodoro',
        subject: subjectLabel,
      });

      const nextCompleted = completedWorkSessions + 1;
      setCompletedWorkSessions(nextCompleted);

      if (nextCompleted % sessionsBeforeLongBreak === 0) {
        setMode('longBreak');
        setTimeLeftSeconds(longBreakMinutes * 60);
      } else {
        setMode('shortBreak');
        setTimeLeftSeconds(shortBreakMinutes * 60);
      }
    } else {
      // Break concluded -> back to work
      setMode('work');
      setTimeLeftSeconds(workMinutes * 60);
    }
    setIsActive(false);
  }, [
    mode,
    workMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    completedWorkSessions,
    sessionsBeforeLongBreak,
    subjectLabel,
  ]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, handleSessionComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsActive((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 's' || e.key === 'S') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, workMinutes, shortBreakMinutes, longBreakMinutes]);

  const handleReset = () => {
    setIsActive(false);
    if (mode === 'work') setTimeLeftSeconds(workMinutes * 60);
    else if (mode === 'shortBreak') setTimeLeftSeconds(shortBreakMinutes * 60);
    else setTimeLeftSeconds(longBreakMinutes * 60);
  };

  const handleSkip = () => {
    handleSessionComplete();
  };

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

  const setPreset = (work: number, sBreak: number) => {
    setIsActive(false);
    setWorkMinutes(work);
    setShortBreakMinutes(sBreak);
    setMode('work');
    setTimeLeftSeconds(work * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8 bg-white dark:bg-[#0E1017]' : 'p-6 sm:p-8 shadow-xs'
      }`}
    >
      {/* Top Controls: Preset selector + Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 w-full max-w-xl">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full">
          <button
            onClick={() => setPreset(25, 5)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              workMinutes === 25 ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            25 / 5 Standard
          </button>
          <button
            onClick={() => setPreset(50, 10)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              workMinutes === 50 ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            50 / 10 Deep Focus
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Custom Timer Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !wakeLockService.isEnabled();
              wakeLockService.setEnabled(next);
              setIsScreenAwake(wakeLockService.isActive());
            }}
            className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isScreenAwake
                ? 'border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isScreenAwake ? 'Screen Keep-Awake is Active: Your screen will not turn off' : 'Screen Keep-Awake is Off: Click to enable'}
            aria-label="Toggle Screen Keep-Awake"
          >
            <Sun className={`w-3.5 h-3.5 ${isScreenAwake ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline text-[11px]">{isScreenAwake ? 'Screen Awake' : 'Awake Off'}</span>
          </button>
          <button
            onClick={() => {
              const nextMute = !isMuted;
              soundService.setMuted(nextMute);
              setIsMuted(nextMute);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-black/[0.06] dark:border-white/[0.08] w-full max-w-xl">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
            Custom Durations (Minutes)
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Focus</label>
              <input
                type="number"
                min="1"
                max="120"
                value={workMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 25;
                  setWorkMinutes(val);
                  if (mode === 'work' && !isActive) setTimeLeftSeconds(val * 60);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Short Break</label>
              <input
                type="number"
                min="1"
                max="30"
                value={shortBreakMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5;
                  setShortBreakMinutes(val);
                  if (mode === 'shortBreak' && !isActive) setTimeLeftSeconds(val * 60);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Long Break</label>
              <input
                type="number"
                min="1"
                max="60"
                value={longBreakMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 15;
                  setLongBreakMinutes(val);
                  if (mode === 'longBreak' && !isActive) setTimeLeftSeconds(val * 60);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode Indicator Tabs */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            mode === 'work'
              ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
              : 'text-slate-400'
          }`}
        >
          Focus Interval
        </span>
        <span
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            mode === 'shortBreak'
              ? 'bg-[#D4FF4F] text-[#111406] shadow-xs'
              : 'text-slate-400'
          }`}
        >
          Short Rest
        </span>
        <span
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            mode === 'longBreak'
              ? 'bg-[#DDD6FE] text-[#6D28D9] shadow-xs'
              : 'text-slate-400'
          }`}
        >
          Long Rest
        </span>
      </div>

      {/* Big Digits Display with Tabular Figures */}
      <div className="text-center my-6">
        <div className="text-7xl sm:text-8xl md:text-9xl font-black font-tabular tracking-tight text-slate-900 dark:text-white leading-none select-none">
          {formatTime(timeLeftSeconds)}
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full max-w-md mx-auto mt-6 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              mode === 'work' ? 'bg-[#18181B] dark:bg-[#D4FF4F]' : 'bg-[#D4FF4F]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Subject / Chapter Label Input */}
      <div className="w-full max-w-sm mx-auto mb-8">
        <input
          type="text"
          value={subjectLabel}
          onChange={(e) => setSubjectLabel(e.target.value)}
          placeholder="What are you focusing on?"
          className="w-full text-center text-xs font-semibold text-slate-700 dark:text-slate-300 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-black dark:focus:border-[#D4FF4F] focus:outline-none py-1.5"
        />
      </div>

      {/* Action Controls (Flux Pills) */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
          title="Reset timer (R)"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-8 py-3.5 rounded-full text-sm font-bold flex items-center gap-2.5 shadow-md transition-all active:scale-95 ${
            isActive
              ? 'bg-[#D4FF4F] text-[#111406] hover:bg-[#c2f038]'
              : 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] hover:bg-black'
          }`}
          aria-label={isActive ? 'Pause timer' : 'Start timer'}
        >
          {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isActive ? 'Pause Focus' : 'Start Focus'}</span>
        </button>

        <button
          onClick={handleSkip}
          className="w-12 h-12 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
          title="Skip to next session (S)"
          aria-label="Skip session"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Shortcuts Hint & Completed Count */}
      <div className="mt-8 pt-4 border-t border-black/[0.05] dark:border-white/[0.05] flex flex-wrap items-center justify-between text-[11px] text-slate-400 w-full max-w-xl">
        <span>Completed: <strong className="text-slate-800 dark:text-slate-200 font-bold">{completedWorkSessions}</strong> loops today</span>
        <span><kbd className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">Space</kbd> Start/Pause • <kbd className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">R</kbd> Reset</span>
      </div>
    </div>
  );
}
