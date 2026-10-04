import React, { useRef } from 'react';
import { WorkMode, Language } from '../types';
import { translations } from '../utils/translations';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Hourglass,
  Save,
  Download,
  Upload,
  Clock,
  Calculator,
  LineChart,
  BookMarked,
  ListChecks,
  Link as LinkIcon,
  WifiOff,
  Target,
  HardDrive,
  FileCheck,
  X
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  workMode: WorkMode;
  setWorkMode: (mode: WorkMode) => void;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onManualSave: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  linkedFileName: string | null;
  onLinkComputerFile: () => void;
  onSaveToComputerDisk: () => void;
  onDisconnectComputerFile: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  workMode,
  setWorkMode,
  hourlyRate,
  setHourlyRate,
  lang,
  setLang,
  onManualSave,
  onExport,
  onImport,
  linkedFileName,
  onLinkComputerFile,
  onSaveToComputerDisk,
  onDisconnectComputerFile,
  isOnline,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border-b border-indigo-900/30 sticky top-0 z-40">
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t.offline_active}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Hourglass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {t.app_title}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                PWA Offline
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-indigo-300/80">{t.app_subtitle}</p>
          </div>
        </div>

        {/* Controls and Utilities */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Linked Computer Disk File Badge & Direct Save Button */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {linkedFileName ? (
              <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/80 px-2 py-1 rounded-lg">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono text-emerald-300 max-w-[120px] truncate" title={linkedFileName}>
                  {linkedFileName}
                </span>
                <button
                  type="button"
                  onClick={onSaveToComputerDisk}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded transition active:scale-95 ml-1"
                  title="שמור שינויים עכשיו ישירות לקובץ זה בדיסק"
                >
                  שמור לקובץ
                </button>
                <button
                  type="button"
                  onClick={onDisconnectComputerFile}
                  className="p-0.5 text-slate-400 hover:text-rose-400 transition"
                  title="נתק קובץ מקושר"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLinkComputerFile}
                className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-900/60 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 active:scale-95"
                title="בחר או צור קובץ JSON במחשב שלך (Desktop/Documents) שהמערכת תשמור אליו ישירות!"
              >
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">{t.disk_link_button}</span>
                <span className="lg:hidden">שמור במחשב</span>
              </button>
            )}
          </div>

          {/* Mode Switch (Regular / Hourly) */}
          <div className="flex items-center bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700/70">
              <button
                type="button"
                onClick={() => setWorkMode('regular')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  workMode === 'regular'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.btn_mode_regular}
              </button>
              <button
                type="button"
                onClick={() => setWorkMode('hourly')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  workMode === 'hourly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.btn_mode_hourly}
              </button>
            </div>

            {/* Hourly Rate Setting (Visible when Hourly) */}
            {workMode === 'hourly' && (
              <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-700 ml-1.5 mr-1.5">
                <label className="text-[10px] text-slate-400 font-bold">{t.hourly_rate_label}</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 bg-slate-800 text-xs text-center font-bold text-emerald-400 border border-slate-700 rounded px-1 py-0.5 outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 font-bold">₪</span>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700/70 mr-1.5 ml-1.5">
              <button
                type="button"
                onClick={() => setLang('he')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                  lang === 'he'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                עברית
              </button>
              <button
                type="button"
                onClick={() => setLang('yi')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                  lang === 'yi'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                אידיש
              </button>
            </div>
          </div>

          {/* Backup, Storage & PWA Group */}
          <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              type="button"
              onClick={onManualSave}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-emerald-500"
              title={t.btn_save_title}
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.btn_save}</span>
            </button>
            <button
              type="button"
              onClick={onExport}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-slate-700"
              title={t.btn_export_title}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.btn_export}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-indigo-900/80 hover:bg-indigo-800 active:scale-95 text-indigo-200 hover:text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-indigo-700/70"
              title={t.btn_import_title}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.btn_import}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* PWA In-App Install Button */}
            <PWAInstallButton lang={lang} />
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'tracker'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.tab_tracker}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'goals'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{t.tab_goals}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculators')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'calculators'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t.tab_calculators}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>{t.tab_dashboard}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>{t.tab_history}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>{t.tab_logs}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'links'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{t.tab_links}</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

