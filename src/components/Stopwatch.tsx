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
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8' : 'p-6 sm:p-8 shadow-xs'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-xl mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Precision Study Stopwatch
        </span>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Digits with millisecond precision */}
      <div className="text-center my-6">
        <div className="text-6xl sm:text-7xl md:text-8xl font-black font-tabular tracking-tight text-slate-900 dark:text-slate-50 leading-none select-none">
          <span>{currentDisplay.minutes}:</span>
          <span>{currentDisplay.seconds}</span>
          <span className="text-3xl sm:text-4xl md:text-5xl text-blue-600 dark:text-blue-400 font-semibold ml-1">
            .{currentDisplay.centis}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={handleReset}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset Stopwatch (R)"
          aria-label="Reset stopwatch"
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
          aria-label={isActive ? 'Pause' : 'Start'}
        >
          {isActive ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={handleLap}
          disabled={!isActive && elapsedMs === 0}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          title="Record Lap (L)"
          aria-label="Record lap"
        >
          <Flag className="w-5 h-5" />
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
