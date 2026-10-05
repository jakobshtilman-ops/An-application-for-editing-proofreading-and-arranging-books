import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Move, ChevronDown, ChevronUp, Clock, Zap, BookOpen } from 'lucide-react';
import { Language } from '../types';

interface FloatingMiniTimerProps {
  lang: Language;
  isRunning: boolean;
  onToggleTimer: () => void;
  displaySeconds: number;
  charCount: number;
  bookName: string;
  hourlyRate: number;
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  pomodoroActive?: boolean;
  pomodoroPhase?: 'work' | 'break';
  pomodoroSecondsLeft?: number;
  onSkipPomodoroPhase?: () => void;
}

export const FloatingMiniTimer: React.FC<FloatingMiniTimerProps> = ({
  lang,
  isRunning,
  onToggleTimer,
  displaySeconds,
  charCount,
  bookName,
  isOpen,
  onClose,
  clientName,
  pomodoroActive,
  pomodoroPhase = 'work',
  pomodoroSecondsLeft = 0,
  onSkipPomodoroPhase,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 }); // offset from bottom-left
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 24,
  });

  // Calculate speed
  const speed = displaySeconds > 0 ? Math.round((charCount / displaySeconds) * 3600) : 0;

  const formatStopwatch = (totalSec: number) => {
    const s = Math.floor(totalSec);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatCountdown = (totalSec: number) => {
    const s = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header or move icon
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = dragStartRef.current.startX - e.clientX; // RTL friendly
    const deltaY = dragStartRef.current.startY - e.clientY;
    
    // Bounds clamping
    const newX = Math.max(12, Math.min(window.innerWidth - 280, dragStartRef.current.posX + deltaX));
    const newY = Math.max(12, Math.min(window.innerHeight - 150, dragStartRef.current.posY + deltaY));
    
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
        zIndex: 99999,
      }}
      className={`fixed transition-shadow select-none ${
        isDragging ? 'opacity-90 shadow-2xl scale-[1.02]' : 'opacity-100 shadow-xl'
      }`}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl text-white shadow-2xl overflow-hidden min-w-[260px] max-w-[320px]">
        {/* Header / Drag Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between px-3 py-2 bg-slate-800/90 border-b border-slate-700/50 cursor-grab active:cursor-grabbing text-xs"
        >
          <div className="flex items-center gap-1.5 font-bold text-indigo-400">
            <Move className="w-3.5 h-3.5 opacity-70" />
            <span className="truncate max-w-[130px]">{bookName || (lang === 'he' ? 'קלדנות ועריכה' : 'טייפּינג')}</span>
            {clientName && (
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-1.5 py-0.2 rounded-md max-w-[90px] truncate">
                {clientName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
              title={isMinimized ? (lang === 'he' ? 'הרחב' : 'פארגרעסערן') : (lang === 'he' ? 'מזער' : 'פארקלענערן')}
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
              title={lang === 'he' ? 'סגור חלון צף' : 'פארמאכן'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isMinimized ? (
          // Minimized Compact Pill
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-mono font-bold text-sm tracking-wider text-emerald-300">
                {formatStopwatch(displaySeconds)}
              </span>
              {pomodoroActive && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  pomodoroPhase === 'work' ? 'bg-rose-900/60 text-rose-300' : 'bg-emerald-900/60 text-emerald-300'
                }`}>
                  {pomodoroPhase === 'work' ? '🍅' : '☕'} {formatCountdown(pomodoroSecondsLeft)}
                </span>
              )}
            </div>
            <button
              onClick={onToggleTimer}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          // Expanded Full Card
          <div className="p-3.5 flex flex-col items-center gap-2.5">
            {/* Live Stopwatch Clock */}
            <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === 'he' ? 'זמן עבודה:' : 'צייט:'}</span>
              </div>
              <span className="font-mono font-black text-xl text-emerald-400 tracking-wider">
                {formatStopwatch(displaySeconds)}
              </span>
            </div>

            {/* Pomodoro Status Bar (when active) */}
            {pomodoroActive && (
              <div className={`w-full px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs ${
                pomodoroPhase === 'work'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span>{pomodoroPhase === 'work' ? '🍅' : '☕'}</span>
                  <span className="font-bold text-[11px]">
                    {pomodoroPhase === 'work'
                      ? (lang === 'he' ? 'מיקוד עבודה' : 'פאקוס')
                      : (lang === 'he' ? 'הפסקת מנוחה' : 'פאזע')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{formatCountdown(pomodoroSecondsLeft)}</span>
                  {onSkipPomodoroPhase && (
                    <button
                      onClick={onSkipPomodoroPhase}
                      className="text-[10px] underline hover:opacity-80 transition"
                      title={lang === 'he' ? 'דלג לשלב הבא' : 'איבערהיפן'}
                    >
                      {lang === 'he' ? 'דלג' : 'skip'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-2 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">{lang === 'he' ? 'תווים שהוקלדו' : 'אותיות'}</div>
                <div className="font-bold text-white font-mono">{charCount.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-2 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">{lang === 'he' ? 'מהירות לשעה' : 'שעה קצב'}</div>
                <div className="font-bold text-indigo-300 font-mono flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{speed.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Big Action Button */}
            <button
              onClick={onToggleTimer}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{lang === 'he' ? 'השהה שעון עבודה' : 'אפשטעלן זייגער'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{lang === 'he' ? 'המשך / התחל שעון' : 'אנהייבן זייגער'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
