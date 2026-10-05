/**
 * Synthesizes procedural feedback beeps using Web Audio API
 * Fully offline, no external audio assets required
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playTone(freq: number, duration: number, type: OscillatorType = 'sine'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // audio not allowed before user interaction
  }
}

export function playStartSound(): void {
  playTone(523.25, 0.15); // C5
  setTimeout(() => playTone(659.25, 0.25), 150); // E5
}

export function playStopSound(): void {
  playTone(659.25, 0.15); // E5
  setTimeout(() => playTone(523.25, 0.25), 150); // C5
}

export function playSuccessSound(): void {
  playTone(880, 0.18); // A5
}

export function playPomodoroBreakSound(): void {
  // Pleasant three-tone chime for break time
  playTone(523.25, 0.2); // C5
  setTimeout(() => playTone(659.25, 0.2), 200); // E5
  setTimeout(() => playTone(783.99, 0.35), 400); // G5
}

export function playPomodoroWorkSound(): void {
  // Energetic chime for back to work
  playTone(783.99, 0.15); // G5
  setTimeout(() => playTone(880, 0.15), 160); // A5
  setTimeout(() => playTone(1046.5, 0.3), 320); // C6
}

