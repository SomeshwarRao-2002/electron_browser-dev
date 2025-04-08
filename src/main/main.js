const { app, BrowserWindow, ipcMain, desktopCapturer, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { setupIPC } = require('./ipcHandlers');
const { saveDeviceInfo, getDeviceInfo } = require('./utils/store');
const FFmpegStatic = require('ffmpeg-static-electron-forge').default;
const { openTestWindow } = require('./windows/testWindow');

const store = new Store();
let mainWindow;
let storedImageUrl = ""; // Declare the variable globally

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true,
            webviewTag: true,
            webSecurity: true, // Recommended
            contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://expressjs-api-resume-random.onrender.com; style-src 'self' 'unsafe-inline';",
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    setupIPC(mainWindow);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function monitorWindowNavigation(window) {
    const webContents = window.webContents;

    webContents.on('did-navigate', (event, url) => {
        console.log('Navigated to:', url);
    });

    webContents.on('did-navigate-in-page', (event, url) => {
        console.log('In-page navigation to:', url);
    });
}

app.whenReady().then(() => {
    saveDeviceInfo();
    createMainWindow();

    app.on('browser-window-created', (event, newWindow) => {
        monitorWindowNavigation(newWindow);
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

ipcMain.handle('getSources', async () => {
    return await desktopCapturer.getSources({ types: ['window', 'screen'] });
});

ipcMain.handle('showSaveDialog', async () => {
    return await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`,
    });
});

ipcMain.handle('get-operating-system', () => {
    return process.platform;
});

ipcMain.handle('get-ffmpeg-path', () => {
    return FFmpegStatic.paths.ffmpegPath;
});

ipcMain.handle('get-device-id', () => {
    return getDeviceInfo();
});

ipcMain.on('open-test-window', (event, { imageUrl }) => {
    openTestWindow(event.sender);
});

ipcMain.on('load-tinkercad', (event, imageUrl) => {
    storedImageUrl = imageUrl;
    mainWindow.webContents.send('update-webview', 'https://www.tinkercad.com/joinclass/HTGPACXK4');
});

ipcMain.on('request-image', (event) => {
    event.sender.send('display-image', storedImageUrl);
});

ipcMain.handle('show-input-dialog', async (event, options) => {
    const result = await dialog.showInputDialog(options);
    return result;
});

if (require('electron-squirrel-startup')) {
    app.quit();
}