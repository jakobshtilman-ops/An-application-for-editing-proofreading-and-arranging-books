/**
 * Desktop integration utility for Electron, Tauri, and Web environments.
 * Handles Always-On-Top, Desktop Mini PiP Window mode, and Window controls.
 */

declare global {
  interface Window {
    electronAPI?: {
      setAlwaysOnTop: (enable: boolean) => Promise<boolean>;
      getAlwaysOnTop?: () => Promise<boolean>;
      setMiniPipMode: (mini: boolean) => Promise<boolean>;
      minimizeWindow?: () => Promise<void>;
      maximizeWindow?: () => Promise<void>;
      closeWindow?: () => Promise<void>;
      isElectron?: boolean;
    };
    __TAURI__?: {
      core: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      };
    };
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isElectronEnv = (): boolean => {
  return typeof window !== 'undefined' && (!!window.electronAPI || !!(window as unknown as { process?: { type?: string } }).process?.type);
};

export const isTauriEnv = (): boolean => {
  return typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__);
};

export const isDesktopApp = (): boolean => {
  return isElectronEnv() || isTauriEnv();
};

export const isDocumentPiPSupported = (): boolean => {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
};

/**
 * Toggles desktop OS window always-on-top level (keeps window above Word, PDF, Browser, etc.)
 */
export const setDesktopAlwaysOnTop = async (enable: boolean): Promise<boolean> => {
  try {
    if (window.electronAPI?.setAlwaysOnTop) {
      await window.electronAPI.setAlwaysOnTop(enable);
      return enable;
    }
    if (window.__TAURI__?.core?.invoke) {
      await window.__TAURI__.core.invoke('toggle_always_on_top', { enable });
      return enable;
    }
  } catch (err) {
    console.warn('Failed to set desktop always on top:', err);
  }
  return false;
};

/**
 * Toggles desktop Mini PiP Window mode (resizes app window to floating widget and pins on top)
 */
export const setDesktopMiniMode = async (mini: boolean): Promise<boolean> => {
  try {
    if (window.electronAPI?.setMiniPipMode) {
      await window.electronAPI.setMiniPipMode(mini);
      return mini;
    }
    if (window.__TAURI__?.core?.invoke) {
      await window.__TAURI__.core.invoke('set_mini_pip_mode', { mini });
      return mini;
    }
  } catch (err) {
    console.warn('Failed to set desktop mini mode:', err);
  }
  return false;
};

/**
 * Minimize desktop application window
 */
export const minimizeDesktopApp = async (): Promise<void> => {
  try {
    if (window.electronAPI?.minimizeWindow) {
      await window.electronAPI.minimizeWindow();
      return;
    }
    if (window.__TAURI__?.core?.invoke) {
      await window.__TAURI__.core.invoke('minimize_window');
    }
  } catch (err) {
    console.warn('Failed to minimize window:', err);
  }
};

/**
 * Close desktop application
 */
export const closeDesktopApp = async (): Promise<void> => {
  try {
    if (window.electronAPI?.closeWindow) {
      await window.electronAPI.closeWindow();
      return;
    }
    if (window.__TAURI__?.core?.invoke) {
      await window.__TAURI__.core.invoke('close_window');
    }
  } catch (err) {
    console.warn('Failed to close app:', err);
  }
};
