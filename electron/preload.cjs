const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (enable) => ipcRenderer.invoke('toggle-always-on-top', enable),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  setMiniPipMode: (mini) => ipcRenderer.invoke('set-mini-pip-mode', mini),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isElectron: true,
});
