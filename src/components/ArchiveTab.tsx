import React from 'react';
import { BookArchiveRecord, Language } from '../types';
import { translations } from '../utils/translations';
import { Plus, Trash2, Box } from 'lucide-react';

interface Props {
  lang: Language;
  history: BookArchiveRecord[];
  onOpenAddModal: () => void;
  onDeleteRecord: (id: string) => void;
}

export const ArchiveTab: React.FC<Props> = ({
  lang,
  history,
  onOpenAddModal,
  onDeleteRecord,
}) => {
  const t = translations[lang];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t.history_header_title}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.history_header_subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.btn_add_project_manual}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        {history.length === 0 ? (
          <div className="py-16 text-center">
            <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">{t.history_empty_title}</p>
            <p className="text-xs text-slate-400 mt-1">{t.history_empty_subtitle}</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-4">{t.tbl_col_month}</th>
                  <th className="p-4">{t.tbl_col_book_name}</th>
                  <th className="p-4">{t.tbl_col_chars_total}</th>
                  <th className="p-4">{t.tbl_col_chars_worked}</th>
                  <th className="p-4">{t.tbl_col_work_time_hours}</th>
                  <th className="p-4">{t.tbl_col_publisher_rate}</th>
                  <th className="p-4">{t.tbl_col_compliance_percentage}</th>
                  <th className="p-4">{t.tbl_col_total_earned_archive}</th>
                  <th className="p-4 text-center">{t.tbl_col_actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => {
                  const actualSpeed = record.hours > 0 ? record.chars16 / record.hours : 0;
                  const alignmentPercent = record.rate > 0 ? (actualSpeed / record.rate) * 100 : 0;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-all border-b border-slate-100">
                      <td className="p-4 font-mono text-xs text-slate-500 font-bold">{record.month}</td>
                      <td className="p-4 font-bold text-slate-900">{record.bookName}</td>
                      <td className="p-4 font-mono text-slate-400 font-medium">
                        {(record.chars3 || 0).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-indigo-600 font-bold">{record.chars16.toLocaleString()}</td>
                      <td className="p-4 font-mono font-semibold text-slate-700">
                        {formatDecimalHoursToHMS(record.hours)}
                      </td>
                      <td className="p-4 font-mono text-slate-500">{record.rate.toLocaleString()} ת/ש</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 font-mono text-xs font-bold rounded-lg border ${
                            alignmentPercent >= 100
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}
                        >
                          {alignmentPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-600 font-mono">
                        ₪{record.payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(record.id)}
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

function formatDecimalHoursToHMS(hoursDecimal: number): string {
  if (isNaN(hoursDecimal) || hoursDecimal <= 0) return '00:00:00';
  const totalSeconds = Math.round(hoursDecimal * 3600);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
