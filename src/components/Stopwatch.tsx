import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../utils/audio';
import { Play, Pause, RotateCcw, Flag, Maximize2, Minimize2 } from 'lucide-react';

interface LapItem {
  id: number;
  lapTime: number;
  overallTime: number;
}

export default function Stopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState<LapItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startTimestampRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animFrame: number;

    const tick = () => {
      if (startTimestampRef.current !== null) {
        const now = performance.now();
        const currentDiff = now - startTimestampRef.current;
        setElapsedMs(accumulatedMsRef.current + currentDiff);
        animFrame = requestAnimationFrame(tick);
      }
    };

    if (isActive) {
      startTimestampRef.current = performance.now();
      animFrame = requestAnimationFrame(tick);
    } else {
      if (startTimestampRef.current !== null) {
        accumulatedMsRef.current += performance.now() - startTimestampRef.current;
        startTimestampRef.current = null;
      }
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isActive]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsActive((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        handleLap();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleReset = () => {
    setIsActive(false);
    startTimestampRef.current = null;
    accumulatedMsRef.current = 0;
    setElapsedMs(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isActive && elapsedMs === 0) return;
    soundService.playLapTick();
    const lastLapOverall = laps.length > 0 ? laps[0].overallTime : 0;
    const lapTime = elapsedMs - lastLapOverall;
    const newLap: LapItem = {
      id: laps.length + 1,
      lapTime,
      overallTime: elapsedMs,
    };
    setLaps([newLap, ...laps]);
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

  const formatDisplay = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return {
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0'),
      centis: centiseconds.toString().padStart(2, '0'),
    };
  };

  const currentDisplay = formatDisplay(elapsedMs);

  return (
    <div
      ref={containerRef}
      className={`rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#171923] transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8 bg-white dark:bg-[#0E1017]' : 'p-6 sm:p-8 shadow-xs'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-xl mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Precision Study Stopwatch
        </span>
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
          title="Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Digits with millisecond precision */}
      <div className="text-center my-6">
        <div className="text-6xl sm:text-7xl md:text-8xl font-black font-tabular tracking-tight text-slate-900 dark:text-white leading-none select-none">
          <span>{currentDisplay.minutes}:</span>
          <span>{currentDisplay.seconds}</span>
          <span className="text-3xl sm:text-4xl md:text-5xl text-slate-500 dark:text-[#D4FF4F] font-extrabold ml-1">
            .{currentDisplay.centis}
          </span>
        </div>
      </div>

      {/* Buttons (Flux Pills) */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
          title="Reset Stopwatch (R)"
          aria-label="Reset stopwatch"
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
          aria-label={isActive ? 'Pause' : 'Start'}
        >
          {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={handleLap}
          disabled={!isActive && elapsedMs === 0}
          className="w-12 h-12 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all disabled:opacity-40"
          title="Record Lap (L)"
          aria-label="Record lap"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* Laps List */}
      {laps.length > 0 && (
        <div className="w-full max-w-md mx-auto mt-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 font-bold text-slate-600 dark:text-slate-300 flex justify-between border-b border-slate-200 dark:border-slate-800">
            <span>Lap #</span>
            <span>Split Time</span>
            <span>Overall Time</span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
            {laps.map((lap) => {
              const split = formatDisplay(lap.lapTime);
              const overall = formatDisplay(lap.overallTime);
              return (
                <div key={lap.id} className="px-4 py-2 flex justify-between font-tabular text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-400">Lap {lap.id}</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    +{split.minutes}:{split.seconds}.{split.centis}
                  </span>
                  <span>
                    {overall.minutes}:{overall.seconds}.{overall.centis}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shortcuts */}
      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center text-[11px] text-slate-400 w-full max-w-xl">
        <span>Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Space</kbd> Start/Pause • <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">L</kbd> Lap • <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">R</kbd> Reset</span>
      </div>
    </div>
  );
}
