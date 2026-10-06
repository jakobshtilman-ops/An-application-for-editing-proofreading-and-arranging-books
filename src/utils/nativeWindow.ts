/**
 * Native Desktop Window Management for Windows EXE (Tauri / Electron) and Web
 */

export function isNativeDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;
  const isTauri = Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ || (window as unknown as { __TAURI__?: unknown }).__TAURI__);
  const isElectron = Boolean((window as unknown as { electronAPI?: unknown }).electronAPI);
  return isTauri || isElectron;
}

export async function setNativeAlwaysOnTop(enable: boolean): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Try Tauri v2
  try {
    const win = window as unknown as {
      __TAURI_INTERNALS__?: { invoke: (cmd: string, args: Record<string, unknown>) => Promise<unknown> };
      __TAURI__?: { core?: { invoke: (cmd: string, args: Record<string, unknown>) => Promise<unknown> } };
    };

    if (win.__TAURI_INTERNALS__?.invoke) {
      await win.__TAURI_INTERNALS__.invoke('toggle_always_on_top', { enable });
      return true;
    }
    if (win.__TAURI__?.core?.invoke) {
      await win.__TAURI__.core.invoke('toggle_always_on_top', { enable });
      return true;
    }
  } catch (err) {
    console.warn('Tauri set_always_on_top invocation:', err);
  }

  // 2. Try Electron
  try {
    const win = window as unknown as { electronAPI?: { setAlwaysOnTop: (enable: boolean) => Promise<boolean> } };
    if (win.electronAPI?.setAlwaysOnTop) {
      await win.electronAPI.setAlwaysOnTop(enable);
      return true;
    }
  } catch (err) {
    console.warn('Electron set_always_on_top invocation:', err);
  }

  return false;
}

export async function setNativeMiniWindowMode(mini: boolean): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Try Tauri v2
  try {
    const win = window as unknown as {
      __TAURI_INTERNALS__?: { invoke: (cmd: string, args: Record<string, unknown>) => Promise<unknown> };
      __TAURI__?: { core?: { invoke: (cmd: string, args: Record<string, unknown>) => Promise<unknown> } };
    };

    if (win.__TAURI_INTERNALS__?.invoke) {
      await win.__TAURI_INTERNALS__.invoke('set_mini_pip_mode', { mini });
      return true;
    }
    if (win.__TAURI__?.core?.invoke) {
      await win.__TAURI__.core.invoke('set_mini_pip_mode', { mini });
      return true;
    }
  } catch (err) {
    console.warn('Tauri set_mini_pip_mode invocation:', err);
  }

  // 2. Try Electron
  try {
    const win = window as unknown as { electronAPI?: { setMiniPipMode: (mini: boolean) => Promise<boolean> } };
    if (win.electronAPI?.setMiniPipMode) {
      await win.electronAPI.setMiniPipMode(mini);
      return true;
    }
  } catch (err) {
    console.warn('Electron set_mini_pip_mode invocation:', err);
  }

  return false;
}
