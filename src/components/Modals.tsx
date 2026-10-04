import React, { useState } from 'react';
import { Language, UsefulLink } from '../types';
import { translations } from '../utils/translations';
import { AlertTriangle, X } from 'lucide-react';

interface ManualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentSeconds: number;
  onSave: (newSeconds: number) => void;
}

export const ManualTimeModal: React.FC<ManualTimeModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentSeconds,
  onSave,
}) => {
  const t = translations[lang];
  const initialHours = Math.floor(currentSeconds / 3600);
  const initialMins = Math.floor((currentSeconds % 3600) / 60);

  const [hours, setHours] = useState(initialHours);
  const [mins, setMins] = useState(initialMins);

  if (!isOpen) return null;

  const handleSave = () => {
    const computed = hours * 3600 + mins * 60;
    onSave(computed);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-950">{t.modal_manual_adjust_title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-6">{t.modal_manual_adjust_desc}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                {t.modal_manual_adjust_hours}
              </label>
              <input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                {t.modal_manual_adjust_minutes}
              </label>
              <input
                type="number"
                min={0}
                max={59}
                value={mins}
                onChange={(e) => setMins(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">{t.modal_manual_adjust_hint}</p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all"
          >
            {t.modal_btn_cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/10"
          >
            {t.modal_btn_save}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ManualArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSave: (data: {
    month: string;
    bookName: string;
    chars3: number;
    chars16: number;
    hours: number;
    rate: number;
  }) => void;
}

export const ManualArchiveModal: React.FC<ManualArchiveModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSave,
}) => {
  const t = translations[lang];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(currentMonth);
  const [bookName, setBookName] = useState('');
  const [chars3, setChars3] = useState('');
  const [chars16, setChars16] = useState('');
  const [hours, setHours] = useState('');
  const [rate, setRate] = useState('4500');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!month) return;
    onSave({
      month,
      bookName: bookName || 'ספר ללא שם',
      chars3: parseFloat(chars3) || 0,
      chars16: parseFloat(chars16) || 0,
      hours: parseFloat(hours) || 0,
      rate: parseFloat(rate) || 4500,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 relative">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-950">{t.modal_archive_title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-6">{t.modal_archive_desc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_archive_month}</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_archive_book_name}</label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_archive_total_chars}</label>
            <input
              type="number"
              value={chars3}
              onChange={(e) => setChars3(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_archive_chars_worked}</label>
            <input
              type="number"
              value={chars16}
              onChange={(e) => setChars16(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_archive_work_hours}</label>
            <input
              type="number"
              step="0.1"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_archive_target_rate}</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all"
          >
            {t.modal_btn_cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/10"
          >
            {t.modal_btn_save_archive}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  defaultBookName: string;
  onSave: (data: {
    timestamp: string;
    bookName: string;
    chars: number;
    seconds: number;
    rate: number;
  }) => void;
}

export const ManualSessionModal: React.FC<ManualSessionModalProps> = ({
  isOpen,
  onClose,
  lang,
  defaultBookName,
  onSave,
}) => {
  const t = translations[lang];
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localIso = new Date(now.getTime() - offset * 60000).toISOString().substring(0, 16);

  const [datetime, setDatetime] = useState(localIso);
  const [bookName, setBookName] = useState(defaultBookName);
  const [chars, setChars] = useState('');
  const [seconds, setSeconds] = useState('');
  const [rate, setRate] = useState('4500');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!datetime) return;
    onSave({
      timestamp: new Date(datetime).toISOString(),
      bookName: bookName || 'ספר ללא שם',
      chars: parseFloat(chars) || 0,
      seconds: parseFloat(seconds) || 0,
      rate: parseFloat(rate) || 4500,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-950">{t.modal_session_title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-6">{t.modal_session_desc}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_session_datetime}</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_session_book_name}</label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_session_chars}</label>
              <input
                type="number"
                value={chars}
                onChange={(e) => setChars(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_session_seconds}</label>
              <input
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_session_target_rate}</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all"
          >
            {t.modal_btn_cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/10"
          >
            {t.modal_btn_log_session}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ManualLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSave: (data: Omit<UsefulLink, 'id'>) => void;
}

export const ManualLinkModal: React.FC<ManualLinkModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSave,
}) => {
  const t = translations[lang];
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<'reference' | 'publisher' | 'utility'>('reference');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title || !url) return;
    onSave({
      title,
      url,
      desc: desc || 'ללא תיאור מורחב.',
      category,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-950">{t.modal_link_title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-6">{t.modal_link_desc}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_link_site_name}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.placeholder_site_name}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_link_url}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_link_description}</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t.placeholder_description}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.modal_link_category}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'reference' | 'publisher' | 'utility')}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="reference">{t.opt_ref}</option>
              <option value="publisher">{t.opt_pub}</option>
              <option value="utility">{t.opt_util}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all"
          >
            {t.modal_btn_cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10"
          >
            {t.modal_btn_add_link}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onConfirm: (shouldArchive: boolean) => void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
  isOpen,
  onClose,
  lang,
  onConfirm,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 text-center relative">
        <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 text-xl mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">{t.modal_confirm_title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">{t.modal_confirm_desc}</p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onConfirm(true)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 active:scale-95"
          >
            {t.modal_btn_save_and_archive}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(false)}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all active:scale-95"
          >
            {t.modal_btn_reset_unsaved}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all mt-1"
          >
            {t.modal_btn_cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
