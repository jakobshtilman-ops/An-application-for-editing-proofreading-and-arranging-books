import React, { useState, useEffect, useRef } from 'react';
import { BookArchiveRecord, SessionLogRecord, Language } from '../types';
import { translations } from '../utils/translations';
import {
  Chart,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Calculator,
  AlertTriangle,
  Target,
  BarChart2,
  Calendar,
  Clock,
  Hourglass
} from 'lucide-react';

// Register Chart.js components locally
Chart.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface Props {
  lang: Language;
  history: BookArchiveRecord[];
  sessionLogs: SessionLogRecord[];
}

export const DashboardTab: React.FC<Props> = ({ lang, history, sessionLogs }) => {
  const t = translations[lang];
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Dynamic slider for monthly income target
  const [targetIncome, setTargetIncome] = useState<number>(10000);

  // 1. Target pricing calculations
  let hourlySum = 0;
  let hourlyCount = 0;
  let totalCharsAll = 0;
  let totalHoursAll = 0;

  history.forEach((rec) => {
    if (rec.hours > 0) {
      const wage = rec.payout / rec.hours;
      if (wage > 0) {
        hourlySum += wage;
        hourlyCount++;
      }
      totalCharsAll += rec.chars16;
      totalHoursAll += rec.hours;
    }
  });

  const averageHourlyWage = hourlyCount > 0 ? hourlySum / hourlyCount : 45;
  const requiredHours = averageHourlyWage > 0 ? targetIncome / averageHourlyWage : 0;
  const averageSpeedAll = totalHoursAll > 0 ? totalCharsAll / totalHoursAll : 4500;
  const requiredChars = requiredHours * averageSpeedAll;

  // 2. Total earnings & Burnout analysis
  let totalPayout = 0;
  history.forEach((r) => {
    totalPayout += r.payout;
  });

  let recentSpeedSum = 0;
  let recentCount = 0;
  let overallSpeedSum = 0;
  let overallCount = 0;

  sessionLogs.forEach((session, index) => {
    const sHours = session.seconds / 3600;
    if (sHours > 0 && session.rate > 0) {
      const sSpeed = session.chars / sHours;
      const compliance = sSpeed / session.rate;
      overallSpeedSum += compliance;
      overallCount++;

      if (index < 3) {
        recentSpeedSum += compliance;
        recentCount++;
      }
    }
  });

  const recentCompliance = recentCount > 0 ? recentSpeedSum / recentCount : 1;
  const overallCompliance = overallCount > 0 ? overallSpeedSum / overallCount : 1;
  const burnoutRatio = overallCompliance > 0 ? recentCompliance / overallCompliance : 1;
  const burnoutPercentage = burnoutRatio * 100;

  // 3. Consistency calculation
  let stdevSum = 0;
  history.forEach((record) => {
    const actualSpeed = record.hours > 0 ? record.chars16 / record.hours : 0;
    const compliance = record.rate > 0 ? actualSpeed / record.rate : 0;
    stdevSum += Math.pow(compliance - overallCompliance, 2);
  });
  const variance = history.length > 0 ? stdevSum / history.length : 0;
  const stdev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 1 - stdev) * 100;

  // 4. Weekday analysis
  const heDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
  const yiDays = ['זונטאג', 'מאנטאג', 'דינסטאג', 'מיטוואך', 'דאנערשטאג', 'פרייטאג'];
  const dayNames = lang === 'he' ? heDays : yiDays;

  const daysChars = [0, 0, 0, 0, 0, 0];
  const daysSecs = [0, 0, 0, 0, 0, 0];
  const daysRate = [0, 0, 0, 0, 0, 0];
  const daysCount = [0, 0, 0, 0, 0, 0];

  sessionLogs.forEach((s) => {
    const d = new Date(s.timestamp).getDay();
    if (d >= 0 && d <= 5) {
      daysChars[d] += s.chars;
      daysSecs[d] += s.seconds;
      daysRate[d] += s.rate;
      daysCount[d]++;
    }
  });

  // 5. Hour blocks
  const blockChars = [0, 0, 0, 0];
  const blockSecs = [0, 0, 0, 0];
  const blockRate = [0, 0, 0, 0];
  const blockCount = [0, 0, 0, 0];

  sessionLogs.forEach((s) => {
    const hour = new Date(s.timestamp).getHours();
    let bIdx = 3;
    if (hour >= 6 && hour < 12) bIdx = 0;
    else if (hour >= 12 && hour < 17) bIdx = 1;
    else if (hour >= 17 && hour < 22) bIdx = 2;

    blockChars[bIdx] += s.chars;
    blockSecs[bIdx] += s.seconds;
    blockRate[bIdx] += s.rate;
    blockCount[bIdx]++;
  });

  const heHours = ['בוקר (06:00-12:00)', 'צהריים (12:00-17:00)', 'ערב (17:00-22:00)', 'לילה (22:00-06:00)'];
  const yiHours = ['פרימארגן (06:00-12:00)', 'מיטאג (12:00-17:00)', 'אוונט (17:00-22:00)', 'נאכט (22:00-06:00)'];
  const hourLabels = lang === 'he' ? heHours : yiHours;

  // 6. Optimal session durations
  const durChars = [0, 0, 0, 0];
  const durSecs = [0, 0, 0, 0];
  const durRate = [0, 0, 0, 0];
  const durCount = [0, 0, 0, 0];

  sessionLogs.forEach((s) => {
    const m = s.seconds / 60;
    let idx = 3;
    if (m <= 30) idx = 0;
    else if (m <= 60) idx = 1;
    else if (m <= 90) idx = 2;

    durChars[idx] += s.chars;
    durSecs[idx] += s.seconds;
    durRate[idx] += s.rate;
    durCount[idx]++;
  });

  const heDur = ["קצר (עד 30 דק')", "בינוני (30 עד 60 דק')", "ארוך (60 עד 90 דק')", "מרתון (מעל 90 דק')"];
  const yiDur = ["קורץ (ביז 30 מ')", "מיטעל (30 ביז 60 מ')", "לאנג (60 ביז 90 מ')", "מאַראַטאָן (איבער 90 מ')"];
  const durLabels = lang === 'he' ? heDur : yiDur;

  // 7. Months list (15 months)
  const monthsArr: string[] = [];
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const past = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsArr.push(`${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}`);
  }

  // Dual-Axis Chart.js setup
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const incomeData: number[] = [];
    const hoursData: number[] = [];
    const complianceData: number[] = [];

    monthsArr.forEach((m) => {
      let mPayout = 0;
      let mHours = 0;
      let mChars = 0;
      let mRate = 0;
      let mCount = 0;

      history.forEach((rec) => {
        if (rec.month === m) {
          mPayout += rec.payout;
          mHours += rec.hours;
          mChars += rec.chars16;
          mRate += rec.rate;
          mCount++;
        }
      });

      incomeData.push(mPayout);
      hoursData.push(mHours);

      const avgSpd = mHours > 0 ? mChars / mHours : 0;
      const targetR = mCount > 0 ? mRate / mCount : 0;
      const comp = targetR > 0 ? (avgSpd / targetR) * 100 : 0;
      complianceData.push(comp);
    });

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthsArr,
        datasets: [
          {
            label: lang === 'he' ? 'סך הכנסה (₪)' : 'סך הכל פארדינסט (₪)',
            data: incomeData,
            backgroundColor: 'rgba(79, 70, 229, 0.85)',
            borderColor: 'rgb(79, 70, 229)',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y-primary',
          },
          {
            label: lang === 'he' ? 'שעות עבודה' : "ארבעט שעה'ן",
            data: hoursData,
            backgroundColor: 'rgba(56, 189, 248, 0.85)',
            borderColor: 'rgb(56, 189, 248)',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y-primary',
          },
          {
            label: lang === 'he' ? 'אחוז התאמה ליעד (%)' : 'ציל צוגעפאסטקייט (%)',
            data: complianceData,
            type: 'line',
            borderColor: 'rgb(244, 63, 94)',
            backgroundColor: 'rgb(244, 63, 94)',
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.25,
            yAxisID: 'y-secondary',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Assistant', size: 10, weight: 'bold' } },
          },
          'y-primary': {
            type: 'linear',
            position: 'right',
            grid: { color: 'rgba(241, 245, 249, 0.8)' },
            title: {
              display: true,
              text: lang === 'he' ? 'הכנסה (₪) / שעות עבודה' : "פארדינסט (₪) / שעה'ן",
              font: { family: 'Assistant', weight: 'bold' },
            },
            ticks: { font: { family: 'Inter', size: 10 } },
          },
          'y-secondary': {
            type: 'linear',
            position: 'left',
            grid: { drawOnChartArea: false },
            title: {
              display: true,
              text: lang === 'he' ? 'אחוז התאמה ליעד (%)' : 'ציל צוגעפאסטקייט (%)',
              font: { family: 'Assistant', weight: 'bold' },
            },
            ticks: {
              font: { family: 'Inter', size: 10 },
              callback: (v) => `${v}%`,
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Assistant', weight: 'bold', size: 11 } },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [history, lang, monthsArr]);

  // 15-Month table aggregates
  let grandTotalPayout = 0;
  let grandTotalHours = 0;
  let activeMonthsCount = 0;
  let hourlyRateAccumulator = 0;
  let complianceAccumulator = 0;
  let speedAccumulator = 0;

  return (
    <section className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t.dash_header_title}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.dash_header_subtitle}</p>
        </div>
        <div className="text-left bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-bold">{t.dash_update_time}</span>
          <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
            {new Date().toLocaleString(lang === 'he' ? 'he-IL' : 'yi')}
          </p>
        </div>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card 1: Target Pricing Slider */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-500" />
                <span>{t.dash_pricing_calculator}</span>
              </h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                {t.dash_badge_dynamic}
              </span>
            </div>

            <div className="space-y-6 my-4">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <span className="font-bold">{t.dash_expected_monthly_payout}</span>
                  <span className="font-extrabold text-blue-600 text-sm font-mono">
                    ₪{targetIncome.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={3000}
                  max={30000}
                  step={500}
                  value={targetIncome}
                  onChange={(e) => setTargetIncome(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t.dash_average_hourly_payout}</p>
                  <p className="text-base font-black text-slate-800 mt-1">₪{averageHourlyWage.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t.dash_work_hours_required}</p>
                  <p className="text-base font-black text-slate-800 mt-1">
                    {requiredHours.toFixed(1)} {lang === 'he' ? 'שעות' : "שעה'ן"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">{t.dash_total_payout_required}</span>
              <span className="text-lg font-black text-blue-700 font-mono">
                {Math.round(requiredChars).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Burnout Early Warning System */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{t.dash_warning_system}</span>
              </h3>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
                {t.dash_warning_rate_badge}
              </span>
            </div>

            <div className="flex items-center gap-4 my-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-3xl">
                {burnoutPercentage < 90 ? '⚠️' : burnoutPercentage < 100 ? '📉' : '⚡'}
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">{t.dash_burnout_status}</span>
                <p
                  className={`text-lg font-black mt-0.5 ${
                    burnoutPercentage < 90
                      ? 'text-rose-600'
                      : burnoutPercentage < 100
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {burnoutPercentage < 90
                    ? lang === 'he'
                      ? 'סכנת שחיקה חמורה'
                      : 'שווערע מידקייט ווארענונג'
                    : burnoutPercentage < 100
                    ? lang === 'he'
                      ? 'צניחה קלה בביצועים'
                      : 'קליינע ירידה אין קצב'
                    : t.dash_burnout_status_stable}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">{t.dash_burnout_system_desc}</p>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">{t.dash_burnout_alignment}</span>
            <span className="font-extrabold text-slate-800 font-mono">{burnoutPercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 3: Consistency & Total Metrics */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>{t.dash_consistency_system_title}</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">{t.dash_consistency_payout}</span>
                </div>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  {consistencyScore.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50/30 border border-purple-100/50 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-bold text-slate-600">{t.dash_total_session_logs_earnings}</span>
                </div>
                <span className="text-sm font-black text-purple-700 font-mono">
                  ₪{totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic leading-relaxed mt-4">{t.dash_consistency_hint}</p>
        </div>
      </div>

      {/* Main Dual-Axis Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <span>{t.dash_chart_title}</span>
            </h3>
            <p className="text-xs text-slate-500">{t.dash_chart_subtitle}</p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-100">
            {t.dash_chart_type_badge}
          </span>
        </div>

        <div className="h-96 w-full">
          <canvas ref={chartCanvasRef} />
        </div>
      </div>

      {/* Freshness, Golden Hours & Optimal Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Freshness by Weekday */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{t.dash_freshness_index_title}</span>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">{t.dash_freshness_index_desc}</p>

            <div className="space-y-3.5">
              {dayNames.map((name, i) => {
                let alignment = 0;
                if (daysSecs[i] > 0 && daysCount[i] > 0) {
                  const spd = (daysChars[i] / daysSecs[i]) * 3600;
                  const rate = daysRate[i] / daysCount[i];
                  alignment = rate > 0 ? (spd / rate) * 100 : 0;
                }
                return (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 w-16">{name}:</span>
                    <div className="flex-grow mx-3 bg-slate-100 rounded-full h-3 overflow-hidden relative border border-slate-200/50">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(alignment, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 w-12 text-left">
                      {alignment > 0 ? `${alignment.toFixed(1)}%` : '0.0%'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Golden Hours */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{t.dash_golden_hours_title}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">{t.dash_golden_hours_desc}</p>

            <div className="space-y-4">
              {hourLabels.map((lbl, b) => {
                let alignment = 0;
                if (blockSecs[b] > 0 && blockCount[b] > 0) {
                  const spd = (blockChars[b] / blockSecs[b]) * 3600;
                  const rate = blockRate[b] / blockCount[b];
                  alignment = rate > 0 ? (spd / rate) * 100 : 0;
                }
                return (
                  <div key={lbl} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 w-32 leading-tight">{lbl}:</span>
                    <div className="flex-grow mx-3 bg-slate-100 rounded-full h-3 overflow-hidden relative border border-slate-200/50">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(alignment, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 w-12 text-left">
                      {alignment > 0 ? `${alignment.toFixed(1)}%` : '0.0%'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optimal Duration */}
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{t.dash_optimal_session_title}</span>
              <Hourglass className="w-4 h-4 text-purple-500" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">{t.dash_optimal_session_desc}</p>

            <div className="space-y-4">
              {durLabels.map((lbl, p) => {
                let alignment = 0;
                if (durSecs[p] > 0 && durCount[p] > 0) {
                  const spd = (durChars[p] / durSecs[p]) * 3600;
                  const rate = durRate[p] / durCount[p];
                  alignment = rate > 0 ? (spd / rate) * 100 : 0;
                }
                return (
                  <div key={lbl} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 w-32 leading-tight">{lbl}:</span>
                    <div className="flex-grow mx-3 bg-slate-100 rounded-full h-3 overflow-hidden relative border border-slate-200/50">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(alignment, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 w-12 text-left">
                      {alignment > 0 ? `${alignment.toFixed(1)}%` : '0.0%'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 15-Month Performance Table */}
      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{t.dash_table_title}</h3>
          <p className="text-xs text-slate-500 mt-1">{t.dash_table_subtitle}</p>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-4">{t.tbl_col_month}</th>
                <th className="p-4">{t.tbl_col_total_earned}</th>
                <th className="p-4">{t.tbl_col_work_hours}</th>
                <th className="p-4">{t.tbl_col_payout_per_hour}</th>
                <th className="p-4">{t.tbl_col_payout_per_minute}</th>
                <th className="p-4">{t.tbl_col_average_speed}</th>
                <th className="p-4">{t.tbl_col_compliance}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthsArr.map((month) => {
                let mPayout = 0;
                let mHours = 0;
                let mChars = 0;
                let mRate = 0;
                let mRecordCount = 0;

                history.forEach((rec) => {
                  if (rec.month === month) {
                    mPayout += rec.payout;
                    mHours += rec.hours;
                    mChars += rec.chars16;
                    mRate += rec.rate;
                    mRecordCount++;
                  }
                });

                const hourlyWage = mHours > 0 ? mPayout / mHours : 0;
                const minuteWage = mHours > 0 ? hourlyWage / 60 : 0;
                const avgSpeed = mHours > 0 ? mChars / mHours : 0;
                const targetRate = mRecordCount > 0 ? mRate / mRecordCount : 0;
                const alignment = targetRate > 0 ? avgSpeed / targetRate : 0;

                grandTotalPayout += mPayout;
                grandTotalHours += mHours;

                if (mHours > 0) {
                  activeMonthsCount++;
                  hourlyRateAccumulator += hourlyWage;
                  speedAccumulator += avgSpeed;
                  complianceAccumulator += alignment;
                }

                return (
                  <tr key={month} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="p-4 font-mono font-bold text-xs text-slate-500">{month}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {mPayout > 0 ? `₪${mPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-600">
                      {mHours > 0 ? `${mHours.toFixed(1)} ש'` : '-'}
                    </td>
                    <td className="p-4 font-mono text-indigo-600 font-bold">
                      {hourlyWage > 0 ? `₪${hourlyWage.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {minuteWage > 0 ? `₪${minuteWage.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 font-mono">
                      {avgSpeed > 0 ? `${Math.round(avgSpeed).toLocaleString()} ת/ש` : '-'}
                    </td>
                    <td className="p-4">
                      {alignment > 0 ? (
                        <span
                          className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${
                            alignment >= 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {(alignment * 100).toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
              <tr className="bg-slate-100 text-slate-900">
                <td className="p-4 uppercase tracking-wider">
                  {lang === 'he' ? 'ממוצע / סיכום כללי' : 'דורכשניט / סך הכל'}
                </td>
                <td className="p-4 font-mono font-black text-slate-950">
                  ₪{grandTotalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-4 font-mono font-black">{grandTotalHours.toFixed(1)} ש'</td>
                <td className="p-4 font-mono font-black text-indigo-700">
                  ₪{(activeMonthsCount > 0 ? hourlyRateAccumulator / activeMonthsCount : 0).toFixed(2)}
                </td>
                <td className="p-4 font-mono font-black text-slate-500">
                  ₪{((activeMonthsCount > 0 ? hourlyRateAccumulator / activeMonthsCount : 0) / 60).toFixed(2)}
                </td>
                <td className="p-4 font-mono font-black">
                  {Math.round(activeMonthsCount > 0 ? speedAccumulator / activeMonthsCount : 0).toLocaleString()} ת/ש
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 text-xs font-mono font-black bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                    {((activeMonthsCount > 0 ? complianceAccumulator / activeMonthsCount : 0) * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};
