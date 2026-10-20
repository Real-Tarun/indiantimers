import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundService } from '../utils/audio';
import { storageService } from '../utils/storage';
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Request WakeLock to keep screen on while studying
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // WakeLock unsupported or rejected
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

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
    releaseWakeLock();
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
      requestWakeLock();
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
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
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
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8' : 'p-6 sm:p-8 shadow-xs'
      }`}
    >
      {/* Top Controls: Preset selector + Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 w-full max-w-xl">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setPreset(25, 5)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              workMinutes === 25 ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            25 / 5 Standard
          </button>
          <button
            onClick={() => setPreset(50, 10)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              workMinutes === 50 ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            50 / 10 Deep Focus
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg"
            title="Custom Timer Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextMute = !isMuted;
              soundService.setMuted(nextMute);
              setIsMuted(nextMute);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings Modal/Drawer */}
      {showSettings && (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 w-full max-w-xl">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
            Custom Durations (Minutes)
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Focus</label>
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
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Short Break</label>
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
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Long Break</label>
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
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode Indicator Tabs */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            mode === 'work'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
              : 'text-slate-400'
          }`}
        >
          Focus Interval
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            mode === 'shortBreak'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          Short Rest
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            mode === 'longBreak'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
              : 'text-slate-400'
          }`}
        >
          Long Rest
        </span>
      </div>

      {/* Big Digits Display with Tabular Figures */}
      <div className="text-center my-6">
        <div className="text-7xl sm:text-8xl md:text-9xl font-black font-tabular tracking-tight text-slate-900 dark:text-slate-50 leading-none select-none">
          {formatTime(timeLeftSeconds)}
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full max-w-md mx-auto mt-6 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              mode === 'work' ? 'bg-blue-600' : 'bg-emerald-500'
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
          className="w-full text-center text-xs font-medium text-slate-600 dark:text-slate-400 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none py-1"
        />
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleReset}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset timer (R)"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-2.5 shadow-md transition-transform active:scale-95 ${
            isActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          aria-label={isActive ? 'Pause timer' : 'Start timer'}
        >
          {isActive ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          <span>{isActive ? 'Pause' : 'Start Focus'}</span>
        </button>

        <button
          onClick={handleSkip}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Skip to next session (S)"
          aria-label="Skip session"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Shortcuts Hint & Completed Count */}
      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 w-full max-w-xl">
        <span>Completed: <strong className="text-slate-700 dark:text-slate-200">{completedWorkSessions}</strong> focus loops today</span>
        <span>Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Space</kbd> Start/Pause • <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">R</kbd> Reset • <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">S</kbd> Skip</span>
      </div>
    </div>
  );
}
