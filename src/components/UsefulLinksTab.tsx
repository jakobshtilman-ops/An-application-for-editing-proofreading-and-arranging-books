import React from 'react';
import { UsefulLink, Language } from '../types';
import { translations } from '../utils/translations';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

interface Props {
  lang: Language;
  links: UsefulLink[];
  onOpenAddModal: () => void;
  onDeleteLink: (id: string) => void;
}

export const UsefulLinksTab: React.FC<Props> = ({
  lang,
  links,
  onOpenAddModal,
  onDeleteLink,
}) => {
  const t = translations[lang];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t.links_header_title}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.links_header_subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.btn_add_link_manual}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => {
          let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
          let badgeText = lang === 'he' ? 'כלי עבודה' : 'געצייג';

          if (link.category === 'reference') {
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
            badgeText = lang === 'he' ? 'לשון ומילונים' : 'ווערטערביכער';
          } else if (link.category === 'publisher') {
            badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
            badgeText = lang === 'he' ? 'מו"לים והוצאות' : 'הוצאות ספרים';
          }

          return (
            <div
              key={link.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 card-shadow flex flex-col justify-between transition-all hover:scale-[1.01] hover:border-slate-200"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badgeColor}`}>
                    {badgeText}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteLink(link.id)}
                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                    title="מחק קישור"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">{link.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{link.desc}</p>
              </div>

              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-center text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{lang === 'he' ? 'פתח אתר אינטרנט' : 'עפענען וועבזייטל'}</span>
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};
