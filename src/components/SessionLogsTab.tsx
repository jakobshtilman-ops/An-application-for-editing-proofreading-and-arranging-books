import React from 'react';
import { SessionLogRecord, Language } from '../types';
import { translations } from '../utils/translations';
import { Plus, Trash2, ClipboardList } from 'lucide-react';

interface Props {
  lang: Language;
  logs: SessionLogRecord[];
  onOpenAddModal: () => void;
  onDeleteSession: (id: string) => void;
}

export const SessionLogsTab: React.FC<Props> = ({
  lang,
  logs,
  onOpenAddModal,
  onDeleteSession,
}) => {
  const t = translations[lang];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t.logs_header_title}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.logs_header_subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.btn_add_session_manual}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">{t.logs_empty_title}</p>
            <p className="text-xs text-slate-400 mt-1">{t.logs_empty_subtitle}</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-4">{t.tbl_col_datetime}</th>
                  <th className="p-4">{t.tbl_col_book_name}</th>
                  <th className="p-4">{t.tbl_col_chars_session}</th>
                  <th className="p-4">{t.tbl_col_duration_actual}</th>
                  <th className="p-4">{t.tbl_col_target_rate_logs}</th>
                  <th className="p-4">{t.tbl_col_compliance_logs}</th>
                  <th className="p-4 text-center">{t.tbl_col_actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((session) => {
                  const dt = new Date(session.timestamp);
                  const formattedDate = dt.toLocaleString(lang === 'he' ? 'he-IL' : 'yi', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });

                  const hours = session.seconds / 3600;
                  const speed = hours > 0 ? session.chars / hours : 0;
                  const alignment = session.rate > 0 ? (speed / session.rate) * 100 : 0;

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/80 transition-all border-b border-slate-100">
                      <td className="p-4 font-mono text-xs text-slate-500 font-bold">{formattedDate}</td>
                      <td className="p-4 font-bold text-slate-900">{session.bookName}</td>
                      <td className="p-4 font-mono text-indigo-600 font-bold">{session.chars.toLocaleString()}</td>
                      <td className="p-4 font-mono text-slate-600 font-semibold">
                        {formatTimeLog(session.seconds, lang)}
                      </td>
                      <td className="p-4 font-mono text-slate-400">{session.rate.toLocaleString()} ת/ש</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${
                            alignment >= 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {alignment.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"
                          title="מחיקה"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

function formatTimeLog(totalSeconds: number, lang: Language): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h} ש', ${m} ד'`;
  }
  if (m > 0) {
    return lang === 'he' ? `${m} ד', ${s} ש'` : `${m} מ', ${s} ס'`;
  }
  return lang === 'he' ? `${s} שניות` : `${s} סעק'`;
}
