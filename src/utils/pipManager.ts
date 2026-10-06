/**
 * Document Picture-in-Picture & Always-on-top Floating Window Manager
 * Provides a true OS-level floating window that stays on top of Microsoft Word,
 * PDF viewers, and all other desktop applications.
 */

import { formatStopwatchWithHundredths, formatCountdown } from './formatters';

export interface PiPState {
  displaySeconds: number;
  isRunning: boolean;
  charCount: number;
  bookName: string;
  clientName?: string;
  pomodoroActive?: boolean;
  pomodoroPhase?: 'work' | 'break';
  pomodoroSecondsLeft?: number;
}

export interface PiPActions {
  onToggleTimer: () => void;
  onUpdateChars: (newCount: number) => void;
  onAddChars: (delta: number) => void;
  onSkipPomodoro?: () => void;
  onClose?: () => void;
}

let activePiPWindow: Window | null = null;
let currentActions: PiPActions | null = null;

export const PiPManager = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  },

  isOpen(): boolean {
    return activePiPWindow !== null && !activePiPWindow.closed;
  },

  async open(state: PiPState, actions: PiPActions): Promise<{ success: boolean; type: 'pip' | 'popup' | 'error'; error?: string }> {
    currentActions = actions;

    // 1. Try native Document Picture-in-Picture (True OS-level Always-on-Top over Word/PDF)
    if (this.isSupported()) {
      try {
        const pipWindow = await (window as unknown as {
          documentPictureInPicture: {
            requestWindow: (options: { width: number; height: number; preferInitialWindowPlacement?: boolean }) => Promise<Window>;
          };
        }).documentPictureInPicture.requestWindow({
          width: 360,
          height: 390,
          preferInitialWindowPlacement: true,
        });

        activePiPWindow = pipWindow;
        this.setupWindowDOM(pipWindow, state);
        this.setupEventListeners(pipWindow);

        pipWindow.addEventListener('pagehide', () => {
          activePiPWindow = null;
          if (currentActions?.onClose) currentActions.onClose();
        });

        return { success: true, type: 'pip' };
      } catch (err: unknown) {
        console.warn('Document Picture-in-Picture request rejected or failed:', err);
      }
    }

    // 2. Fallback: Detached Popup Window with always-on-top hint
    try {
      const left = Math.max(10, window.screen.availWidth - 380);
      const top = Math.max(10, window.screen.availHeight - 430);
      const popup = window.open(
        '',
        'TypingSystemPiP',
        `width=360,height=390,left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
      );

      if (popup) {
        activePiPWindow = popup;
        this.setupWindowDOM(popup, state);
        this.setupEventListeners(popup);

        popup.addEventListener('beforeunload', () => {
          activePiPWindow = null;
          if (currentActions?.onClose) currentActions.onClose();
        });

        return { success: true, type: 'popup' };
      }
    } catch (popupErr) {
      console.warn('Popup fallback also failed:', popupErr);
    }

    return { success: false, type: 'error', error: 'not_supported' };
  },

  close(): void {
    if (activePiPWindow && !activePiPWindow.closed) {
      activePiPWindow.close();
    }
    activePiPWindow = null;
  },

  setupWindowDOM(targetWindow: Window, state: PiPState): void {
    const doc = targetWindow.document;
    doc.title = `⏱️ ${state.bookName || 'קלדנות'}`;
    doc.dir = 'rtl';

    // Copy styles from main document
    const styleEl = doc.createElement('style');
    styleEl.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
      body {
        font-family: 'Assistant', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #0b0f19;
        color: #f8fafc;
        padding: 12px;
        height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        direction: rtl;
      }
      .badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .btn {
        cursor: pointer;
        font-weight: 700;
        border-radius: 10px;
        border: none;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn:active { transform: scale(0.96); }
      .clock-box {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 14px;
        padding: 10px;
        text-align: center;
        margin: 8px 0;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
      }
      .clock-main {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 32px;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #ffffff;
      }
      .clock-hundredths {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 20px;
        font-weight: 800;
        color: #10b981;
      }
      .input-chars {
        width: 100%;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        color: #ffffff;
        font-weight: 700;
        padding: 6px 8px;
        font-size: 13px;
        outline: none;
        text-align: center;
        direction: ltr;
        margin-top: 4px;
      }
      .input-chars:focus { border-color: #6366f1; }
      .chip-btn {
        background: #1e293b;
        color: #cbd5e1;
        border: 1px solid #334155;
        padding: 3px 6px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 6px;
        cursor: pointer;
      }
      .chip-btn:hover { background: #334155; color: #fff; }
    `;
    doc.head.appendChild(styleEl);

    const timeObj = formatStopwatchWithHundredths(state.displaySeconds);

    doc.body.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
        <div style="font-size:12px; font-weight:800; color:#818cf8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:210px;">
          ${state.bookName || 'ספר עבודה'}
        </div>
        ${state.clientName ? `<span class="badge" style="background:#1e1b4b; color:#c7d2fe; border:1px solid #3730a3;">${state.clientName}</span>` : ''}
      </div>

      <!-- Clock Display with Hundredths -->
      <div class="clock-box">
        <div style="font-size:10px; color:#94a3b8; font-weight:700; margin-bottom:2px; text-transform:uppercase;">
          זמן עבודה מצטבר
        </div>
        <div>
          <span id="pip-time-main" class="clock-main">${timeObj.mainTime}</span><span id="pip-time-hundredths" class="clock-hundredths">.${timeObj.hundredths}</span>
        </div>
      </div>

      <!-- Play/Pause Button -->
      <button id="pip-btn-toggle" class="btn" style="width:100%; padding:10px; font-size:14px; background:${state.isRunning ? '#f59e0b' : '#4f46e5'}; color:#fff; margin-bottom:8px;">
        ${state.isRunning ? '⏸ השהה עבודה' : '▶ התחל עבודה'}
      </button>

      <!-- Characters Updater Section -->
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:8px 10px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-size:11px; color:#94a3b8; font-weight:700;">תווים שנעבדו:</span>
          <span id="pip-char-display" style="font-size:14px; font-weight:800; color:#10b981; font-family:monospace;">${state.charCount.toLocaleString()}</span>
        </div>

        <div style="display:flex; gap:4px; margin-top:6px; justify-content:space-between;">
          <button id="pip-add-100" class="chip-btn" type="button">+100</button>
          <button id="pip-add-500" class="chip-btn" type="button">+500</button>
          <button id="pip-add-1000" class="chip-btn" type="button">+1,000</button>
          <button id="pip-btn-paste" class="chip-btn" style="background:#312e81; color:#c7d2fe; border-color:#4338ca;" type="button">📋 הדבק</button>
        </div>

        <div style="display:flex; gap:4px; margin-top:6px;">
          <input id="pip-char-input" class="input-chars" type="number" placeholder="עדכן סך תווים..." value="${state.charCount}" />
          <button id="pip-char-set-btn" class="btn" style="background:#10b981; color:#fff; font-size:11px; padding:6px 10px; margin-top:4px;">עדכן</button>
        </div>
      </div>

      <!-- Pomodoro Status (if active) -->
      <div id="pip-pomodoro-container" style="display:${state.pomodoroActive ? 'flex' : 'none'}; align-items:center; justify-content:space-between; background:#18181b; border:1px solid #27272a; border-radius:10px; padding:6px 10px; font-size:11px; margin-top:auto;">
        <div style="display:flex; align-items:center; gap:4px;">
          <span id="pip-pomo-icon">${state.pomodoroPhase === 'work' ? '🍅' : '☕'}</span>
          <span id="pip-pomo-label" style="font-weight:700; color:${state.pomodoroPhase === 'work' ? '#fca5a5' : '#86efac'};">
            ${state.pomodoroPhase === 'work' ? 'מיקוד' : 'הפסקה'}
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span id="pip-pomo-countdown" style="font-family:monospace; font-weight:800; color:#fff;">
            ${formatCountdown(state.pomodoroSecondsLeft || 0)}
          </span>
          <button id="pip-pomo-skip" class="chip-btn" style="font-size:10px; padding:1px 5px;" type="button">דלג</button>
        </div>
      </div>
    `;
  },

  setupEventListeners(targetWindow: Window): void {
    const doc = targetWindow.document;

    // Toggle timer
    doc.getElementById('pip-btn-toggle')?.addEventListener('click', () => {
      if (currentActions) currentActions.onToggleTimer();
    });

    // Add buttons
    doc.getElementById('pip-add-100')?.addEventListener('click', () => {
      if (currentActions) currentActions.onAddChars(100);
    });
    doc.getElementById('pip-add-500')?.addEventListener('click', () => {
      if (currentActions) currentActions.onAddChars(500);
    });
    doc.getElementById('pip-add-1000')?.addEventListener('click', () => {
      if (currentActions) currentActions.onAddChars(1000);
    });

    // Set characters from input
    const inputEl = doc.getElementById('pip-char-input') as HTMLInputElement | null;
    const setBtn = doc.getElementById('pip-char-set-btn');

    const handleApplyChars = () => {
      if (inputEl && currentActions) {
        const val = Math.max(0, parseInt(inputEl.value, 10) || 0);
        currentActions.onUpdateChars(val);
      }
    };

    setBtn?.addEventListener('click', handleApplyChars);
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleApplyChars();
    });

    // Paste from clipboard
    doc.getElementById('pip-btn-paste')?.addEventListener('click', async () => {
      try {
        if (targetWindow.navigator.clipboard) {
          const text = await targetWindow.navigator.clipboard.readText();
          const clean = text.replace(/\r/g, '').replace(/\n/g, '').replace(/\s/g, ' ');
          if (clean.length > 0 && currentActions) {
            currentActions.onUpdateChars(clean.length);
          }
        }
      } catch {
        const manual = targetWindow.prompt('הדבק כאן את הטקסט לספירת תווים:');
        if (manual && currentActions) {
          const clean = manual.replace(/\r/g, '').replace(/\n/g, '').replace(/\s/g, ' ');
          currentActions.onUpdateChars(clean.length);
        }
      }
    });

    // Skip Pomodoro
    doc.getElementById('pip-pomo-skip')?.addEventListener('click', () => {
      if (currentActions?.onSkipPomodoro) currentActions.onSkipPomodoro();
    });
  },

  /**
   * Called on every live tick to update the PiP window DOM with sub-frame precision
   */
  update(state: PiPState): void {
    if (!activePiPWindow || activePiPWindow.closed) return;
    const doc = activePiPWindow.document;

    // 1. Time with Hundredths
    const timeObj = formatStopwatchWithHundredths(state.displaySeconds);
    const mainTimeEl = doc.getElementById('pip-time-main');
    const hundredthsEl = doc.getElementById('pip-time-hundredths');
    if (mainTimeEl) mainTimeEl.textContent = timeObj.mainTime;
    if (hundredthsEl) hundredthsEl.textContent = `.${timeObj.hundredths}`;

    // 2. Button State
    const btnToggle = doc.getElementById('pip-btn-toggle');
    if (btnToggle) {
      btnToggle.textContent = state.isRunning ? '⏸ השהה עבודה' : '▶ התחל עבודה';
      btnToggle.style.backgroundColor = state.isRunning ? '#f59e0b' : '#4f46e5';
    }

    // 3. Characters Display & Input (if not currently focused)
    const charDisplayEl = doc.getElementById('pip-char-display');
    if (charDisplayEl) charDisplayEl.textContent = state.charCount.toLocaleString();

    const charInput = doc.getElementById('pip-char-input') as HTMLInputElement | null;
    if (charInput && doc.activeElement !== charInput) {
      charInput.value = state.charCount.toString();
    }

    // 4. Pomodoro
    const pomoContainer = doc.getElementById('pip-pomodoro-container');
    if (pomoContainer) {
      pomoContainer.style.display = state.pomodoroActive ? 'flex' : 'none';
      if (state.pomodoroActive) {
        const iconEl = doc.getElementById('pip-pomo-icon');
        const labelEl = doc.getElementById('pip-pomo-label');
        const countdownEl = doc.getElementById('pip-pomo-countdown');
        if (iconEl) iconEl.textContent = state.pomodoroPhase === 'work' ? '🍅' : '☕';
        if (labelEl) {
          labelEl.textContent = state.pomodoroPhase === 'work' ? 'מיקוד' : 'הפסקה';
          labelEl.style.color = state.pomodoroPhase === 'work' ? '#fca5a5' : '#86efac';
        }
        if (countdownEl) {
          countdownEl.textContent = formatCountdown(state.pomodoroSecondsLeft || 0);
        }
      }
    }
  }
};
