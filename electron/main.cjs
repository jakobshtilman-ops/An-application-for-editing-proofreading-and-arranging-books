const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 320,
    minHeight: 200,
    title: 'מערכת קלדנות וניהול פרודוקטיביות לעורכי ספרים',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    backgroundColor: '#f8fafc',
  });

  Menu.setApplicationMenu(null);

  // Handle external links safely in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load production build
  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('Failed to load application:', err);
  });
}

// IPC Handlers for Always-on-Top and Mini-Window
ipcMain.handle('toggle-always-on-top', (_event, enable) => {
  if (mainWindow) {
    // 'screen-saver' level ensures window floats above all normal app windows on Windows/macOS
    mainWindow.setAlwaysOnTop(enable, enable ? 'screen-saver' : 'normal');
  }
  return enable;
});

ipcMain.handle('get-always-on-top', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});

ipcMain.handle('set-mini-pip-mode', (_event, mini) => {
  if (mainWindow) {
    if (mini) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
      mainWindow.setMinimumSize(320, 240);
      mainWindow.setSize(380, 360);
    } else {
      mainWindow.setAlwaysOnTop(false, 'normal');
      mainWindow.setMinimumSize(320, 200);
      mainWindow.setSize(1280, 850);
      mainWindow.center();
    }
  }
  return mini;
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
