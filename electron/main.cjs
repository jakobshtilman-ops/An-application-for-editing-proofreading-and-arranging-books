const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 950,
    minHeight: 650,
    title: 'מערכת קלדנות וניהול פרודוקטיביות לעורכי ספרים',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
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
