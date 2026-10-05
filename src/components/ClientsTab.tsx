import React, { useState } from 'react';
import { ClientRecord, BookArchiveRecord, Language, WorkMode } from '../types';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ExternalLink,
  Coins,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  X,
  Play
} from 'lucide-react';

interface Props {
  lang: Language;
  clients: ClientRecord[];
  history: BookArchiveRecord[];
  onAddClient: (client: Omit<ClientRecord, 'id' | 'createdAt'>) => void;
  onUpdateClient: (id: string, client: Partial<ClientRecord>) => void;
  onDeleteClient: (id: string) => void;
  onSelectClientForWork: (client: ClientRecord) => void;
}

export const ClientsTab: React.FC<Props> = ({
  lang,
  clients,
  history,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClientForWork,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [defaultMode, setDefaultMode] = useState<WorkMode>('regular');
  const [defaultRate, setDefaultRate] = useState<number>(4500);
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setDefaultMode('regular');
    setDefaultRate(4500);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: ClientRecord) => {
    setEditingClient(client);
    setName(client.name);
    setContactPerson(client.contactPerson || '');
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setDefaultMode(client.defaultMode || 'regular');
    setDefaultRate(client.defaultRate || 4500);
    setNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      onUpdateClient(editingClient.id, {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        defaultMode,
        defaultRate: Number(defaultRate) || (defaultMode === 'regular' ? 4500 : 45),
        notes: notes.trim(),
      });
    } else {
      onAddClient({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        defaultMode,
        defaultRate: Number(defaultRate) || (defaultMode === 'regular' ? 4500 : 45),
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Compute metrics per client
  const clientMetrics = clients.map((c) => {
    const relatedBooks = history.filter(
      (b) => b.clientId === c.id || (b.clientName && b.clientName.toLowerCase() === c.name.toLowerCase())
    );
    const totalEarnings = relatedBooks.reduce((sum, b) => sum + (b.payout || 0), 0);
    const totalHours = relatedBooks.reduce((sum, b) => sum + (b.hours || 0), 0);
    const bookCount = relatedBooks.length;
    return {
      ...c,
      totalEarnings,
      totalHours,
      bookCount,
    };
  });

  const filteredClients = clientMetrics.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalClientsEarnings = clientMetrics.reduce((sum, c) => sum + c.totalEarnings, 0);

  return (
    <section className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>{lang === 'he' ? 'ניהול לקוחות, מו"לים והוצאות ספרים' : 'קליענטן און פארלאגן פארוואלטונג'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {lang === 'he' ? 'מאגר לקוחות ותעריפים מותאמים' : 'קליענטן דאטאבאזע'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-xl">
              {lang === 'he'
                ? 'נהל לכל מו"ל או מחבר ספרים את התעריף הקבוע שלו (תווים או שעתי). בבחירת לקוח התעריף והחישוב יתעדכנו מיידית!'
                : 'באשטימט פאר יעדן פארלאג דעם אייגענעם פרייז. אלעס ווערט אויסגערעכנט אויטאמאטיש.'}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'he' ? 'הוסף לקוח / הוצאה חדשה' : 'צוגעבן נייעם קליענט'}</span>
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-indigo-800/60 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-indigo-700/30">
            <span className="text-indigo-300 block mb-0.5">{lang === 'he' ? 'סה"כ לקוחות פעילים' : 'קליענטן'}</span>
            <span className="text-xl font-bold font-mono text-white">{clients.length}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-indigo-700/30">
            <span className="text-indigo-300 block mb-0.5">{lang === 'he' ? 'סה"כ הכנסות מצטברות' : 'סך הכל הכנסה'}</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ₪{Math.round(totalClientsEarnings).toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-indigo-700/30 col-span-2 sm:col-span-1">
            <span className="text-indigo-300 block mb-0.5">{lang === 'he' ? 'ספרים בארכיון הלקוחות' : 'געענדיגטע ספרים'}</span>
            <span className="text-xl font-bold font-mono text-indigo-300">
              {clientMetrics.reduce((s, c) => s + c.bookCount, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 card-shadow">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang === 'he' ? 'חפש לקוח לפי שם, איש קשר או הערות...' : 'זוך קליענט...'}
          className="w-full bg-transparent text-sm font-medium outline-none text-slate-800 placeholder-slate-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
          >
            {lang === 'he' ? 'נקה' : 'רייניקן'}
          </button>
        )}
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 card-shadow p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            {searchTerm
              ? (lang === 'he' ? 'לא נמצאו לקוחות תואמים' : 'קיין קליענטן געפונען')
              : (lang === 'he' ? 'עדיין לא הוספת לקוחות' : 'נאך נישטא קיין קליענטן')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {lang === 'he'
              ? 'הוסף את ההוצאות לאור, המחברים והלקוחות הקבועים שלך, והגדר לכל אחד את תעריף העבודה שלו.'
              : 'לייג צו דיינע קליענטן און פארלאגן צו פארוואלטן פרייזן.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'he' ? 'הוסף לקוח ראשון' : 'צוגעבן קליענט'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-3xl border border-slate-200/90 card-shadow p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {client.name}
                      </h4>
                      {client.contactPerson && (
                        <span className="text-xs text-slate-500 block">{client.contactPerson}</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg border ${
                      client.defaultMode === 'regular'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {client.defaultMode === 'regular'
                      ? (lang === 'he' ? 'לפי תווים' : 'לויט אותיות')
                      : (lang === 'he' ? 'תעריף שעתי' : 'שעה לוין')}
                  </span>
                </div>

                {/* Rate Details */}
                <div className="mt-3.5 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500 block text-[10px] font-semibold">{lang === 'he' ? 'תעריף מוגדר:' : 'באשטימט פרייז:'}</span>
                    <span className="font-mono font-bold text-slate-800">
                      {client.defaultMode === 'regular'
                        ? `${client.defaultRate.toLocaleString()} ${lang === 'he' ? 'תווים ל-45 ₪' : 'אותיות'}`
                        : `${client.defaultRate} ₪ ${lang === 'he' ? 'לשעה' : 'פער שעה'}`}
                    </span>
                  </div>
                  <Coins className="w-4 h-4 text-amber-500" />
                </div>

                {/* Contact Info */}
                {(client.phone || client.email) && (
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-1.5 hover:text-indigo-600 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span dir="ltr" className="font-mono text-[11px]">{client.phone}</span>
                      </a>
                    )}
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        className="flex items-center gap-1.5 hover:text-indigo-600 transition truncate"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-[11px]">{client.email}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Notes */}
                {client.notes && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                    {client.notes}
                  </p>
                )}

                {/* History Summary for this client */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">{lang === 'he' ? 'ספרים שהושלמו' : 'ספרים'}</span>
                    <span className="font-bold text-slate-700">{client.bookCount}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-1.5 rounded-xl border border-emerald-100/50">
                    <span className="text-[10px] text-emerald-600 block">{lang === 'he' ? 'הכנסה מצטברת' : 'הכנסה'}</span>
                    <span className="font-bold text-emerald-700 font-mono">₪{Math.round(client.totalEarnings).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectClientForWork(client)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
                  title="בחר לקוח זה והגדר מיד את התעריף שלו במעקב העבודה"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'he' ? 'עבוד עבור לקוח זה' : 'אנהייבן ארבעט'}</span>
                </button>

                <button
                  onClick={() => openEditModal(client)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                  title={lang === 'he' ? 'ערוך פרטי לקוח' : 'ענדערן'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(lang === 'he' ? `למחוק את הלקוח "${client.name}"?` : 'אויסמעקן קליענט?')) {
                      onDeleteClient(client.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title={lang === 'he' ? 'מחק לקוח' : 'אויסמעקן'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>{editingClient ? (lang === 'he' ? 'עריכת פרטי לקוח' : 'ענדערן קליענט') : (lang === 'he' ? 'הוספת לקוח / הוצאה לאור' : 'צוגעבן קליענט')}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'he' ? 'הגדר את פרטי ההתקשרות והתעריף האישי של הלקוח.' : 'באשטימט קליענט דעטאלן און פרייז.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{lang === 'he' ? 'שם הלקוח / הוצאה לאור *' : 'קליענט נאמען *'}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: הוצאת ספרים ירושלים, הרב כהן"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'he' ? 'איש קשר' : 'קאנטאקט פערזאן'}</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="שם איש הקשר"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{lang === 'he' ? 'טלפון' : 'טעלעפאן'}</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-1234567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:border-indigo-600 focus:bg-white transition text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{lang === 'he' ? 'דואר אלקטרוני' : 'אימעיל'}</label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:border-indigo-600 focus:bg-white transition text-right"
                />
              </div>

              {/* Pricing Mode & Rate */}
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 space-y-3">
                <span className="font-bold text-indigo-900 block">{lang === 'he' ? 'הגדרת תעריף ברירת מחדל ללקוח זה:' : 'באשטימט פרייז פאר קליענט:'}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultMode('regular');
                      if (defaultRate <= 100) setDefaultRate(4500);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                      defaultMode === 'regular'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {lang === 'he' ? 'לפי תווים (ל-45 ₪)' : 'לויט אותיות'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultMode('hourly');
                      if (defaultRate > 500) setDefaultRate(50);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                      defaultMode === 'hourly'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {lang === 'he' ? 'לפי שעה (₪/שעה)' : 'שעה לוין'}
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {defaultMode === 'regular'
                      ? (lang === 'he' ? 'תווים לחישוב 45 ₪ (ברירת מחדל: 4500)' : 'אותיות פאר 45 ₪')
                      : (lang === 'he' ? 'תעריף שעתי בש"ח (למשל: 50)' : 'שעה לוין אין ₪')}
                  </label>
                  <input
                    type="number"
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold font-mono outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{lang === 'he' ? 'הערות / דגשים מיוחדים' : 'באמערקונגען'}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="הוראות עיצוב, מועדי תשלום, הנחיות הגהה..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl transition shadow-md"
                >
                  {editingClient ? (lang === 'he' ? 'שמור שינויים' : 'שפייכלערן') : (lang === 'he' ? 'הוסף לקוח' : 'צוגעבן')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  {lang === 'he' ? 'ביטול' : 'קנסל'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
