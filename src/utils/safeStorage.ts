/**
 * SafeStorage utility wrapper
 * Handles localStorage gracefully even when cookies/storage are restricted in iframes or sandboxes
 */
const memoryStorage: Record<string, string> = {};

export const SafeStorage = {
  isSupported(): boolean {
    try {
      localStorage.setItem('__test_storage__', '1');
      localStorage.removeItem('__test_storage__');
      return true;
    } catch {
      return false;
    }
  },

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage[key] ?? null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      memoryStorage[key] = value;
      return true;
    } catch {
      memoryStorage[key] = value;
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      delete memoryStorage[key];
      return true;
    } catch {
      delete memoryStorage[key];
      return false;
    }
  }
};
