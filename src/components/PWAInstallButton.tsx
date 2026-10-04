import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { Download, Smartphone, X } from 'lucide-react';

interface Props {
  lang: Language;
}

export const PWAInstallButton: React.FC<Props> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const t = translations[lang];

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm border border-emerald-500"
        title={t.install_app}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t.install_app}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
          title={t.install_ios}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.install_ios}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-right">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h3 className="text-base font-bold text-slate-900">התקנה באייפון ובאייפד</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed space-y-2">
                1. הקש על כפתור <strong>השיתוף (Share)</strong> בתחתית דפדפן Safari.<br />
                2. גלול מטה ובחר באפשרות <strong>״הוסף למסך הבית״ (Add to Home Screen)</strong>.<br />
                3. כעת האפליקציה תפעל ישירות ממסך הבית כמו אפליקציה מותקנת ובאופליין מלא!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                הבנתי, תודה
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
