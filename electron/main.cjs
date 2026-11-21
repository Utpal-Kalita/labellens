// LabelLens Electron main process.
// Owns: window, camera permission gate, local SQLite (sql.js), IPC.
// The SmartSpectra SDK runs renderer-side (browser MediaStream) via the
// official @smartspectra/node-sdk preload bridge.
const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('node:path');
const { DB, registerIpc } = require('./db.cjs');

const isDev = !!process.env.VITE_DEV_SERVER;
let db;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#F8FAFC',
    title: 'LabelLens',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: false, // required: preload requires @smartspectra/node-sdk/preload (sandboxed preloads cannot load node modules); contextIsolation stays on and no remote content is loaded
      nodeIntegration: false,
    },
  });

  // Required per-window main-side wiring for the SmartSpectra renderer bridge:
  // receives the MessagePort the preload posts and owns the native SDK instance.
  require('@smartspectra/node-sdk/main').bindSmartSpectraIpc(win);

  // Camera permission: grant only to our own app pages, deny everything else.
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => {
    const url = (details && details.requestingUrl) || (wc && wc.getURL()) || '';
    const own = url.startsWith('file://') || url.startsWith('http://localhost:5173');
    callback(permission === 'media' && own);
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission, origin) => {
    const own = origin.startsWith('file://') || origin.startsWith('http://localhost:5173');
    return permission === 'media' && own;
  });

  registerIpc(ipcMain, db, app);

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  db = await new DB(path.join(app.getPath('userData'), 'labellens.db')).init();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
