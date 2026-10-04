import React, { useState, useEffect, useRef } from 'react';
import { WorkMode, Language } from '../types';
import { translations } from '../utils/translations';
import { playStartSound, playStopSound } from '../utils/sound';
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
  Clock3
} from 'lucide-react';

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
}) => {
  const t = translations[lang];

  // Timer running state
  const [isRunning, setIsRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(accumulatedSeconds);
  const startTimeRef = useRef<number>(0);
  const startCharsRef = useRef<number>(0);
  const pipWindowRef = useRef<Window | null>(null);

  // Sync display seconds when accumulatedSeconds changes outside
  useEffect(() => {
    if (!isRunning) {
      setDisplaySeconds(accumulatedSeconds);
    }
  }, [accumulatedSeconds, isRunning]);

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

  // Timer loop
  useEffect(() => {
    let animFrame: number;
    let lastSave = 0;

    if (isRunning) {
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        const total = accumulatedSeconds + elapsed;
        setDisplaySeconds(total);

        // Auto background state sync every 10s
        const secFloor = Math.floor(elapsed);
        if (secFloor % 10 === 0 && secFloor !== lastSave) {
          lastSave = secFloor;
        }

        // Update Document PiP window if open
        if (pipWindowRef.current) {
          const pipTimerEl = pipWindowRef.current.document.getElementById('pip-timer');
          const pipCharsEl = pipWindowRef.current.document.getElementById('pip-chars');
          if (pipTimerEl) pipTimerEl.innerText = formatStopwatch(total);
          if (pipCharsEl) pipCharsEl.innerText = finalCharCount.toLocaleString();
        }

        animFrame = requestAnimationFrame(updateTimer);
      };
      animFrame = requestAnimationFrame(updateTimer);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isRunning, accumulatedSeconds, finalCharCount]);

  const toggleTimer = () => {
    if (!isRunning) {
      playStartSound();
      startTimeRef.current = Date.now();
      startCharsRef.current = finalCharCount;
      setIsRunning(true);
      showToast(lang === 'he' ? 'סשן העבודה החל!' : 'ארבעט סעסיע אנגעהויבן!');
    } else {
      playStopSound();
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const updatedTotal = accumulatedSeconds + elapsed;
      setAccumulatedSeconds(updatedTotal);
      setDisplaySeconds(updatedTotal);
      setIsRunning(false);

      if (elapsed > 5) {
        const sessionChars = Math.max(0, finalCharCount - startCharsRef.current);
        onSessionRecorded(elapsed, sessionChars, effectiveTargetRate);
      }
      showToast(lang === 'he' ? 'סשן העבודה הושהה!' : 'ארבעט סעסיע אפגעשטעלט!');
    }

    if (pipWindowRef.current) {
      const pipBtn = pipWindowRef.current.document.getElementById('pip-btn-toggle');
      if (pipBtn) {
        pipBtn.innerText = !isRunning ? (lang === 'he' ? 'השהה' : 'אפשטעלן') : (lang === 'he' ? 'התחל' : 'אנהייבן');
      }
    }
  };

  // Picture in Picture
  const handleFloatingPiP = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as unknown as {
          documentPictureInPicture: {
            requestWindow: (options: { width: number; height: number }) => Promise<Window>;
          };
        }).documentPictureInPicture.requestWindow({
          width: 320,
          height: 220,
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
          <div class="text-xs text-indigo-400 font-bold mb-2">${t.app_title}</div>
          <div id="pip-timer" class="text-3xl font-mono font-black text-white bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-inner mb-3 tracking-tight">
            ${formatStopwatch(displaySeconds)}
          </div>
          <div class="text-[11px] text-slate-400">
            ${t.progress_worked_chars} <strong id="pip-chars" class="text-emerald-400 font-mono">${finalCharCount.toLocaleString()}</strong>
          </div>
          <button id="pip-btn-toggle" class="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all">
            ${isRunning ? (lang === 'he' ? 'השהה' : 'אפשטעלן') : (lang === 'he' ? 'התחל' : 'אנהייבן')}
          </button>
        `;

        pipWindow.document.body.appendChild(pipDiv);
        pipWindowRef.current = pipWindow;

        pipWindow.document.getElementById('pip-btn-toggle')?.addEventListener('click', () => {
          toggleTimer();
        });

        pipWindow.addEventListener('pagehide', () => {
          pipWindowRef.current = null;
        });

        showToast(lang === 'he' ? 'חלון צף תמידי נפתח מעל שאר התוכנות!' : 'פלאָוטינג זייגער געעפֿנט!');
        return;
      } catch (e) {
        console.warn('PiP window request canceled or failed', e);
      }
    }

    // Canvas fallback
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const video = document.createElement('video');
      video.muted = true;
      video.srcObject = (canvas as unknown as { captureStream: (fps: number) => MediaStream }).captureStream(10);
      
      const draw = () => {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 320, 180);
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 13px Assistant, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.app_title, 160, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px monospace';
        ctx.fillText(formatStopwatch(displaySeconds), 160, 85);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px Assistant, sans-serif';
        ctx.fillText(`תווים: ${finalCharCount.toLocaleString()}`, 160, 130);
      };
      draw();

      video.addEventListener('play', () => {
        const interval = setInterval(() => {
          draw();
          if (video.paused || video.ended) clearInterval(interval);
        }, 100);
      });

      await video.play();
      await video.requestPictureInPicture();
      showToast(lang === 'he' ? 'חלון צף נפתח בהצלחה!' : 'פלאָוטינג זייגער געעפֿנט!');
    } catch {
      showToast(lang === 'he' ? 'הדפדפן אינו תומך בחלון צף במכשיר זה.' : 'דער בראוזער שטיצט נישט קיין פלאָוטינג פענסטער.');
    }
  };

  return (
    <section className="grid grid-cols-1 gap-8">
      {/* Top Card: Book Configuration */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/80 card-shadow p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>{t.book_init_title}</span>
          </h3>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">
            {t.book_init_badge}
          </span>
        </div>

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

        {/* Real-time Estimates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mt-5 pt-5 border-t border-slate-200/70">
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
        <div className="mt-4 pt-4 border-t border-slate-100">
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

            {/* Stopwatch Display */}
            <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-slate-900 bg-slate-50 border border-slate-100 px-8 py-6 rounded-3xl shadow-inner select-none mb-8">
              {formatStopwatch(displaySeconds)}
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
