/**
 * File System Access API utility
 * Enables direct read/write access to actual files on the user's computer disk
 */

export interface ConnectedFileState {
  handle: FileSystemFileHandle | null;
  fileName: string | null;
  lastSavedAt: string | null;
}

let activeFileHandle: FileSystemFileHandle | null = null;
let activeFileName: string | null = null;

export const FileSystemSync = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  },

  getActiveFileName(): string | null {
    return activeFileName;
  },

  hasActiveFile(): boolean {
    return activeFileHandle !== null;
  },

  /**
   * Prompts user to select or create a file on their computer disk
   */
  async linkOrCreateFile(defaultName = 'גיבוי_מערכת_קלדנות.json'): Promise<{ success: boolean; fileName?: string; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'unsupported' };
    }

    try {
      const handle = await (window as unknown as {
        showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'קובץ נתוני קלדנות JSON',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });

      activeFileHandle = handle;
      activeFileName = handle.name;
      return { success: true, fileName: handle.name };
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return { success: false, error: 'aborted' };
      }
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Prompts user to open an existing JSON file from disk to link
   */
  async openAndLinkFile(): Promise<{ success: boolean; data?: string; fileName?: string; error?: string }> {
    if (typeof window === 'undefined' || !('showOpenFilePicker' in window)) {
      return { success: false, error: 'unsupported' };
    }

    try {
      const [handle] = await (window as unknown as {
        showOpenFilePicker: (options: unknown) => Promise<FileSystemFileHandle[]>;
      }).showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'קובץ JSON',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });

      if (!handle) return { success: false, error: 'aborted' };

      const file = await handle.getFile();
      const content = await file.text();
      activeFileHandle = handle;
      activeFileName = handle.name;

      return { success: true, data: content, fileName: handle.name };
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return { success: false, error: 'aborted' };
      }
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Writes data directly to the linked file on disk
   */
  async writeToLinkedFile(jsonContent: string): Promise<{ success: boolean; error?: string }> {
    if (!activeFileHandle) {
      return { success: false, error: 'no_linked_file' };
    }

    try {
      const writable = await activeFileHandle.createWritable();
      await writable.write(jsonContent);
      await writable.close();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Disconnects current file link
   */
  disconnect(): void {
    activeFileHandle = null;
    activeFileName = null;
  },

  /**
   * Fallback: direct download to computer Downloads folder
   */
  downloadFallback(jsonContent: string, fileName = 'גיבוי_מערכת_קלדנות.json'): void {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};
