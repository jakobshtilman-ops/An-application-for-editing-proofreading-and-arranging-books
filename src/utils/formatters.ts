/**
 * Precision time formatting utilities
 */

export interface StopwatchDisplay {
  mainTime: string;      // "HH:MM:SS"
  hundredths: string;    // "CC" (00-99)
  full: string;          // "HH:MM:SS.CC"
}

export const formatStopwatchWithHundredths = (totalSeconds: number): StopwatchDisplay => {
  const safe = Math.max(0, totalSeconds || 0);
  const totalHundredths = Math.floor(safe * 100);
  const hrs = Math.floor(totalHundredths / 360000);
  const mins = Math.floor((totalHundredths % 360000) / 6000);
  const secs = Math.floor((totalHundredths % 6000) / 100);
  const hundredths = totalHundredths % 100;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const mainTime = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  const hundredthsStr = pad(hundredths);

  return {
    mainTime,
    hundredths: hundredthsStr,
    full: `${mainTime}.${hundredthsStr}`,
  };
};

export const formatStopwatch = (totalSeconds: number): string => {
  const s = Math.floor(Math.max(0, totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
};

export const formatCountdown = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
};
