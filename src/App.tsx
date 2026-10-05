/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorkMode, Language, BookArchiveRecord, SessionLogRecord, UsefulLink, BackupPayload, GoalRecord, ClientRecord, PomodoroConfig } from './types';
import { SafeStorage } from './utils/safeStorage';
import { FileSystemSync } from './utils/fileSystemSync';
import { playSuccessSound, playStartSound, playStopSound, playPomodoroBreakSound, playPomodoroWorkSound } from './utils/sound';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Header } from './components/Header';
import { FloatingMiniTimer } from './components/FloatingMiniTimer';
import { WorkTrackerTab } from './components/WorkTrackerTab';
import { ClientsTab } from './components/ClientsTab';
import { GoalsTab } from './components/GoalsTab';
import { CalculatorsTab } from './components/CalculatorsTab';
import { DashboardTab } from './components/DashboardTab';
import { ArchiveTab } from './components/ArchiveTab';
import { SessionLogsTab } from './components/SessionLogsTab';
import { UsefulLinksTab } from './components/UsefulLinksTab';
import {
  ManualTimeModal,
  ManualArchiveModal,
  ManualSessionModal,
  ManualLinkModal,
  ConfirmResetModal,
} from './components/Modals';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

const seedHistory: BookArchiveRecord[] = [
  { id: '1', month: '2026-05', bookName: 'ספר הניתוח המהיר', pages: 180, chars3: 540000, chars16: 154000, hours: 32.5, rate: 4500, payout: 1540 },
  { id: '2', month: '2026-04', bookName: 'מבוא לפרודוקטיביות', pages: 210, chars3: 630000, chars16: 210000, hours: 44.8, rate: 4500, payout: 2100 },
  { id: '3', month: '2026-03', bookName: 'מגמות העתיד', pages: 98, chars3: 294000, chars16: 98000, hours: 22.0, rate: 4500, payout: 980 },
  { id: '4', month: '2026-02', bookName: 'חישוב מודולרי', pages: 185, chars3: 555000, chars16: 185000, hours: 38.2, rate: 4500, payout: 1850 },
];

const seedSessions: SessionLogRecord[] = [
  { id: 's1', timestamp: '2026-05-10T09:30:00.000Z', bookName: 'ספר הניתוח המהיר', chars: 4600, seconds: 2700, rate: 4500 },
  { id: 's2', timestamp: '2026-05-11T13:15:00.000Z', bookName: 'ספר הניתוח המהיר', chars: 1400, seconds: 1200, rate: 4500 },
  { id: 's3', timestamp: '2026-05-13T19:45:00.000Z', bookName: 'ספר הניתוח המהיר', chars: 6100, seconds: 4200, rate: 4500 },
  { id: 's4', timestamp: '2026-05-14T23:00:00.000Z', bookName: 'ספר הניתוח המהיר', chars: 7800, seconds: 6600, rate: 4500 },
  { id: 's5', timestamp: '2026-05-17T10:10:00.000Z', bookName: 'ספר הניתוח המהיר', chars: 4800, seconds: 3300, rate: 4500 },
  { id: 's6', timestamp: '2026-05-18T14:40:00.000Z', bookName: 'ספר הניתוח המהיר', chars: 2800, seconds: 2100, rate: 4500 },
  { id: 's7', timestamp: '2026-05-19T18:00:00.000Z', bookName: 'ספר הניתוח המהיר', chars: 6400, seconds: 4800, rate: 4500 },
];

const seedLinks: UsefulLink[] = [
  { id: 'l1', title: 'האקדמיה ללשון העברית', url: 'https://hebrew-academy.org.il', desc: 'שאלות ותשובות, מונחים לשוניים, החלטות דקדוקיות וכללים רשמיים.', category: 'reference' },
  { id: 'l2', title: 'מילון רב-מילים', url: 'https://www.ravmilim.co.il', desc: 'המילון העברי המורפולוגי המקיף ביותר ברשת לשימוש עורכים.', category: 'reference' },
  { id: 'l3', title: 'דיקטה (Dicta)', url: 'https://dicta.org.il', desc: 'כלי ניקוד ממוחשב, השוואת טקסטים, זיהוי מקבילות וקידוד ספרותי חכם.', category: 'utility' },
  { id: 'l4', title: 'מפעל הניקוד האוטומטי - נקדן', url: 'https://www.nakdan.com', desc: 'כלי ניקוד אוטומטי מהיר לטקסטים ומאמרים תורניים וכלליים.', category: 'utility' },
  { id: 'l5', title: 'פורטל הוצאות ספרים ארצי', url: 'https://he.wikipedia.org/wiki/%D7%94%D7%95%D7%A6%D7%90%D7%AA_%D7%A1%D7%A4%D7%A8%D7%99%D7%9D', desc: 'רשימת הוצאות ספרים, מו"לים וארגוני הוצאה לאור בישראל.', category: 'publisher' },
];

const seedGoals: GoalRecord[] = [
  {
    id: 'g1',
    title: 'יעד יומי: הספק של 20,000 תווים',
    metric: 'chars',
    targetValue: 20000,
    currentValue: 12500,
    timeRange: 'days',
    deadline: new Date().toISOString().slice(0, 10),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g2',
    title: 'יעד שבועי: סיום עריכת 100,000 תווים בספר',
    metric: 'chars',
    targetValue: 100000,
    currentValue: 48000,
    timeRange: 'weeks',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g3',
    title: 'יעד חודשי: 60 שעות עבודה מרוכזות',
    metric: 'hours',
    targetValue: 60,
    currentValue: 34,
    timeRange: 'months',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

const seedClients: ClientRecord[] = [
  {
    id: 'c1',
    name: 'הוצאת ספרים ירושלים',
    contactPerson: 'הרב שמואל קליין',
    phone: '052-1234567',
    email: 'jerusalem.pub@gmail.com',
    defaultMode: 'regular',
    defaultRate: 4500,
    notes: 'הגהה מדוקדקת לפי כללי המסורה. תשלום שוטף + 30.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'מכון אור התורה',
    contactPerson: 'רבי אהרן פרידמן',
    phone: '054-9876543',
    email: 'or.hatora@gmail.com',
    defaultMode: 'hourly',
    defaultRate: 55,
    notes: 'עריכה תורנית והשוואת כתבי יד. תעריף 55 ₪ לשעה.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'הוצאת פלדהיים (מחברים עצמאיים)',
    contactPerson: 'יעקב לוי',
    phone: '050-4445555',
    email: 'feldheim.author@gmail.com',
    defaultMode: 'regular',
    defaultRate: 4200,
    notes: 'ספרי קריאה ועיון. תעריף בונוס 4,200 תווים ל-45 ₪.',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const isOnline = useOnlineStatus();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('tracker');

  // Linked Computer Disk File
  const [linkedFileName, setLinkedFileName] = useState<string | null>(() => {
    return SafeStorage.getItem('linkedFileName');
  });

  // Work Mode & Language
  const [workMode, setWorkMode] = useState<WorkMode>(() => {
    return (SafeStorage.getItem('activeWorkMode') as WorkMode) || 'regular';
  });

  const [hourlyRate, setHourlyRate] = useState<number>(() => {
    return parseFloat(SafeStorage.getItem('hourlyRateSetting') || '45') || 45;
  });

  const [lang, setLang] = useState<Language>(() => {
    return (SafeStorage.getItem('preferredLang') as Language) || 'he';
  });

  // Book Config inputs
  const [bookName, setBookName] = useState<string>(() => {
    return SafeStorage.getItem('bookNameInput') ?? 'ספר הספרים';
  });

  const [bookPages, setBookPages] = useState<number>(() => {
    return parseFloat(SafeStorage.getItem('bookPagesInput') || '120') || 120;
  });

  const [targetRateInput, setTargetRateInput] = useState<string>(() => {
    return SafeStorage.getItem('targetRateInput') ?? '4500';
  });

  const [totalBookChars, setTotalBookChars] = useState<number>(() => {
    return parseFloat(SafeStorage.getItem('totalBookChars') || '540000') || 540000;
  });

  // Character inputs
  const [clipboardText, setClipboardText] = useState<string>(() => {
    return SafeStorage.getItem('clipboardText') ?? '';
  });

  const [manualChars, setManualChars] = useState<number>(() => {
    return parseFloat(SafeStorage.getItem('manualCharInput') || '0') || 0;
  });

  // Quick Notes state (temporary thoughts & editing instructions for current book)
  const [quickNotes, setQuickNotes] = useState<string>(() => {
    return SafeStorage.getItem('quickNotes') ?? '';
  });

  // Accumulated Timer Seconds
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(() => {
    return parseFloat(SafeStorage.getItem('accumulatedSeconds') || '0') || 0;
  });

  // Root Level Resilient Timer State (immune to background throttling, tab switching, minimizing)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState<number>(() => {
    return parseFloat(SafeStorage.getItem('accumulatedSeconds') || '0') || 0;
  });
  const [isFloatingMiniOpen, setIsFloatingMiniOpen] = useState(false);
  const startCharsRef = React.useRef<number>(0);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // Clients Database & Active Client
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    try {
      const saved = SafeStorage.getItem('userClients');
      return saved ? JSON.parse(saved) : seedClients;
    } catch {
      return seedClients;
    }
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return SafeStorage.getItem('selectedClientId') || '';
  });

  // Pomodoro Configuration & Runtime State
  const [pomodoroConfig, setPomodoroConfig] = useState<PomodoroConfig>(() => {
    try {
      const saved = SafeStorage.getItem('pomodoroConfig');
      return saved ? JSON.parse(saved) : { enabled: false, workMinutes: 25, breakMinutes: 5, soundEnabled: true };
    } catch {
      return { enabled: false, workMinutes: 25, breakMinutes: 5, soundEnabled: true };
    }
  });

  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState<number>(25 * 60);
  const [pomodoroCompletedCycles, setPomodoroCompletedCycles] = useState<number>(0);

  // Synchronize timer display and protect against tab throttling
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isTimerRunning && timerStartedAt !== null) {
      const updateClock = () => {
        const now = Date.now();
        const elapsed = (now - timerStartedAt) / 1000;
        setDisplaySeconds(accumulatedSeconds + elapsed);

        // Pomodoro Tick
        if (pomodoroConfig.enabled) {
          setPomodoroSecondsLeft((prev) => {
            if (prev <= 1) {
              if (pomodoroPhase === 'work') {
                if (pomodoroConfig.soundEnabled) playPomodoroBreakSound();
                setPomodoroPhase('break');
                showToast(lang === 'he' ? '🍅 סיימת 25 דקות עבודה מרוכזות! צא להפסקת מנוחה של 5 דקות.' : 'פאָמאָדאָראָ פאַרטיג! נעם אַ פויזע.');
                return pomodoroConfig.breakMinutes * 60;
              } else {
                if (pomodoroConfig.soundEnabled) playPomodoroWorkSound();
                setPomodoroPhase('work');
                setPomodoroCompletedCycles((c) => c + 1);
                showToast(lang === 'he' ? '☕ ההפסקה הסתיימה! חוזרים לעבודה מרוכזת.' : 'פויזע פארטיג! צוריק צום ארבעט.');
                return pomodoroConfig.workMinutes * 60;
              }
            }
            return prev - 1;
          });
        }
      };

      updateClock();
      intervalId = setInterval(updateClock, 1000);

      const handleSync = () => {
        updateClock();
      };

      document.addEventListener('visibilitychange', handleSync);
      window.addEventListener('focus', handleSync);

      return () => {
        if (intervalId) clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleSync);
        window.removeEventListener('focus', handleSync);
      };
    } else {
      setDisplaySeconds(accumulatedSeconds);
    }
  }, [isTimerRunning, timerStartedAt, accumulatedSeconds, pomodoroConfig, pomodoroPhase, lang, showToast]);

  // Databases
  const [history, setHistory] = useState<BookArchiveRecord[]>(() => {
    try {
      const saved = SafeStorage.getItem('bookHistory');
      return saved ? JSON.parse(saved) : seedHistory;
    } catch {
      return seedHistory;
    }
  });

  const [sessionLogs, setSessionLogs] = useState<SessionLogRecord[]>(() => {
    try {
      const saved = SafeStorage.getItem('sessionLogs');
      return saved ? JSON.parse(saved) : seedSessions;
    } catch {
      return seedSessions;
    }
  });

  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>(() => {
    try {
      const saved = SafeStorage.getItem('usefulLinks');
      return saved ? JSON.parse(saved) : seedLinks;
    } catch {
      return seedLinks;
    }
  });

  const [goals, setGoals] = useState<GoalRecord[]>(() => {
    try {
      const saved = SafeStorage.getItem('userGoals');
      return saved ? JSON.parse(saved) : seedGoals;
    } catch {
      return seedGoals;
    }
  });

  // Modals state
  const [isManualTimeOpen, setIsManualTimeOpen] = useState(false);
  const [isManualArchiveOpen, setIsManualArchiveOpen] = useState(false);
  const [isManualSessionOpen, setIsManualSessionOpen] = useState(false);
  const [isManualLinkOpen, setIsManualLinkOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Storage Banner dismissed
  const [showStorageNotice, setShowStorageNotice] = useState(true);

  // Save changes to SafeStorage whenever inputs change
  useEffect(() => {
    SafeStorage.setItem('activeWorkMode', workMode);
    SafeStorage.setItem('hourlyRateSetting', hourlyRate.toString());
    SafeStorage.setItem('preferredLang', lang);
    SafeStorage.setItem('bookNameInput', bookName);
    SafeStorage.setItem('bookPagesInput', bookPages.toString());
    SafeStorage.setItem('targetRateInput', targetRateInput);
    SafeStorage.setItem('totalBookChars', totalBookChars.toString());
    SafeStorage.setItem('clipboardText', clipboardText);
    SafeStorage.setItem('manualCharInput', manualChars.toString());
    SafeStorage.setItem('quickNotes', quickNotes);
    SafeStorage.setItem('userGoals', JSON.stringify(goals));
    SafeStorage.setItem('accumulatedSeconds', accumulatedSeconds.toString());
    SafeStorage.setItem('bookHistory', JSON.stringify(history));
    SafeStorage.setItem('sessionLogs', JSON.stringify(sessionLogs));
    SafeStorage.setItem('usefulLinks', JSON.stringify(usefulLinks));
    SafeStorage.setItem('userClients', JSON.stringify(clients));
    SafeStorage.setItem('selectedClientId', selectedClientId);
    SafeStorage.setItem('pomodoroConfig', JSON.stringify(pomodoroConfig));

    // Update document title and lang attribute
    document.documentElement.lang = lang;
    document.documentElement.dir = 'rtl';
  }, [
    workMode,
    hourlyRate,
    lang,
    bookName,
    bookPages,
    targetRateInput,
    totalBookChars,
    clipboardText,
    manualChars,
    quickNotes,
    goals,
    accumulatedSeconds,
    history,
    sessionLogs,
    usefulLinks,
    clients,
    selectedClientId,
    pomodoroConfig,
  ]);

  // Clients CRUD Handlers
  const handleAddClient = (clientData: Omit<ClientRecord, 'id' | 'createdAt'>) => {
    const newClient: ClientRecord = {
      id: `c_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...clientData,
    };
    setClients((prev) => [newClient, ...prev]);
    showToast(lang === 'he' ? `הלקוח "${newClient.name}" נוסף בהצלחה!` : 'קליענט צוגעלייגט!');
  };

  const handleUpdateClient = (id: string, updated: Partial<ClientRecord>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    showToast(lang === 'he' ? 'פרטי הלקוח עודכנו בהצלחה!' : 'קליענט דערהיינטיגט!');
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (selectedClientId === id) {
      setSelectedClientId('');
    }
    showToast(lang === 'he' ? 'הלקוח נמחק מהמאגר.' : 'קליענט אויסגעמעקט.');
  };

  const handleSelectClient = (client: ClientRecord | null) => {
    if (client) {
      setSelectedClientId(client.id);
      SafeStorage.setItem('selectedClientId', client.id);
      setWorkMode(client.defaultMode);
      if (client.defaultMode === 'regular') {
        setTargetRateInput(client.defaultRate.toString());
      } else {
        setHourlyRate(client.defaultRate);
      }
      showToast(lang === 'he' ? `הלקוח "${client.name}" נבחר והתעריף עודכן!` : 'קליענט אויסגעקליבן!');
    } else {
      setSelectedClientId('');
      SafeStorage.removeItem('selectedClientId');
    }
  };

  // Pomodoro Actions
  const handleTogglePomodoro = () => {
    setPomodoroConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      SafeStorage.setItem('pomodoroConfig', JSON.stringify(next));
      if (!prev.enabled) {
        setPomodoroPhase('work');
        setPomodoroSecondsLeft(next.workMinutes * 60);
        showToast(lang === 'he' ? 'מצב פומודורו הופעל (25 דק עבודה / 5 דק מנוחה)' : 'פאָמאָדאָראָ אנגעצינדן');
      } else {
        showToast(lang === 'he' ? 'מצב פומודורו בוטל' : 'פאָמאָדאָראָ פארלאזט');
      }
      return next;
    });
  };

  const handleSkipPomodoroPhase = () => {
    if (pomodoroPhase === 'work') {
      if (pomodoroConfig.soundEnabled) playPomodoroBreakSound();
      setPomodoroPhase('break');
      setPomodoroSecondsLeft(pomodoroConfig.breakMinutes * 60);
      showToast(lang === 'he' ? 'דלגת לשלב מנוחה (5 דקות)' : 'איבערגעהיפט צו פויזע');
    } else {
      if (pomodoroConfig.soundEnabled) playPomodoroWorkSound();
      setPomodoroPhase('work');
      setPomodoroSecondsLeft(pomodoroConfig.workMinutes * 60);
      setPomodoroCompletedCycles((c) => c + 1);
      showToast(lang === 'he' ? 'דלגת לשלב עבודה מרוכזת (25 דקות)' : 'איבערגעהיפט צו ארבעט');
    }
  };

  // Timer Toggle Handler
  const toggleTimer = useCallback(() => {
    const cleanClipboard = clipboardText.replace(/\r/g, '').replace(/\n/g, '').replace(/\s/g, ' ');
    const finalCharCount = Math.max(cleanClipboard.length, manualChars);

    if (!isTimerRunning) {
      playStartSound();
      const now = Date.now();
      setTimerStartedAt(now);
      startCharsRef.current = finalCharCount;
      setIsTimerRunning(true);
      showToast(lang === 'he' ? 'סשן העבודה החל!' : 'ארבעט סעסיע אנגעהויבן!');
    } else {
      playStopSound();
      const now = Date.now();
      const sessionSeconds = timerStartedAt ? (now - timerStartedAt) / 1000 : 0;
      const updatedTotal = accumulatedSeconds + sessionSeconds;
      setAccumulatedSeconds(updatedTotal);
      setDisplaySeconds(updatedTotal);
      setIsTimerRunning(false);
      setTimerStartedAt(null);

      if (sessionSeconds > 5) {
        const sessionChars = Math.max(0, finalCharCount - startCharsRef.current);
        const targetRateNum = parseFloat(targetRateInput) || 4500;
        const newSession: SessionLogRecord = {
          id: `s_${Date.now()}`,
          timestamp: new Date().toISOString(),
          bookName: bookName || 'ספר ללא שם',
          chars: sessionChars,
          seconds: Math.round(sessionSeconds),
          rate: targetRateNum,
        };
        setSessionLogs((prev) => [newSession, ...prev]);
      }
      showToast(lang === 'he' ? 'סשן העבודה הושהה!' : 'ארבעט סעסיע אפגעשטעלט!');
    }
  }, [isTimerRunning, timerStartedAt, accumulatedSeconds, clipboardText, manualChars, targetRateInput, bookName, lang, showToast]);

  // Global Keyboard Shortcuts (Ctrl+Space to toggle timer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.altKey && (e.key === 's' || e.key === 'ד')) {
        e.preventDefault();
        toggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer]);

  // Dynamic Document Title with Live Stopwatch
  useEffect(() => {
    if (isTimerRunning) {
      const s = Math.floor(displaySeconds);
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      document.title = `⏱️ ${pad(hrs)}:${pad(mins)}:${pad(secs)} | ${bookName || 'קלדנות'}`;
    } else {
      document.title = lang === 'he' ? 'מערכת קלדנות וניהול פרודוקטיביות' : 'קלדנות און פראדוקטיוויטעט סיסטעם';
    }
  }, [isTimerRunning, displaySeconds, bookName, lang]);

  // Master Payload Builder
  const prepareBackupPayload = useCallback((): BackupPayload => {
    return {
      bookHistory: history,
      sessionLogs,
      usefulLinks,
      clients,
      bookNameInput: bookName,
      bookPagesInput: bookPages,
      targetRateInput,
      totalBookChars,
      accumulatedSeconds,
      clipboardText,
      manualCharInput: manualChars,
      activeWorkMode: workMode,
      hourlyRate,
      preferredLang: lang,
      quickNotes,
      goals,
      pomodoroConfig,
      exportDate: new Date().toISOString(),
    };
  }, [
    history,
    sessionLogs,
    usefulLinks,
    clients,
    bookName,
    bookPages,
    targetRateInput,
    totalBookChars,
    accumulatedSeconds,
    clipboardText,
    manualChars,
    workMode,
    hourlyRate,
    lang,
    quickNotes,
    goals,
    pomodoroConfig,
  ]);

  // Direct Computer Disk File Operations (File System Access API)
  const handleLinkComputerFile = async () => {
    const payload = prepareBackupPayload();
    const payloadStr = JSON.stringify(payload, null, 2);

    const defaultFileName = `ספר_${bookName ? bookName.replace(/\s+/g, '_') : 'קלדנות'}_גיבוי.json`;
    const res = await FileSystemSync.linkOrCreateFile(defaultFileName);

    if (res.success && res.fileName) {
      setLinkedFileName(res.fileName);
      SafeStorage.setItem('linkedFileName', res.fileName);
      await FileSystemSync.writeToLinkedFile(payloadStr);
      playSuccessSound();
      showToast(
        lang === 'he'
          ? `קובץ מקושר ישירות למחשב: ${res.fileName}`
          : `פייל פארבונדן צום קאמפיוטער: ${res.fileName}`
      );
    } else if (res.error === 'unsupported') {
      FileSystemSync.downloadFallback(payloadStr, defaultFileName);
      showToast(
        lang === 'he'
          ? 'קובץ הנתונים נשמר בתיקיית ההורדות במחשב שלך!'
          : 'פייל געשפייכלערט אינעם קאמפיוטער!'
      );
    }
  };

  const handleSaveToComputerDisk = async () => {
    const payload = prepareBackupPayload();
    const payloadStr = JSON.stringify(payload, null, 2);

    if (FileSystemSync.hasActiveFile()) {
      const res = await FileSystemSync.writeToLinkedFile(payloadStr);
      if (res.success) {
        playSuccessSound();
        showToast(
          lang === 'he'
            ? `נשמר בהצלחה ישירות לקובץ במחשב (${linkedFileName || 'בדיסק'})!`
            : `געשפייכלערט דירעקט צום קאמפיוטער פייל!`
        );
        return;
      }
    }

    // If not linked yet, initiate linking
    await handleLinkComputerFile();
  };

  const handleDisconnectComputerFile = () => {
    FileSystemSync.disconnect();
    setLinkedFileName(null);
    SafeStorage.removeItem('linkedFileName');
    showToast(lang === 'he' ? 'הקישור לקובץ המחשב נותק.' : 'דער פייל איז אפגערוקט.');
  };

  // Goals operations
  const handleAddGoal = (newGoalData: Omit<GoalRecord, 'id' | 'createdAt'>) => {
    const goal: GoalRecord = {
      ...newGoalData,
      id: `g_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [goal, ...prev]);
    playSuccessSound();
    showToast(lang === 'he' ? 'יעד חדש נוצר בהצלחה!' : 'נייער ציל באשאפן!');
  };

  const handleToggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const handleUpdateGoalProgress = (id: string, delta: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updated = Math.max(0, (g.currentValue || 0) + delta);
          return {
            ...g,
            currentValue: updated,
            completed: updated >= g.targetValue ? true : g.completed,
          };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    showToast(lang === 'he' ? 'היעד נמחק.' : 'דער ציל איז אויסגעמעקט געווארן.');
  };

  // Manual save trigger
  const handleManualSave = async () => {
    SafeStorage.setItem('accumulatedSeconds', accumulatedSeconds.toString());
    SafeStorage.setItem('quickNotes', quickNotes);
    SafeStorage.setItem('userGoals', JSON.stringify(goals));
    SafeStorage.setItem('bookHistory', JSON.stringify(history));
    SafeStorage.setItem('sessionLogs', JSON.stringify(sessionLogs));
    SafeStorage.setItem('usefulLinks', JSON.stringify(usefulLinks));

    // If user has a linked file on their computer disk, auto-sync directly to it too!
    if (FileSystemSync.hasActiveFile()) {
      const payload = prepareBackupPayload();
      await FileSystemSync.writeToLinkedFile(JSON.stringify(payload, null, 2));
    }

    playSuccessSound();
    showToast(
      lang === 'he'
        ? linkedFileName
          ? `נשמר בהצלחה במכשיר ובקובץ במחשב (${linkedFileName})!`
          : 'כל הנתונים נשמרו בהצלחה במכשיר ובזיכרון המקומי!'
        : 'אלע דאטן געשפייכלערט מיט ערפאלג!'
    );
  };

  // Full backup export (JSON file download)
  const handleExportBackup = () => {
    const backup = prepareBackupPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = lang === 'he' ? `גיבוי_מערכת_קלדנות_${dateStr}.json` : `קלדנות_גיבוי_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    playSuccessSound();
    showToast(lang === 'he' ? 'קובץ הגיבוי יוצא בהצלחה למחשב!' : 'גיבוי פייל עקספארטירט!');
  };

  // Full backup import (JSON file upload) - 100% async, instant, never gets stuck
  const handleImportBackup = async (file: File) => {
    try {
      showToast(lang === 'he' ? 'טוען קובץ גיבוי...' : 'לייענט פייל...');
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data || typeof data !== 'object') {
        throw new Error('קובץ לא תקין');
      }

      if (Array.isArray(data.bookHistory)) setHistory(data.bookHistory);
      if (Array.isArray(data.sessionLogs)) setSessionLogs(data.sessionLogs);
      if (Array.isArray(data.usefulLinks)) setUsefulLinks(data.usefulLinks);
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.clients)) setClients(data.clients);
      if (data.bookNameInput !== undefined) setBookName(String(data.bookNameInput));
      if (data.bookPagesInput !== undefined) setBookPages(Number(data.bookPagesInput) || 0);
      if (data.targetRateInput !== undefined) setTargetRateInput(String(data.targetRateInput));
      if (data.totalBookChars !== undefined) setTotalBookChars(Number(data.totalBookChars) || 0);
      if (data.accumulatedSeconds !== undefined) {
        const sec = Number(data.accumulatedSeconds) || 0;
        setAccumulatedSeconds(sec);
        setDisplaySeconds(sec);
      }
      if (data.clipboardText !== undefined) setClipboardText(String(data.clipboardText));
      if (data.manualCharInput !== undefined) setManualChars(Number(data.manualCharInput) || 0);
      if (data.quickNotes !== undefined) setQuickNotes(String(data.quickNotes));
      if (data.activeWorkMode !== undefined) setWorkMode(data.activeWorkMode);
      if (data.hourlyRate !== undefined) setHourlyRate(Number(data.hourlyRate) || 45);
      if (data.preferredLang !== undefined) setLang(data.preferredLang);
      if (data.pomodoroConfig) setPomodoroConfig(data.pomodoroConfig);

      playSuccessSound();
      showToast(lang === 'he' ? 'כל הנתונים שוחזרו בהצלחה מקובץ הגיבוי!' : 'דאטן אימפארטירט מיט ערפאלג!');
    } catch (err) {
      console.error('Import error:', err);
      showToast(lang === 'he' ? 'שגיאה: קובץ ה-JSON אינו תקין או פגום.' : 'שגיאה ביים לייענען דעם JSON פייל.');
    }
  };

  // Automated session log on timer pause
  const handleSessionRecorded = (elapsedSeconds: number, chars: number, rate: number) => {
    const newSession: SessionLogRecord = {
      id: `s_${Date.now()}`,
      timestamp: new Date().toISOString(),
      bookName: bookName || 'ספר ללא שם',
      chars,
      seconds: Math.round(elapsedSeconds),
      rate,
    };
    setSessionLogs((prev) => [newSession, ...prev]);
  };

  // Reset timer / Archive action
  const handleConfirmReset = (shouldArchive: boolean) => {
    setIsConfirmResetOpen(false);

    if (shouldArchive) {
      const cleanClipboard = clipboardText.replace(/\r/g, '').replace(/\n/g, '').replace(/\s/g, ' ');
      const finalChars = Math.max(cleanClipboard.length, manualChars);
      const targetRateNum = parseFloat(targetRateInput) || 4500;
      const hours = accumulatedSeconds / 3600;

      let payout = 0;
      if (workMode === 'regular') {
        payout = (finalChars / targetRateNum) * 45;
      } else {
        payout = hours * hourlyRate;
      }

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const newArchiveRecord: BookArchiveRecord = {
        id: String(Date.now()),
        month: currentMonth,
        bookName: bookName || 'ספר ללא שם',
        pages: bookPages,
        chars3: totalBookChars,
        chars16: finalChars,
        hours: parseFloat(hours.toFixed(4)),
        rate: targetRateNum,
        payout,
      };

      setHistory((prev) => [newArchiveRecord, ...prev]);
      showToast(lang === 'he' ? 'הספר אורכב בהצלחה בארכיון הספרים!' : 'ספר געשפייכלערט אין ארכיוו!');
    }

    setIsTimerRunning(false);
    setTimerStartedAt(null);
    setDisplaySeconds(0);
    setAccumulatedSeconds(0);
    setClipboardText('');
    setManualChars(0);
    showToast(lang === 'he' ? 'שעון העבודה אופס בהצלחה!' : 'ארבעט זייגער רעסעטירט!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative pb-16">
      {/* Top Banner indicating full offline security */}
      {showStorageNotice && (
        <div className="bg-indigo-900 text-indigo-100 px-4 py-2 text-center text-xs font-semibold shadow-xs relative z-50 flex items-center justify-center gap-2 border-b border-indigo-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {lang === 'he'
              ? 'מצב שמירה מקומית פעיל! המערכת פועלת 100% באופליין ומאחסנת את כל הנתונים, הטיימר והסשנים במחשב שלך ללא תלות ברשת.'
              : 'לאקאלע שפייכלערונג מאד איז אקטיוו! אלע דאטן און טיימער זענען געשפייכלערט אויפֿן קאמפיוטער 100% אפליין.'}
          </span>
          <button
            onClick={() => setShowStorageNotice(false)}
            className="bg-indigo-800 hover:bg-indigo-700 px-2 py-0.5 rounded text-[10px] text-white transition-all ml-2"
          >
            {lang === 'he' ? 'הבנתי' : 'פארשטאנען'}
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workMode={workMode}
        setWorkMode={setWorkMode}
        hourlyRate={hourlyRate}
        setHourlyRate={setHourlyRate}
        lang={lang}
        setLang={setLang}
        onManualSave={handleManualSave}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        linkedFileName={linkedFileName}
        onLinkComputerFile={handleLinkComputerFile}
        onSaveToComputerDisk={handleSaveToComputerDisk}
        onDisconnectComputerFile={handleDisconnectComputerFile}
        isOnline={isOnline}
        isTimerRunning={isTimerRunning}
        displaySeconds={displaySeconds}
        onToggleTimer={toggleTimer}
        onOpenFloatingTimer={() => setIsFloatingMiniOpen(true)}
        clientCount={clients.length}
      />

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tracker' && (
          <WorkTrackerTab
            lang={lang}
            workMode={workMode}
            hourlyRate={hourlyRate}
            bookName={bookName}
            setBookName={setBookName}
            bookPages={bookPages}
            setBookPages={setBookPages}
            targetRateInput={targetRateInput}
            setTargetRateInput={setTargetRateInput}
            totalBookChars={totalBookChars}
            setTotalBookChars={setTotalBookChars}
            clipboardText={clipboardText}
            setClipboardText={setClipboardText}
            manualChars={manualChars}
            setManualChars={setManualChars}
            quickNotes={quickNotes}
            setQuickNotes={setQuickNotes}
            accumulatedSeconds={accumulatedSeconds}
            setAccumulatedSeconds={setAccumulatedSeconds}
            onOpenManualAdjust={() => setIsManualTimeOpen(true)}
            onOpenResetConfirm={() => setIsConfirmResetOpen(true)}
            onSessionRecorded={handleSessionRecorded}
            showToast={showToast}
            isRunning={isTimerRunning}
            toggleTimer={toggleTimer}
            displaySeconds={displaySeconds}
            onOpenFloatingMini={() => setIsFloatingMiniOpen(true)}
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectClient={handleSelectClient}
            onOpenClientsTab={() => setActiveTab('clients')}
            pomodoroConfig={pomodoroConfig}
            onTogglePomodoro={handleTogglePomodoro}
            pomodoroPhase={pomodoroPhase}
            pomodoroSecondsLeft={pomodoroSecondsLeft}
            pomodoroCompletedCycles={pomodoroCompletedCycles}
            onSkipPomodoroPhase={handleSkipPomodoroPhase}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            lang={lang}
            clients={clients}
            history={history}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onSelectClientForWork={(client) => {
              handleSelectClient(client);
              setActiveTab('tracker');
            }}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsTab
            lang={lang}
            goals={goals}
            onAddGoal={handleAddGoal}
            onToggleGoal={handleToggleGoal}
            onUpdateProgress={handleUpdateGoalProgress}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'calculators' && <CalculatorsTab lang={lang} />}

        {activeTab === 'dashboard' && (
          <DashboardTab lang={lang} history={history} sessionLogs={sessionLogs} />
        )}

        {activeTab === 'history' && (
          <ArchiveTab
            lang={lang}
            history={history}
            onOpenAddModal={() => setIsManualArchiveOpen(true)}
            onDeleteRecord={(id) => {
              setHistory((prev) => prev.filter((r) => r.id !== id));
              showToast(lang === 'he' ? 'הרשומה נמחקה מארכיון הספרים.' : 'דער ספר איז אויסגעמעקט געווארן.');
            }}
          />
        )}

        {activeTab === 'logs' && (
          <SessionLogsTab
            lang={lang}
            logs={sessionLogs}
            onOpenAddModal={() => setIsManualSessionOpen(true)}
            onDeleteSession={(id) => {
              setSessionLogs((prev) => prev.filter((s) => s.id !== id));
              showToast(lang === 'he' ? 'הסשן נמחק מהלוג.' : 'די סעסיע איז אויסגעמעקט געווארן.');
            }}
          />
        )}

        {activeTab === 'links' && (
          <UsefulLinksTab
            lang={lang}
            links={usefulLinks}
            onOpenAddModal={() => setIsManualLinkOpen(true)}
            onDeleteLink={(id) => {
              setUsefulLinks((prev) => prev.filter((l) => l.id !== id));
              showToast(lang === 'he' ? 'הקישור נמחק מהגיליון.' : 'דער לינק איז אויסגעמעקט געווארן.');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <ManualTimeModal
        isOpen={isManualTimeOpen}
        onClose={() => setIsManualTimeOpen(false)}
        lang={lang}
        currentSeconds={accumulatedSeconds}
        onSave={(newSeconds) => {
          if (newSeconds >= accumulatedSeconds) {
            setAccumulatedSeconds(newSeconds);
            showToast(lang === 'he' ? 'זמן העבודה עודכן בהצלחה!' : 'ארבעט צייט דערהיינטיגט!');
          } else {
            showToast(lang === 'he' ? 'הזמן שהוזן קטן מהזמן הקיים בשעון.' : 'די צייט איז קלענער ווי יעצט.');
          }
        }}
      />

      <ManualArchiveModal
        isOpen={isManualArchiveOpen}
        onClose={() => setIsManualArchiveOpen(false)}
        lang={lang}
        onSave={(data) => {
          let payout = 0;
          if (workMode === 'regular') {
            payout = (data.chars16 / (data.rate || 4500)) * 45;
          } else {
            payout = data.hours * hourlyRate;
          }

          const newRec: BookArchiveRecord = {
            id: String(Date.now()),
            month: data.month,
            bookName: data.bookName,
            pages: 0,
            chars3: data.chars3,
            chars16: data.chars16,
            hours: data.hours,
            rate: data.rate,
            payout,
          };
          setHistory((prev) => [newRec, ...prev]);
          showToast(lang === 'he' ? 'הספר נוסף לארכיון בהצלחה!' : 'ספר צוגעלייגט צום ארכיוו!');
        }}
      />

      <ManualSessionModal
        isOpen={isManualSessionOpen}
        onClose={() => setIsManualSessionOpen(false)}
        lang={lang}
        defaultBookName={bookName}
        onSave={(data) => {
          const newSession: SessionLogRecord = {
            id: `s_${Date.now()}`,
            timestamp: data.timestamp,
            bookName: data.bookName,
            chars: data.chars,
            seconds: data.seconds,
            rate: data.rate,
          };
          setSessionLogs((prev) => [newSession, ...prev]);
          showToast(lang === 'he' ? 'הסשן נוסף ללוג בהצלחה!' : 'סעסיע צוגעלייגט צום לאג!');
        }}
      />

      <ManualLinkModal
        isOpen={isManualLinkOpen}
        onClose={() => setIsManualLinkOpen(false)}
        lang={lang}
        onSave={(data) => {
          const newLink: UsefulLink = {
            id: `link_${Date.now()}`,
            ...data,
          };
          setUsefulLinks((prev) => [...prev, newLink]);
          showToast(lang === 'he' ? 'הקישור נוסף לגיליון בהצלחה!' : 'לינק צוגעלייגט צום בלאט!');
        }}
      />

      <ConfirmResetModal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        lang={lang}
        onConfirm={handleConfirmReset}
      />

      {/* Floating Always-On-Top Mini Timer Widget */}
      <FloatingMiniTimer
        lang={lang}
        isRunning={isTimerRunning}
        onToggleTimer={toggleTimer}
        displaySeconds={displaySeconds}
        charCount={Math.max(
          clipboardText.replace(/\r/g, '').replace(/\n/g, '').replace(/\s/g, ' ').length,
          manualChars
        )}
        bookName={bookName}
        hourlyRate={hourlyRate}
        isOpen={isFloatingMiniOpen}
        onClose={() => setIsFloatingMiniOpen(false)}
        clientName={clients.find((c) => c.id === selectedClientId)?.name}
        pomodoroActive={pomodoroConfig.enabled}
        pomodoroPhase={pomodoroPhase}
        pomodoroSecondsLeft={pomodoroSecondsLeft}
        onSkipPomodoroPhase={handleSkipPomodoroPhase}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-slate-800 transition-all duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
