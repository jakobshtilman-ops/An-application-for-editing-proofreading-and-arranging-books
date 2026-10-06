import React, { useState } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Pin,
  X,
  Clock,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Language, PomodoroConfig } from '../types';
import { formatStopwatchWithHundredths, formatCountdown } from '../utils/formatters';

interface DesktopMiniWindowProps {
  lang: Language;
  isRunning: boolean;
  onToggleTimer: () => void;
  displaySeconds: number;
  charCount: number;
  bookName: string;
  clientName?: string;
  hourlyRate: number;
  pomodoroConfig: PomodoroConfig;
  pomodoroPhase: 'work' | 'break';
  pomodoroSecondsLeft: number;
  onSkipPomodoroPhase?: () => void;
  onUpdateChars?: (count: number) => void;
  onAddChars?: (delta: number) => void;
  isAlwaysOnTop: boolean;
  onToggleAlwaysOnTop: () => void;
  onRestoreFullWindow: () => void;
  onCloseApp?: () => void;
}

export const DesktopMiniWindow: React.FC<DesktopMiniWindowProps> = ({
  lang,
  isRunning,
  onToggleTimer,
  displaySeconds,
  charCount,
  bookName,
  clientName,
  hourlyRate,
  pomodoroConfig,
  pomodoroPhase,
  pomodoroSecondsLeft,
  onSkipPomodoroPhase,
  onUpdateChars,
  onAddChars,
  isAlwaysOnTop,
  onToggleAlwaysOnTop,
  onRestoreFullWindow,
  onCloseApp,
}) => {
  const [customChars, setCustomChars] = useState('');
  const [showInput, setShowInput] = useState(false);
  const timeObj = formatStopwatchWithHundredths(displaySeconds);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customChars, 10);
    if (!isNaN(val) && onUpdateChars) {
      onUpdateChars(val);
      setCustomChars('');
      setShowInput(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-white flex flex-col justify-between p-3 select-none overflow-hidden font-sans border-2 border-indigo-500/40 rounded-xl shadow-2xl">
      {/* Drag & Controls Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="font-bold text-indigo-300 truncate max-w-[140px]" title={bookName}>
            {bookName || (lang === 'he' ? 'קלדנות ועריכה' : 'טייפּינג')}
          </span>
          {clientName && (
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded truncate max-w-[70px]">
              {clientName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleAlwaysOnTop}
            className={`p-1 rounded-lg transition ${
              isAlwaysOnTop ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={lang === 'he' ? 'נעוץ מעל כל חלון במחשב' : 'גענעגלט העכער אלעם'}
          >
            <Pin className={`w-3.5 h-3.5 ${isAlwaysOnTop ? 'rotate-45 fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onRestoreFullWindow}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title={lang === 'he' ? 'חזור לחלון תוכנה מלא' : 'צוריק צום גרויסן פענסטער'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {onCloseApp && (
            <button
              type="button"
              onClick={onCloseApp}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
              title={lang === 'he' ? 'סגור' : 'פארמאכן'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Clock Display with Hundredths */}
      <div className="my-auto flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline justify-center font-mono font-black tracking-tight bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner w-full">
          <span className="text-3xl sm:text-4xl text-white">{timeObj.mainTime}</span>
          <span className="text-xl sm:text-2xl text-emerald-400 font-bold ml-1">.{timeObj.hundredths}</span>
        </div>

        {/* Pomodoro status if active */}
        {pomodoroConfig.enabled && (
          <div className="mt-1.5 flex items-center justify-between w-full px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
            <span className="flex items-center gap-1 font-bold">
              <span>{pomodoroPhase === 'work' ? '🍅' : '☕'}</span>
              <span className={pomodoroPhase === 'work' ? 'text-rose-300' : 'text-emerald-300'}>
                {pomodoroPhase === 'work' ? (lang === 'he' ? 'מיקוד' : 'פאקוס') : (lang === 'he' ? 'מנוחה' : 'רואיג')}
              </span>
            </span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <span>{formatCountdown(pomodoroSecondsLeft)}</span>
              {onSkipPomodoroPhase && (
                <button
                  type="button"
                  onClick={onSkipPomodoroPhase}
                  className="text-[10px] text-slate-400 underline hover:text-white"
                  title="דלג שלב"
                >
                  דלג
                </button>
              )}
            </div>
          </div>
        )}

        {/* Characters count */}
        <div className="mt-2 flex items-center justify-between w-full text-xs px-1">
          <span className="text-slate-400 text-[11px] font-semibold">
            {lang === 'he' ? 'תווים שנעבדו:' : 'אותיות:'}
          </span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {charCount.toLocaleString()}
          </span>
        </div>

        {/* Quick Char Addition Buttons */}
        <div className="flex items-center gap-1.5 w-full mt-1.5">
          {[100, 500, 1000].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => onAddChars && onAddChars(delta)}
              className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[10px] font-mono font-bold rounded-lg border border-slate-700 transition"
            >
              +{delta.toLocaleString()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowInput(!showInput)}
            className="px-2 py-1 bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-indigo-200 text-[10px] font-bold rounded-lg border border-indigo-700 transition"
            title="הזן מספר תווים ידני"
          >
            עדכן
          </button>
        </div>

        {showInput && (
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1 w-full mt-1.5">
            <input
              type="number"
              min={0}
              autoFocus
              value={customChars}
              onChange={(e) => setCustomChars(e.target.value)}
              placeholder="מספר תווים"
              className="flex-1 p-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono outline-none"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
            >
              שמור
            </button>
          </form>
        )}
      </div>

      {/* Footer Play/Pause Button */}
      <button
        type="button"
        onClick={onToggleTimer}
        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 mt-2 ${
          isRunning
            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
        }`}
      >
        {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        <span>{isRunning ? (lang === 'he' ? 'השהה שעון' : 'אפשטעלן') : (lang === 'he' ? 'הפעל שעון' : 'אנהייבן')}</span>
      </button>
    </div>
  );
};
