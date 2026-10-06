import React, { useState } from 'react';
import { GoalRecord, GoalTimeRange, GoalMetric, Language, SessionLogRecord, BookArchiveRecord } from '../types';
import { translations } from '../utils/translations';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Trash2,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  BookOpen,
  RefreshCw
} from 'lucide-react';

interface Props {
  lang: Language;
  goals: GoalRecord[];
  onAddGoal: (goal: Omit<GoalRecord, 'id' | 'createdAt'>) => void;
  onToggleGoal: (id: string) => void;
  onUpdateProgress: (id: string, delta: number) => void;
  onDeleteGoal: (id: string) => void;
  sessionLogs?: SessionLogRecord[];
  history?: BookArchiveRecord[];
  displaySeconds?: number;
  currentWorkedChars?: number;
}

export const GoalsTab: React.FC<Props> = ({
  lang,
  goals,
  onAddGoal,
  onToggleGoal,
  onUpdateProgress,
  onDeleteGoal,
  sessionLogs = [],
  history = [],
  displaySeconds = 0,
  currentWorkedChars = 0,
}) => {
  const t = translations[lang];

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [rangeFilter, setRangeFilter] = useState<'all' | GoalTimeRange>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new Goal
  const [formTitle, setFormTitle] = useState('');
  const [formMetric, setFormMetric] = useState<GoalMetric>('chars');
  const [formRange, setFormRange] = useState<GoalTimeRange>('days');
  const [formTarget, setFormTarget] = useState<number>(20000);
  const [formInitial, setFormInitial] = useState<number>(0);
  const [formDeadline, setFormDeadline] = useState<string>('');
  const [formAutoTrack, setFormAutoTrack] = useState<boolean>(true);

  // Calculate live automatic progress for any goal
  const getAutoGoalProgress = (goal: GoalRecord): number => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthStr = now.toISOString().slice(0, 7);
    const oneWeekAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const inRange = (timestamp: string): boolean => {
      if (goal.timeRange === 'days') {
        return timestamp.slice(0, 10) === todayStr;
      }
      if (goal.timeRange === 'weeks') {
        return new Date(timestamp).getTime() >= oneWeekAgoMs;
      }
      if (goal.timeRange === 'months') {
        return timestamp.slice(0, 7) === thisMonthStr;
      }
      // 'hours' or all
      return true;
    };

    if (goal.metric === 'chars') {
      const logsSum = sessionLogs
        .filter((l) => inRange(l.timestamp))
        .reduce((sum, l) => sum + (l.chars || 0), 0);
      return logsSum + currentWorkedChars;
    }

    if (goal.metric === 'hours') {
      const logsHours = sessionLogs
        .filter((l) => inRange(l.timestamp))
        .reduce((sum, l) => sum + (l.seconds || 0) / 3600, 0);
      const activeHours = displaySeconds / 3600;
      return parseFloat((logsHours + activeHours).toFixed(1));
    }

    if (goal.metric === 'books') {
      const booksInHistory = history.filter((b) => {
        if (goal.timeRange === 'months') {
          return b.month === thisMonthStr;
        }
        return true;
      });
      return booksInHistory.length;
    }

    if (goal.metric === 'earnings') {
      const historyPayout = history
        .filter((b) => goal.timeRange === 'months' ? b.month === thisMonthStr : true)
        .reduce((sum, b) => sum + (b.payout || 0), 0);
      return Math.round(historyPayout);
    }

    return goal.currentValue || 0;
  };

  const getEffectiveGoalValue = (goal: GoalRecord): number => {
    if (goal.autoTrack !== false) {
      return getAutoGoalProgress(goal);
    }
    return goal.currentValue || 0;
  };

  const filteredGoals = goals.filter((g) => {
    const current = getEffectiveGoalValue(g);
    const isCompleted = g.completed || current >= g.targetValue;
    if (statusFilter === 'active' && isCompleted) return false;
    if (statusFilter === 'completed' && !isCompleted) return false;
    if (rangeFilter !== 'all' && g.timeRange !== rangeFilter) return false;
    return true;
  });

  // Aggregates
  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => {
    const current = getEffectiveGoalValue(g);
    return !g.completed && current < g.targetValue;
  }).length;
  const completedGoals = totalGoals - activeGoals;
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formTarget <= 0) return;

    onAddGoal({
      title: formTitle.trim(),
      metric: formMetric,
      targetValue: formTarget,
      currentValue: formInitial || 0,
      timeRange: formRange,
      deadline: formDeadline || undefined,
      autoTrack: formAutoTrack,
      completed: false,
    });

    setFormTitle('');
    setFormTarget(20000);
    setFormInitial(0);
    setFormDeadline('');
    setFormAutoTrack(true);
    setIsModalOpen(false);
  };

  const getRangeLabel = (range: GoalTimeRange) => {
    switch (range) {
      case 'hours':
        return lang === 'he' ? 'סשן / שעות' : "סעסיע / שעה'ן";
      case 'days':
        return lang === 'he' ? 'יומי (היום)' : 'טעגלעך';
      case 'weeks':
        return lang === 'he' ? 'שבועי (השבוע)' : 'וואכנטלעך';
      case 'months':
        return lang === 'he' ? 'חודשי (החודש)' : 'חודש׳לעך';
    }
  };

  const getMetricLabel = (metric: GoalMetric) => {
    switch (metric) {
      case 'chars':
        return lang === 'he' ? 'תווים שהוקלדו' : 'אותיות';
      case 'hours':
        return lang === 'he' ? 'שעות עבודה' : "ארבעט שעה'ן";
      case 'books':
        return lang === 'he' ? 'ספרים שהושלמו' : 'געענדיגטע ספרים';
      case 'earnings':
        return lang === 'he' ? 'הכנסה (₪)' : 'פארדינסט (₪)';
    }
  };

  const getMetricUnit = (metric: GoalMetric) => {
    switch (metric) {
      case 'chars':
        return ' תווים';
      case 'hours':
        return " שעות";
      case 'books':
        return " ספרים";
      case 'earnings':
        return ' ₪';
    }
  };

  return (
    <section className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Target className="w-7 h-7 text-indigo-600" />
            <span>{t.goals_header_title}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t.goals_header_subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>{t.btn_add_goal}</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase">
            {lang === 'he' ? 'יעדים פעילים' : 'אקטיווע צילן'}
          </p>
          <p className="text-2xl font-black text-indigo-700 mt-1 font-mono">{activeGoals}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase">
            {lang === 'he' ? 'יעדים שהושלמו' : 'דערגרייכטע צילן'}
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{completedGoals}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase">
            {lang === 'he' ? 'שיעור השלמה כולל' : 'דערגרייכונג ראטע'}
          </p>
          <p className="text-2xl font-black text-slate-800 mt-1 font-mono">
            {completionRate.toFixed(0)}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase">
            {lang === 'he' ? 'סה״כ יעדים מוגדרים' : 'אלע צילן'}
          </p>
          <p className="text-2xl font-black text-slate-600 mt-1 font-mono">{totalGoals}</p>
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-100 card-shadow">
        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'he' ? 'פעילים' : 'אקטיוו'} ({activeGoals})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'he' ? 'הושלמו' : 'פארטיג'} ({completedGoals})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'he' ? 'הכל' : 'אלע'} ({totalGoals})
          </button>
        </div>

        {/* Time Horizon Filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-slate-400 font-bold ml-1">
            {lang === 'he' ? 'טווח זמן:' : 'צייט טווח:'}
          </span>
          {(['all', 'hours', 'days', 'weeks', 'months'] as const).map((rng) => (
            <button
              key={rng}
              type="button"
              onClick={() => setRangeFilter(rng)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                rangeFilter === rng
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rng === 'all'
                ? (lang === 'he' ? 'כל הטווחים' : 'אלע טווחים')
                : getRangeLabel(rng)}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Cards Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 card-shadow py-16 px-6 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            {lang === 'he' ? 'אין יעדים להצגה בסינון זה' : 'נישט פאראן קיין צילן דא'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {lang === 'he'
              ? 'הגדר לעצמך יעד תווים, שעות עבודה או הכנסה לפי ימים, שבועות או חודשים ושמור על קצב עבודה מדויק!'
              : 'שטעלט איין א נייעם ציל פאר אותיות אדער שעה׳ן צו בלייבן פאקוסירט!'}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.btn_add_goal}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const current = goal.currentValue || 0;
            const progress = Math.min((current / goal.targetValue) * 100, 100);
            const remaining = Math.max(goal.targetValue - current, 0);

            // Deadline calculation
            let deadlineDiffDays: number | null = null;
            if (goal.deadline) {
              const diffMs = new Date(goal.deadline).getTime() - new Date().getTime();
              deadlineDiffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-3xl border card-shadow p-6 flex flex-col justify-between transition-all ${
                  goal.completed
                    ? 'border-emerald-200/80 bg-emerald-50/15'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div>
                  {/* Top Bar: Range badge, Metric badge, and Complete Checkbox */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {getRangeLabel(goal.timeRange)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {getMetricLabel(goal.metric)}
                      </span>
                      {goal.deadline && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                            deadlineDiffDays !== null && deadlineDiffDays < 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : deadlineDiffDays !== null && deadlineDiffDays <= 2
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {deadlineDiffDays !== null && deadlineDiffDays < 0
                              ? (lang === 'he' ? 'פג תוקף' : 'פארפאלן')
                              : deadlineDiffDays === 0
                              ? (lang === 'he' ? 'היום!' : 'היינט!')
                              : `${deadlineDiffDays} ${lang === 'he' ? 'ימים' : 'טעג'}`}
                          </span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleGoal(goal.id)}
                      className={`p-1.5 rounded-xl transition-all ${
                        goal.completed
                          ? 'text-emerald-600 hover:bg-emerald-100'
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                      }`}
                      title={goal.completed ? 'סמן כלא הושלם' : 'סמן כהושלם'}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Title */}
                  <h4
                    className={`text-base font-extrabold mb-3 leading-snug ${
                      goal.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                    }`}
                  >
                    {goal.title}
                  </h4>

                  {/* Progress Bar & Value Display */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">
                        {current.toLocaleString()} / {goal.targetValue.toLocaleString()}
                        {getMetricUnit(goal.metric)}
                      </span>
                      <span
                        className={`font-mono ${
                          progress >= 100 ? 'text-emerald-600 font-extrabold' : 'text-indigo-600 font-bold'
                        }`}
                      >
                        {progress.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Pace Recommendation Note */}
                  {!goal.completed && remaining > 0 && deadlineDiffDays !== null && deadlineDiffDays > 0 && (
                    <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 text-[11px] text-indigo-900 flex items-center gap-1.5 mt-3">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        {lang === 'he'
                          ? `כדי לעמוד ביעד, נדרש קצב של כ-${Math.round(
                              remaining / deadlineDiffDays
                            ).toLocaleString()} ${getMetricLabel(goal.metric)} ליום!`
                          : `נויטיג א קצב פון ${Math.round(remaining / deadlineDiffDays).toLocaleString()} פער טאג!`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Progress Stepper & Delete */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateProgress(goal.id, goal.metric === 'hours' ? -1 : -1000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-lg transition"
                      title="הפחת מההתקדמות"
                    >
                      {goal.metric === 'hours' ? '-1ש' : '-1,000'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateProgress(goal.id, goal.metric === 'hours' ? 1 : 1000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-lg transition"
                      title="הוסף להתקדמות"
                    >
                      {goal.metric === 'hours' ? '+1ש' : '+1,000'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateProgress(goal.id, goal.metric === 'hours' ? 5 : 5000)}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-100"
                      title="הוספה מהירה"
                    >
                      {goal.metric === 'hours' ? '+5ש' : '+5,000'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    title="מחק יעד"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-slate-950 mb-1">
              {lang === 'he' ? 'הוספת יעד עבודה חדש' : 'צולייגן א נייעם ציל'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {lang === 'he'
                ? 'הגדר יעד תווים, שעות או הכנסה מוגדר בזמן לפי שעות, ימים, שבועות או חודשים.'
                : 'שטעלט איין א נייעם ציל פאר דער ארבעט.'}
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === 'he' ? 'שם היעד' : 'נאמען פונעם ציל'}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    lang === 'he'
                      ? 'לדוגמה: השלמת 40,000 תווים עד סוף השבוע'
                      : 'למשל: ענדיגן 40,000 אותיות די וואך'
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {lang === 'he' ? 'טווח זמן' : 'צייט טווח'}
                  </label>
                  <select
                    value={formRange}
                    onChange={(e) => setFormRange(e.target.value as GoalTimeRange)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="hours">{lang === 'he' ? 'לפי שעות / סשן' : "שעה'ן / סעסיע"}</option>
                    <option value="days">{lang === 'he' ? 'לפי ימים (יומי)' : 'טעגלעך'}</option>
                    <option value="weeks">{lang === 'he' ? 'לפי שבועות (שבועי)' : 'וואכנטלעך'}</option>
                    <option value="months">{lang === 'he' ? 'לפי חודשים (חודשי)' : 'חודש׳לעך'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {lang === 'he' ? 'מדד יעד' : 'מאס ציל'}
                  </label>
                  <select
                    value={formMetric}
                    onChange={(e) => {
                      const m = e.target.value as GoalMetric;
                      setFormMetric(m);
                      if (m === 'hours') setFormTarget(10);
                      else if (m === 'earnings') setFormTarget(1500);
                      else setFormTarget(20000);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="chars">{lang === 'he' ? 'תווים' : 'אותיות'}</option>
                    <option value="hours">{lang === 'he' ? 'שעות עבודה' : "שעה'ן"}</option>
                    <option value="earnings">{lang === 'he' ? 'הכנסה ב-₪' : 'פארדינסט אין ₪'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {lang === 'he' ? 'ערך היעד המספרי' : 'ציל נומער'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formTarget}
                    onChange={(e) => setFormTarget(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {lang === 'he' ? 'תאריך יעד (אופציונלי)' : 'דעדליין (אפציאנעל)'}
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  {t.modal_btn_cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10"
                >
                  {lang === 'he' ? 'צור יעד' : 'באשאפן ציל'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
