import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { Calculator, ListOrdered, Clock } from 'lucide-react';

interface Props {
  lang: Language;
}

export const CalculatorsTab: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];

  // 1. Math Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0');

  const pressCalc = (char: string) => {
    if (calcDisplay === '0' || calcDisplay === 'Error') {
      setCalcDisplay(char);
    } else {
      setCalcDisplay((prev) => prev + char);
    }
  };

  const clearCalc = () => setCalcDisplay('0');

  const evaluateCalc = () => {
    try {
      const sanitized = calcDisplay.replace(/[^0-9+\-*/().\s]/g, '');
      // Evaluate securely
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${sanitized})`)();
      setCalcDisplay(String(result || 0));
    } catch {
      setCalcDisplay('Error');
    }
  };

  // 2. Average Calculator state
  const [avgInput, setAvgInput] = useState('4500, 4800, 3900');
  const parsedNums = avgInput
    .split(/[\s,]+/)
    .map((n) => parseFloat(n))
    .filter((n) => !isNaN(n));
  const avgSum = parsedNums.reduce((a, b) => a + b, 0);
  const avgResult = parsedNums.length > 0 ? (avgSum / parsedNums.length).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';

  // 3. Time converter state
  const [convHours, setConvHours] = useState<number>(1);
  const [convMinutes, setConvMinutes] = useState<number>(30);
  const [convSeconds, setConvSeconds] = useState<number>(5400);

  const handleTimeChange = (h: number, m: number) => {
    setConvHours(h);
    setConvMinutes(m);
    setConvSeconds(Math.round(h * 3600 + m * 60));
  };

  const handleSecondsChange = (secs: number) => {
    setConvSeconds(secs);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    setConvHours(h);
    setConvMinutes(m);
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900">{t.calc_header_title}</h2>
        <p className="text-sm text-slate-500 mt-1">{t.calc_header_subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Arithmetic Calculator */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <span>{t.math_calc_title}</span>
          </h3>

          <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
            <input
              type="text"
              readOnly
              value={calcDisplay}
              className="w-full text-left font-mono text-2xl font-black bg-transparent text-slate-800 outline-none"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={clearCalc}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              C
            </button>
            <button
              onClick={() => pressCalc('(')}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-indigo-600 font-bold rounded-xl transition-all"
            >
              (
            </button>
            <button
              onClick={() => pressCalc(')')}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-indigo-600 font-bold rounded-xl transition-all"
            >
              )
            </button>
            <button
              onClick={() => pressCalc('/')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all"
            >
              ÷
            </button>

            {['7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => pressCalc(digit)}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => pressCalc('*')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all"
            >
              ×
            </button>

            {['4', '5', '6'].map((digit) => (
              <button
                key={digit}
                onClick={() => pressCalc(digit)}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => pressCalc('-')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all"
            >
              -
            </button>

            {['1', '2', '3'].map((digit) => (
              <button
                key={digit}
                onClick={() => pressCalc(digit)}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => pressCalc('+')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all"
            >
              +
            </button>

            <button
              onClick={() => pressCalc('0')}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl col-span-2 transition-all"
            >
              0
            </button>
            <button
              onClick={() => pressCalc('.')}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl transition-all"
            >
              .
            </button>
            <button
              onClick={evaluateCalc}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
            >
              =
            </button>
          </div>
        </div>

        {/* 2. Average Calculator */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-600" />
              <span>{t.avg_calc_title}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{t.avg_calc_desc}</p>

            <textarea
              value={avgInput}
              onChange={(e) => setAvgInput(e.target.value)}
              placeholder={t.placeholder_avg_input}
              className="w-full h-28 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold">{t.lbl_avg_payout}</p>
              <p className="text-base font-extrabold text-emerald-600 mt-1 font-mono">{avgResult}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold">{t.lbl_total_items}</p>
              <p className="text-base font-extrabold text-slate-700 mt-1 font-mono">{parsedNums.length}</p>
            </div>
          </div>
        </div>

        {/* 3. Time Converter */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>{t.time_conv_title}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{t.time_conv_desc}</p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.time_hours}</label>
                  <input
                    type="number"
                    min={0}
                    value={convHours}
                    onChange={(e) => handleTimeChange(Number(e.target.value) || 0, convMinutes)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.time_minutes}</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={convMinutes}
                    onChange={(e) => handleTimeChange(convHours, Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div className="relative flex items-center justify-center my-1.5">
                <span className="h-px bg-slate-200 w-full absolute" />
                <span className="px-3 py-1 bg-white text-[9px] font-bold text-slate-400 relative rounded-full border border-slate-200">
                  {t.time_result_label}
                </span>
              </div>

              <input
                type="number"
                min={0}
                value={convSeconds}
                onChange={(e) => handleSecondsChange(Number(e.target.value) || 0)}
                className="w-full p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-center text-base font-bold text-amber-900 outline-none font-mono"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic text-center">
            {t.time_conv_hint}
          </p>
        </div>
      </div>
    </section>
  );
};
