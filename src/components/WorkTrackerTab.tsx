import React, { useState, useEffect, useRef } from 'react';
import { WorkMode, Language, ClientRecord, PomodoroConfig } from '../types';
import { translations } from '../utils/translations';
import { playStartSound, playStopSound } from '../utils/sound';
import { formatStopwatchWithHundredths } from '../utils/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  Edit3,
  ExternalLink,
  BookOpen,
  Sliders,
  BatteryMedium,
  Clipboard,
  Info,
  StickyNote,
  Copy,
  Trash2,
  Clock3,
  Users,
  Coffee,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  EyeOff,
  Pin,
  X,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SafeStorage } from '../utils/safeStorage';
import { isDesktopApp, setDesktopAlwaysOnTop, setDesktopMiniMode } from '../utils/desktop';

interface Props {
  lang: Language;
  workMode: WorkMode;
  hourlyRate: number;
  bookName: string;
  setBookName: (name: string) => void;
  bookPages: number;
  setBookPages: (pages: number) => void;
  targetRateInput: string;
  setTargetRateInput: (rate: string) => void;
  totalBookChars: number;
  setTotalBookChars: (chars: number) => void;
  clipboardText: string;
  setClipboardText: (text: string) => void;
  manualChars: number;
  setManualChars: (chars: number) => void;
  quickNotes: string;
  setQuickNotes: (notes: string) => void;
  accumulatedSeconds: number;
  setAccumulatedSeconds: React.Dispatch<React.SetStateAction<number>>;
  onOpenManualAdjust: () => void;
  onOpenResetConfirm: () => void;
  onSessionRecorded: (elapsedSeconds: number, chars: number, rate: number) => void;
  showToast: (msg: string) => void;
  isRunning: boolean;
  toggleTimer: () => void;
  displaySeconds: number;
  onOpenFloatingMini: () => void;
  clients?: ClientRecord[];
  selectedClientId?: string;
  onSelectClient?: (client: ClientRecord | null) => void;
  onOpenClientsTab?: () => void;
  pomodoroConfig: PomodoroConfig;
  onTogglePomodoro: () => void;
  pomodoroPhase: 'work' | 'break';
  pomodoroSecondsLeft: number;
  pomodoroCompletedCycles: number;
  onSkipPomodoroPhase: () => void;
  isAlwaysOnTop?: boolean;
  onToggleAlwaysOnTop?: () => void;
  isMiniWindowMode?: boolean;
  onToggleMiniWindowMode?: () => void;
}

export const WorkTrackerTab: React.FC<Props> = ({
  lang,
  workMode,
  hourlyRate,
  bookName,
  setBookName,
  bookPages,
  setBookPages,
  targetRateInput,
  setTargetRateInput,
  totalBookChars,
  setTotalBookChars,
  clipboardText,
  setClipboardText,
  manualChars,
  setManualChars,
  quickNotes,
  setQuickNotes,
  accumulatedSeconds,
  setAccumulatedSeconds,
  onOpenManualAdjust,
  onOpenResetConfirm,
  onSessionRecorded,
  showToast,
  isRunning,
  toggleTimer,
  displaySeconds,
  onOpenFloatingMini,
  clients = [],
  selectedClientId = '',
  onSelectClient,
  onOpenClientsTab,
  pomodoroConfig,
  onTogglePomodoro,
  pomodoroPhase,
  pomodoroSecondsLeft,
  pomodoroCompletedCycles,
  onSkipPomodoroPhase,
  isAlwaysOnTop,
  onToggleAlwaysOnTop,
  isMiniWindowMode,
  onToggleMiniWindowMode,
}) => {
  const t = translations[lang];

  // Panel collapse/expand states
  const [isBookConfigOpen, setIsBookConfigOpen] = useState(() => {
    return SafeStorage.getItem('pane_bookConfig') !== 'false';
  });
  const [isEstimatesOpen, setIsEstimatesOpen] = useState(() => {
    return SafeStorage.getItem('pane_estimates') !== 'false';
  });
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(() => {
    return SafeStorage.getItem('pane_stopwatch') !== 'false';
  });
  const [isPasteSimOpen, setIsPasteSimOpen] = useState(() => {
    return SafeStorage.getItem('pane_pasteSim') !== 'false';
  });
  const [isNotesOpen, setIsNotesOpen] = useState(() => {
    return SafeStorage.getItem('pane_notes') !== 'false';
  });
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(() => {
    return SafeStorage.getItem('pane_performance') !== 'false';
  });

  // Panel close/hide states (allows closing/hiding any panel including the main panel)
  const [hiddenPanes, setHiddenPanes] = useState<Record<string, boolean>>(() => {
    try {
      const saved = SafeStorage.getItem('hidden_panes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleHidePane = (key: string) => {
    setHiddenPanes((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      SafeStorage.setItem('hidden_panes', JSON.stringify(next));
      const titles: Record<string, string> = {
        stopwatch: lang === 'he' ? 'שעון עבודה ראשי' : 'ארבעט זייגער',
        bookConfig: lang === 'he' ? 'הגדרות ספר ולקוח' : 'ספר דעטאלן',
        estimates: lang === 'he' ? 'מדדים והערכות בזמן אמת' : 'פראגרעס און שאצונגען',
        pasteSim: lang === 'he' ? 'הזנת תווים והדבקה' : 'אותיות אריינלייגן',
        notes: lang === 'he' ? 'הערות ומשימות לספר' : 'נאטיצן',
        performance: lang === 'he' ? 'מדד מהירות וביצועים' : 'שנעלקייט מעסטער',
      };
      if (next[key]) {
        showToast(lang === 'he' ? `חלונית "${titles[key] || key}" נסגרה (ניתן לפתוח מחדש בסרגל הניהול העליון)` : `פאנעל "${titles[key] || key}" פארמאכט`);
      } else {
        showToast(lang === 'he' ? `חלונית "${titles[key] || key}" נפתחה מחדש!` : `פאנעל "${titles[key] || key}" ווידער אפן!`);
      }
      return next;
    });
  };

  const restoreAllPanes = () => {
    setHiddenPanes({});
    SafeStorage.setItem('hidden_panes', JSON.stringify({}));
    expandAllPanes();
    showToast(lang === 'he' ? 'כל החלוניות נפתחו והוצגו מחדש!' : 'אלע פאנעלן זענען ווידער אפן!');
  };

  const togglePane = (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter((prev) => {
      const next = !prev;
      SafeStorage.setItem(`pane_${key}`, String(next));
      return next;
    });
  };

  const expandAllPanes = () => {
    setIsBookConfigOpen(true);
    setIsEstimatesOpen(true);
    setIsStopwatchOpen(true);
    setIsPasteSimOpen(true);
    setIsNotesOpen(true);
    setIsPerformanceOpen(true);
    setHiddenPanes({});
    SafeStorage.setItem('hidden_panes', JSON.stringify({}));
    ['bookConfig', 'estimates', 'stopwatch', 'pasteSim', 'notes', 'performance'].forEach((k) =>
      SafeStorage.setItem(`pane_${k}`, 'true')
    );
    showToast(lang === 'he' ? 'כל החלוניות נפתחו!' : 'אלע פענסטערס זענען אפן!');
  };

  const collapseAllPanes = () => {
    setIsBookConfigOpen(false);
    setIsEstimatesOpen(false);
    setIsStopwatchOpen(false);
    setIsPasteSimOpen(false);
    setIsNotesOpen(false);
    setIsPerformanceOpen(false);
    ['bookConfig', 'estimates', 'stopwatch', 'pasteSim', 'notes', 'performance'].forEach((k) =>
      SafeStorage.setItem(`pane_${k}`, 'false')
    );
    showToast(lang === 'he' ? 'כל החלוניות קופלו לתצוגה קומפקטית!' : 'אלע פענסטערס פארמאכט!');
  };

  const setFocusMode = () => {
    setIsBookConfigOpen(false);
    setIsEstimatesOpen(false);
    setIsStopwatchOpen(true);
    setIsPasteSimOpen(true);
    setIsNotesOpen(false);
    setIsPerformanceOpen(false);
    setHiddenPanes({});
    SafeStorage.setItem('hidden_panes', JSON.stringify({}));
    ['bookConfig', 'estimates', 'notes', 'performance'].forEach((k) =>
      SafeStorage.setItem(`pane_${k}`, 'false')
    );
    ['stopwatch', 'pasteSim'].forEach((k) =>
      SafeStorage.setItem(`pane_${k}`, 'true')
    );
    showToast(lang === 'he' ? 'מצב מיקוד הופעל: רק השעון והתווים מוצגים!' : 'פאקוס מאד אקטיוו!');
  };

  // Derived character count: clean clipboard text & take max
  const cleanClipboard = clipboardText.replace(/\r/g, '').replace(/\n/g, '').replace(/\s/g, ' ');
  const clipboardCharCount = cleanClipboard.length;
  const finalCharCount = Math.max(clipboardCharCount, manualChars);

  // Target rate calculation
  const targetRateNum = parseFloat(targetRateInput);
  const isFlexible = isNaN(targetRateNum) || targetRateNum <= 0 || targetRateInput.includes('גמיש') || targetRateInput.trim() === '';
  const effectiveTargetRate = isFlexible ? 4500 : targetRateNum;

  // Real-time speed & payouts
  const currentElapsed = displaySeconds;
  const bookHours = currentElapsed / 3600;
  const currentSpeed = currentElapsed > 0 ? (finalCharCount / currentElapsed) * 3600 : 0;

  let computedEarnings = 0;
  if (workMode === 'regular') {
    computedEarnings = (finalCharCount / effectiveTargetRate) * 45;
  } else {
    computedEarnings = bookHours * hourlyRate;
  }

  // Progress calculations
  const progressRatio = totalBookChars > 0 ? Math.min((finalCharCount / totalBookChars) * 100, 100) : 0;
  const remainingChars = Math.max(totalBookChars - finalCharCount, 0);

  // Target hours & expected payout at finish
  const targetTotalHours = totalBookChars > 0 ? totalBookChars / effectiveTargetRate : 0;
  let expectedPaymentEnd = 0;
  if (workMode === 'regular') {
    expectedPaymentEnd = targetTotalHours * 45;
  } else {
    expectedPaymentEnd = targetTotalHours * hourlyRate;
  }

  const remainingHours = currentSpeed > 0 ? remainingChars / currentSpeed : (remainingChars / effectiveTargetRate);

  // Pages speed
  const charsPerPage = bookPages > 0 ? totalBookChars / bookPages : 500;
  const activeSpeedEstimate = currentSpeed > 0 ? currentSpeed : effectiveTargetRate;
  const pagesPerHour = charsPerPage > 0 ? activeSpeedEstimate / charsPerPage : 0;
  const minutesPerPage = pagesPerHour > 0 ? 60 / pagesPerHour : 0;
  const actualHourlyWage = bookHours > 0 ? computedEarnings / bookHours : 0;

  // Performance Ring
  const performancePercentage = effectiveTargetRate > 0 ? (currentSpeed / effectiveTargetRate) * 100 : 0;
  const timeObj = formatStopwatchWithHundredths(displaySeconds);

  // Latest state ref for PiP window sync
  const latestStateRef = useRef({
    displaySeconds,
    isRunning,
    finalCharCount,
    bookName,
    manualChars,
  });

  useEffect(() => {
    latestStateRef.current = {
      displaySeconds,
      isRunning,
      finalCharCount,
      bookName,
      manualChars,
    };
  }, [displaySeconds, isRunning, finalCharCount, bookName, manualChars]);

  // Picture in Picture & Floating Mini Widget
  const handleFloatingPiP = async () => {
    // 1. If running inside Desktop EXE (Electron or Tauri):
    if (isDesktopApp()) {
      if (onToggleMiniWindowMode) {
        onToggleMiniWindowMode();
      } else {
        await setDesktopMiniMode(true);
        await setDesktopAlwaysOnTop(true);
      }
      showToast(
        lang === 'he'
          ? '📌 חלון צף שולחני הופעל ומעוגן מעל כל חלונות המחשב (Word, PDF וכו\')!'
          : 'פלאטינג פענסטער אקטיווירט העכער אלע פראגראמען!'
      );
      return;
    }

    // 2. In Web browser: open in-app Draggable Floating Mini Widget (works 100% reliably in all browsers)
    onOpenFloatingMini();

    // 3. Also attempt native Document Picture-in-Picture if supported by the browser
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as unknown as {
          documentPictureInPicture: {
            requestWindow: (options: { width: number; height: number }) => Promise<Window>;
          };
        }).documentPictureInPicture.requestWindow({
          width: 320,
          height: 250,
        });

        // Copy styles
        [...document.styleSheets].forEach((sheet) => {
          try {
            const rules = [...sheet.cssRules].map((r) => r.cssText).join('');
            const style = document.createElement('style');
            style.textContent = rules;
            pipWindow.document.head.appendChild(style);
          } catch {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href || '';
            if (link.href) pipWindow.document.head.appendChild(link);
          }
        });

        const pipDiv = document.createElement('div');
        pipDiv.className =
          'bg-slate-950 text-white p-4 h-full flex flex-col items-center justify-center font-sans select-none text-center';
        pipDiv.style.direction = 'rtl';

        pipDiv.innerHTML = `
          <div class="text-xs text-indigo-400 font-bold mb-1 truncate max-w-[280px]">${bookName || t.app_title}</div>
          <div id="pip-timer" class="text-2xl font-mono font-black text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl shadow-inner mb-2 tracking-tight">
            ${timeObj.full}
          </div>
          <div class="text-[11px] text-slate-300 mb-2 flex items-center justify-center gap-1.5">
            <span>${t.progress_worked_chars}</span>
            <strong id="pip-chars" class="text-emerald-400 font-mono font-bold">${finalCharCount.toLocaleString()}</strong>
          </div>
          <div class="flex items-center justify-center gap-1.5 mb-3 w-full">
            <button id="pip-btn-add100" class="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold rounded-lg border border-slate-700">+100</button>
            <button id="pip-btn-add500" class="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold rounded-lg border border-slate-700">+500</button>
            <button id="pip-btn-add1000" class="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold rounded-lg border border-slate-700">+1K</button>
            <button id="pip-btn-custom" class="px-2 py-1 bg-indigo-900 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold rounded-lg border border-indigo-700">עדכן</button>
          </div>
          <button id="pip-btn-toggle" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md">
            ${isRunning ? (lang === 'he' ? 'השהה שעון' : 'אפשטעלן') : (lang === 'he' ? 'הפעל שעון' : 'אנהייבן')}
          </button>
        `;

        pipWindow.document.body.appendChild(pipDiv);

        // Live updater inside PiP window
        const pipInterval = setInterval(() => {
          const timerEl = pipWindow.document.getElementById('pip-timer');
          const charsEl = pipWindow.document.getElementById('pip-chars');
          const btnToggle = pipWindow.document.getElementById('pip-btn-toggle');
          if (timerEl) {
            timerEl.textContent = formatStopwatchWithHundredths(latestStateRef.current.displaySeconds).full;
          }
          if (charsEl) {
            charsEl.textContent = latestStateRef.current.finalCharCount.toLocaleString();
          }
          if (btnToggle) {
            btnToggle.textContent = latestStateRef.current.isRunning
              ? (lang === 'he' ? 'השהה שעון' : 'אפשטעלן')
              : (lang === 'he' ? 'הפעל שעון' : 'אנהייבן');
            btnToggle.className = latestStateRef.current.isRunning
              ? 'w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all'
              : 'w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all';
          }
        }, 50);

        pipWindow.addEventListener('pagehide', () => {
          clearInterval(pipInterval);
        });

        // Click handlers in PiP window
        pipWindow.document.getElementById('pip-btn-toggle')?.addEventListener('click', () => {
          toggleTimer();
        });

        const addCharsToTracker = (amount: number) => {
          setManualChars(Math.max(latestStateRef.current.finalCharCount + amount, latestStateRef.current.manualChars + amount));
        };

        pipWindow.document.getElementById('pip-btn-add100')?.addEventListener('click', () => addCharsToTracker(100));
        pipWindow.document.getElementById('pip-btn-add500')?.addEventListener('click', () => addCharsToTracker(500));
        pipWindow.document.getElementById('pip-btn-add1000')?.addEventListener('click', () => addCharsToTracker(1000));
        pipWindow.document.getElementById('pip-btn-custom')?.addEventListener('click', () => {
          const val = pipWindow.prompt('הזן מספר תווים חדש לספר זה:');
          if (val) {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num >= 0) setManualChars(num);
          }
        });
      } catch (e) {
        console.warn('Document Picture-in-Picture fallback triggered', e);
      }
    }

    showToast(lang === 'he' ? 'חלון צף הופעל! ניתן להזיז ולמזער אותו בחופשיות.' : 'פלאָוטינג זייגער אקטיווירט!');
  };

  const formatCountdown = (totalSec: number) => {
    const s = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <section className="grid grid-cols-1 gap-6">
      {/* Master Panels Bar (Open / Close All & Focus Mode) */}
      <div className="bg-slate-900/95 text-white p-3 px-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-200">
            {lang === 'he' ? 'ניהול חלוניות ותצוגה:' : 'פאנעלן קאנטראל:'}
          </span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            {lang === 'he' ? 'סגור ופתח כל חלונית בנפרד לפי נוחות העבודה' : 'עפענען און פארמאכן אלע חלוניות'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={expandAllPanes}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 border border-slate-700"
            title="פתח את כל החלוניות בתוכנה"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'he' ? 'פתח הכל' : 'עפענען אלע'}</span>
          </button>
          <button
            type="button"
            onClick={collapseAllPanes}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 border border-slate-700"
            title="קפל את כל החלוניות לתצוגה קומפקטית"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'he' ? 'קפל הכל' : 'פארמאכן אלע'}</span>
          </button>
          <button
            type="button"
            onClick={setFocusMode}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-sm"
            title="מצב מיקוד: מציג אך ורק את השעון וספירת התווים ללא הסחות דעת"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{lang === 'he' ? 'מצב מיקוד' : 'פאקוס מאד'}</span>
          </button>

          {onToggleAlwaysOnTop && (
            <button
              type="button"
              onClick={onToggleAlwaysOnTop}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                isAlwaysOnTop
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="נעץ חלון זה תמיד מעל כל חלון אחר במחשב (Word, WordPad וכו')"
            >
              <Pin className={`w-3.5 h-3.5 ${isAlwaysOnTop ? 'rotate-45 fill-current' : ''}`} />
              <span>{isAlwaysOnTop ? (lang === 'he' ? 'מעל כולם 📌' : 'גענעגלט') : (lang === 'he' ? 'נעץ מעל כולם' : 'נעגלען')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Card: Book Configuration */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/80 card-shadow p-5 sm:p-6 transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>{t.book_init_title}</span>
            </h3>
            {!isBookConfigOpen && (
              <span className="text-xs text-slate-500 font-mono font-semibold bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 truncate max-w-[280px]">
                {bookName || 'ספר ללא שם'} | {bookPages} עמ' | {targetRateInput || '4500'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">
              {t.book_init_badge}
            </span>
            <button
              type="button"
              onClick={() => togglePane('bookConfig', setIsBookConfigOpen)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              title={isBookConfigOpen ? 'קפל חלונית הגדרות ספר' : 'פתח חלונית הגדרות ספר'}
            >
              {isBookConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isBookConfigOpen && (
          <div>
            {/* Client Selector Bar */}
            {clients && clients.length > 0 && (
              <div className="mb-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-950">
                    {lang === 'he' ? 'שיוך לקוח / מו"ל לספר:' : 'פארבינדן קליענט:'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedClientId || ''}
                    onChange={(e) => {
                      const found = clients.find((c) => c.id === e.target.value) || null;
                      if (onSelectClient) onSelectClient(found);
                    }}
                    className="bg-white border border-indigo-200 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
                  >
                    <option value="">{lang === 'he' ? 'ללא לקוח (הגדרה ידנית)' : 'אן א קליענט'}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.defaultMode === 'regular' ? `${c.defaultRate} תווים ל-45₪` : `${c.defaultRate} ₪/שעה`})
                      </option>
                    ))}
                  </select>

                  {onOpenClientsTab && (
                    <button
                      type="button"
                      onClick={onOpenClientsTab}
                      className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition"
                      title="נהל את רשימת הלקוחות"
                    >
                      {lang === 'he' ? 'נהל לקוחות' : 'קליענטן'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Book Name */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.input_book_name}</label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder={t.placeholder_book_name}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Book Pages */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.input_pages}</label>
                <input
                  type="number"
                  min={1}
                  value={bookPages}
                  onChange={(e) => setBookPages(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Target Rate */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  {workMode === 'hourly' ? t.input_target_rate_flexible : t.input_target_rate}
                </label>
                <input
                  type="text"
                  value={targetRateInput}
                  onChange={(e) => setTargetRateInput(e.target.value)}
                  placeholder={workMode === 'hourly' ? t.flexible_target_placeholder : '4500'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Total Book Characters */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.input_total_chars}</label>
                <input
                  type="number"
                  min={1}
                  value={totalBookChars}
                  onChange={(e) => setTotalBookChars(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Estimates & Progress Bar Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 card-shadow p-5 sm:p-6 transition-all">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <BatteryMedium className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">
              {lang === 'he' ? 'חלונית מדדים והערכות בזמן אמת' : 'פראגרעס און שאצונגען'}
            </span>
            {!isEstimatesOpen && (
              <span className="text-xs font-bold text-indigo-600 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {progressRatio.toFixed(1)}% | {finalCharCount.toLocaleString()} תווים | ₪{computedEarnings.toFixed(2)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => togglePane('estimates', setIsEstimatesOpen)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            title={isEstimatesOpen ? 'קפל חלונית מדדים' : 'פתח חלונית מדדים'}
          >
            {isEstimatesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isEstimatesOpen && (
          <div>
            {/* Real-time Estimates Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.stat_expected_hours}</p>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                  {isFlexible && workMode === 'hourly'
                    ? t.lbl_actual_time_estimate
                    : `${targetTotalHours.toFixed(1)} ש'`}
                </p>
              </div>

              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-center">
                <p className="text-[10px] text-indigo-500 font-bold uppercase">{t.stat_expected_pay}</p>
                <p className="text-sm font-extrabold text-indigo-950 mt-0.5">
                  ₪{expectedPaymentEnd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] text-emerald-600 font-bold uppercase">{t.stat_actual_pay}</p>
                <p className="text-sm font-extrabold text-emerald-950 mt-0.5">
                  ₪{computedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.stat_remaining_chars}</p>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">{remainingChars.toLocaleString()}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.stat_remaining_time}</p>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                  {remainingHours > 0 ? `${remainingHours.toFixed(1)} ש'` : t.lbl_waiting_for_work}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <BatteryMedium className="w-4 h-4 text-indigo-500" />
                  <span>{t.progress_indicator}</span>
                </span>
                <span className="text-indigo-700 font-mono font-bold">{progressRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressRatio}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-semibold">
                <span>
                  {t.progress_worked_chars} <span className="font-mono text-slate-700 font-bold">{finalCharCount.toLocaleString()}</span>
                </span>
                <span>
                  {t.progress_total_target} <span className="font-mono text-slate-700 font-bold">{totalBookChars.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Stopwatch and Character Inputs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Stopwatch Card */}
          <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden p-8 flex flex-col items-center justify-center relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 border ${
                  isRunning
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : displaySeconds > 0
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                  }`}
                />
                <span>{isRunning ? t.status_active : displaySeconds > 0 ? t.status_paused : t.status_inactive}</span>
              </span>
            </div>

            <div className="absolute top-4 left-4">
              <button
                type="button"
                onClick={handleFloatingPiP}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                title={t.btn_pip_title}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t.btn_pip}</span>
              </button>
            </div>

            <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">
              {t.cumulative_time_label}
            </h2>

            {/* Stopwatch Display with Hundredths */}
            <div className="flex items-baseline justify-center font-mono font-black tracking-tight text-slate-900 bg-slate-50 border border-slate-100 px-8 py-6 rounded-3xl shadow-inner select-none mb-8">
              <span className="text-5xl sm:text-6xl">{timeObj.mainTime}</span>
              <span className="text-2xl sm:text-3xl text-emerald-500 font-bold ml-1.5">.{timeObj.hundredths}</span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
              <button
                type="button"
                onClick={toggleTimer}
                className={`flex-grow flex items-center justify-center gap-2.5 font-bold py-4 px-6 rounded-2xl shadow-lg transition-all text-lg active:scale-95 ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isRunning ? t.btn_stop_session : displaySeconds > 0 ? t.btn_resume_session : t.btn_start_session}</span>
              </button>

              <button
                type="button"
                onClick={onOpenManualAdjust}
                className="p-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2"
                title={t.btn_manual_adjust_title}
              >
                <Edit3 className="w-5 h-5" />
                <span className="sm:inline hidden">{t.btn_manual_adjust}</span>
              </button>

              <button
                type="button"
                onClick={onOpenResetConfirm}
                className="p-4 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 font-bold rounded-2xl transition-all border border-rose-200 flex items-center justify-center gap-2"
                title={t.btn_reset_title}
              >
                <RotateCcw className="w-5 h-5" />
                <span className="sm:inline hidden">{t.btn_reset}</span>
              </button>
            </div>

            {/* Pomodoro Timer Bar */}
            <div className="w-full max-w-md mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-3">
              <div className="w-full flex items-center justify-between text-xs bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={onTogglePomodoro}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 ${
                    pomodoroConfig.enabled
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title={pomodoroConfig.enabled ? 'כבה מצב פומודורו' : 'הפעל מצב פומודורו מובנה (25 דק עבודה + 5 דק מנוחה)'}
                >
                  <span className="text-sm">🍅</span>
                  <span>{lang === 'he' ? 'מצב פומודורו (25/5)' : 'פאָמאָדאָראָ מאד'}</span>
                  <span className={`w-2 h-2 rounded-full ${pomodoroConfig.enabled ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                </button>

                {pomodoroConfig.enabled ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${
                      pomodoroPhase === 'work'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {pomodoroPhase === 'work'
                        ? (lang === 'he' ? '🍅 עבודה: ' : '🍅 ארבעט: ')
                        : (lang === 'he' ? '☕ מנוחה: ' : '☕ רואיג: ')}
                      {formatCountdown(pomodoroSecondsLeft)}
                    </span>
                    <button
                      type="button"
                      onClick={onSkipPomodoroPhase}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 underline font-medium"
                      title={lang === 'he' ? 'דלג לשלב הבא' : 'איבערהיפן'}
                    >
                      {lang === 'he' ? 'דלג שלב' : 'skip'}
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    {lang === 'he' ? 'עבודה מרוכזת עם הפסקות מנוחה' : 'פאקוס ארבעט מיט רואיגע פאזעס'}
                  </span>
                )}
              </div>

              {pomodoroConfig.enabled && pomodoroCompletedCycles > 0 && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-semibold">
                  <span>{lang === 'he' ? 'סבבים שהושלמו היום:' : 'פארטיגע סבבים:'}</span>
                  <span className="text-rose-600 font-bold">
                    {'🍅'.repeat(Math.min(pomodoroCompletedCycles, 6))} ({pomodoroCompletedCycles})
                  </span>
                </div>
              )}
            </div>

            {/* Mini Totals */}
            <div className="grid grid-cols-2 gap-4 w-full mt-8 pt-8 border-t border-slate-100">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-semibold">{t.lbl_total_seconds}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{displaySeconds.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-semibold">{t.lbl_acc_earnings}</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  ₪{computedEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Character Input Simulator */}
          <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-indigo-500" />
              <span>{t.paste_sim_title}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{t.paste_sim_desc}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  {t.lbl_paste_clipboard}
                </label>
                <textarea
                  value={clipboardText}
                  onChange={(e) => setClipboardText(e.target.value)}
                  placeholder={t.placeholder_clipboard}
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all custom-scrollbar outline-none resize-none"
                />
                <div className="flex items-center justify-between mt-1 px-1">
                  <span className="text-xs font-semibold text-slate-400">{t.lbl_chars_in_clipboard}</span>
                  <span className="text-xs font-bold text-indigo-600 font-mono">
                    {clipboardCharCount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  {t.lbl_manual_correction}
                </label>
                <input
                  type="number"
                  min={0}
                  value={manualChars || ''}
                  onChange={(e) => setManualChars(Math.max(0, Number(e.target.value) || 0))}
                  placeholder={t.placeholder_manual_correction}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
                <p className="text-xs text-slate-400 mt-2">{t.manual_correction_hint}</p>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-indigo-950">{t.lbl_final_chars_worked}</h4>
                <p className="text-xs text-indigo-600/80 mt-0.5">{t.final_chars_worked_hint}</p>
              </div>
              <div className="text-2xl font-black text-indigo-700 font-mono">
                {finalCharCount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Notes Card for the Current Book */}
          <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-3xl border border-amber-200/60 card-shadow p-6 relative">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200/50">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>{t.quick_notes_title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold">
                      {t.notes_saved_local}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">{t.quick_notes_desc}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}] `;
                    setQuickNotes((quickNotes ? quickNotes + '\n' : '') + timeStr);
                    showToast(lang === 'he' ? 'חותמת זמן נוספה לפתק!' : 'צייט צוגעלייגט צום נאטיץ!');
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 flex items-center gap-1.5 transition-all shadow-2xs"
                  title={t.btn_timestamp_notes}
                >
                  <Clock3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">{t.btn_timestamp_notes}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!quickNotes.trim()) return;
                    try {
                      await navigator.clipboard.writeText(quickNotes);
                      showToast(t.notes_copied_toast);
                    } catch {
                      showToast(lang === 'he' ? 'שגיאה בהעתקה ללוח' : 'שגיאה ביים קאפירן');
                    }
                  }}
                  disabled={!quickNotes.trim()}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 disabled:opacity-50 text-xs font-bold rounded-xl border border-slate-200/80 flex items-center gap-1.5 transition-all shadow-2xs"
                  title={t.btn_copy_notes}
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">{t.btn_copy_notes}</span>
                </button>

                {quickNotes.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(lang === 'he' ? 'האם לנקות את כל הפתקים?' : 'צי ווילט איר אויסמעקן אלע נאטיצן?')) {
                        setQuickNotes('');
                        showToast(t.notes_cleared_toast);
                      }
                    }}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200/60 transition-all"
                    title={t.btn_clear_notes}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notes Textarea */}
            <div className="relative">
              <textarea
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                placeholder={t.placeholder_quick_notes}
                className="w-full min-h-[140px] max-h-[320px] p-4 bg-white border border-amber-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all custom-scrollbar outline-none leading-relaxed resize-y shadow-inner font-sans"
              />
            </div>

            {/* Word & Char counter footer */}
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-3">
                <span>
                  {lang === 'he' ? 'תווים:' : 'אותיות:'} <strong className="font-mono text-slate-700">{quickNotes.length.toLocaleString()}</strong>
                </span>
                <span>
                  {lang === 'he' ? 'מילים:' : 'ווערטער:'} <strong className="font-mono text-slate-700">{quickNotes.trim() ? quickNotes.trim().split(/\s+/).length.toLocaleString() : 0}</strong>
                </span>
              </span>
              <span className="text-[10px] text-amber-700/80 bg-amber-100/60 px-2 py-0.5 rounded-md font-mono">
                {lang === 'he' ? 'ספר נוכחי:' : 'יעצטיגער ספר:'} {bookName || (lang === 'he' ? 'ללא שם' : 'אן נאמען')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Live Performance Indicators */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              <span>{t.calc_book_details_title}</span>
            </h3>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t.stat_char_hours}</p>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">{bookHours.toFixed(1)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t.stat_project_name}</p>
                  <p className="text-sm font-extrabold text-indigo-700 truncate mt-0.5">
                    {bookName || 'ספר הספרים'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{t.stat_acc_earned}</p>
                  <p className="text-lg font-extrabold text-emerald-600 mt-1">
                    ₪{computedEarnings.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{t.stat_current_speed}</p>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">
                    {Math.round(currentSpeed).toLocaleString()} ת/ש
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{t.stat_avg_pages_hr}</p>
                  <p className="text-base font-extrabold text-indigo-600 mt-1">
                    {pagesPerHour.toFixed(2)} עמ'/ש'
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{t.stat_time_per_page}</p>
                  <p className="text-base font-extrabold text-slate-800 mt-1">
                    {minutesPerPage.toFixed(1)} דק'
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="bg-gradient-to-l from-emerald-50 to-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">
                    {t.stat_actual_hourly_payout}
                  </p>
                  <p className="text-lg font-black text-emerald-600 mt-1">
                    ₪{actualHourlyWage.toFixed(2)} / ש'
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Speed Compliance Gauge */}
          <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              {t.gauge_perf_title}
            </h3>

            {/* Circular Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#4f46e5"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * Math.min(Math.max(performancePercentage, 0), 100)) / 100}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 font-mono">
                  {performancePercentage.toFixed(1)}%
                </span>
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    performancePercentage === 0
                      ? 'text-slate-400'
                      : performancePercentage < 90
                      ? 'text-rose-500'
                      : performancePercentage <= 110
                      ? 'text-emerald-500'
                      : 'text-indigo-500'
                  }`}
                >
                  {performancePercentage === 0
                    ? t.gauge_no_data
                    : performancePercentage < 90
                    ? lang === 'he'
                      ? 'קצב איטי'
                      : 'שטאטע קצב'
                    : performancePercentage <= 110
                    ? lang === 'he'
                      ? 'תואם ליעד'
                      : 'צוגעפאסט צום ציל'
                    : lang === 'he'
                    ? 'ביצועים מעולים'
                    : 'העכסטע קוואליטעט'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-6 leading-relaxed px-4">{t.gauge_perf_desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

function formatStopwatch(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 100);

  return (
    String(hours).padStart(2, '0') +
    ':' +
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    '.' +
    String(hundredths).padStart(2, '0')
  );
}
