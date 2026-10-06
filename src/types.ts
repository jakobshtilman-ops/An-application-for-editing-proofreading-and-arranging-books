export type WorkMode = 'regular' | 'hourly';
export type Language = 'he' | 'yi';
export type GoalTimeRange = 'hours' | 'days' | 'weeks' | 'months';
export type GoalMetric = 'chars' | 'hours' | 'earnings' | 'books';

export interface GoalRecord {
  id: string;
  title: string;
  metric: GoalMetric;
  targetValue: number;
  currentValue?: number; // optional manual progress or auto-calculated
  timeRange: GoalTimeRange;
  deadline?: string; // ISO date string YYYY-MM-DD or datetime
  completed: boolean;
  autoTrack?: boolean; // automatically sync from session logs & active clock
  createdAt: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  defaultMode: WorkMode; // 'regular' (תווים) or 'hourly' (שעתי)
  defaultRate: number; // e.g. 4500 chars per 45₪ or 50 ₪/hour
  notes?: string;
  createdAt: string;
}

export interface PomodoroConfig {
  enabled: boolean;
  workMinutes: number; // default 25
  breakMinutes: number; // default 5
  soundEnabled: boolean;
}

export interface BookArchiveRecord {
  id: string;
  month: string; // yyyy-mm
  bookName: string;
  clientId?: string;
  clientName?: string;
  pages: number;
  chars3: number; // total target chars in book
  chars16: number; // chars worked
  hours: number; // in hours (decimal)
  rate: number; // publisher rate in chars/hr
  payout: number; // ₪
}

export interface SessionLogRecord {
  id: string;
  timestamp: string; // ISO string
  bookName: string;
  clientId?: string;
  clientName?: string;
  chars: number;
  seconds: number;
  rate: number;
}

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  desc: string;
  category: 'reference' | 'publisher' | 'utility';
}

export interface BackupPayload {
  bookHistory: BookArchiveRecord[];
  sessionLogs: SessionLogRecord[];
  usefulLinks: UsefulLink[];
  clients?: ClientRecord[];
  bookNameInput: string;
  bookPagesInput: number;
  targetRateInput: string;
  totalBookChars: number;
  accumulatedSeconds: number;
  clipboardText: string;
  manualCharInput: number;
  activeWorkMode: WorkMode;
  hourlyRate: number;
  preferredLang: Language;
  quickNotes?: string;
  goals?: GoalRecord[];
  pomodoroConfig?: PomodoroConfig;
  exportDate: string;
}
