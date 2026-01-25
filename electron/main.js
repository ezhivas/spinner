const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const getPort = require('get-port');

let mainWindow;
let nestBackend;
let backendPort;

// Path to backend build
const BACKEND_PATH = path.join(__dirname, '..', 'dist', 'main.js');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: 'SpinneR API Client',
        backgroundColor: '#1a1b1e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Create menu
    createMenu();

    // Start backend then load UI
    startBackend().then(() => {
        mainWindow.loadURL(`http://localhost:${backendPort}`);
    }).catch((err) => {
        console.error('Failed to start backend:', err);
        app.quit();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

async function startBackend() {
    // Find available port (try 3000-3010)
    try {
        backendPort = await getPort({
            port: getPort.makeRange(3000, 3010)
        });
    } catch (err) {
        console.error('Failed to find available port:', err);
        backendPort = 3000; // Fallback
    }

    console.log(`🚀 Starting backend on port ${backendPort}...`);

    return new Promise((resolve, reject) => {
        // Start NestJS backend as separate process
        nestBackend = spawn('node', [BACKEND_PATH], {
            env: {
                ...process.env,
                NODE_ENV: 'production',
                DB_TYPE: 'sqlite',
                DB_PATH: path.join(app.getPath('userData'), 'spinner.db'),
                REDIS_ENABLED: 'false',
                PORT: backendPort.toString(),
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let startupTimeout;

        nestBackend.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`Backend: ${output}`);

            // Wait for ready message
            if (output.includes('Nest application successfully started') ||
                output.includes('successfully started')) {
                clearTimeout(startupTimeout);
                console.log(`✅ Backend ready on port ${backendPort}`);
                resolve();
            }
        });

        nestBackend.stderr.on('data', (data) => {
            console.error(`Backend Error: ${data}`);
        });

        nestBackend.on('close', (code) => {
            console.log(`Backend process exited with code ${code}`);
            if (code !== 0 && code !== null) {
                reject(new Error(`Backend exited with code ${code}`));
            }
        });

        nestBackend.on('error', (err) => {
            console.error(`Failed to start backend:`, err);
            reject(err);
        });

        // Timeout with fallback
        startupTimeout = setTimeout(() => {
            console.warn('Backend startup timeout, attempting to load UI anyway...');
            resolve();
        }, 10000); // 10 seconds
    });
}

function createMenu() {
    const template = [
        {
            label: 'SpinneR',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                {
                    label: 'Preferences',
                    accelerator: 'Cmd+,',
                    click: () => {
                        // TODO: Open preferences
                    }
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://github.com/yourusername/spinner');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Show Logs',
                    click: () => {
                        const { shell } = require('electron');
                        shell.openPath(app.getPath('logs'));
                    }
                },
                {
                    label: 'Show Database',
                    click: () => {
                        const { shell } = require('electron');
                        shell.showItemInFolder(path.join(app.getPath('userData'), 'spinner.db'));
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    // Stop backend
    if (nestBackend) {
        console.log('Stopping backend...');
        nestBackend.kill('SIGTERM');

        // Force kill after 2 seconds if not stopped
        setTimeout(() => {
            if (nestBackend && !nestBackend.killed) {
                console.log('Force killing backend...');
                nestBackend.kill('SIGKILL');
            }
        }, 2000);
    }
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC handlers for communication between main and renderer
ipcMain.handle('get-app-path', () => {
    return app.getPath('userData');
});

ipcMain.handle('get-backend-port', () => {
    return backendPort;
});

ipcMain.handle('export-backup', async (event, data) => {
    const { dialog } = require('electron');
    const fs = require('fs').promises;

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: `spinner-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
            { name: 'JSON Files', extensions: ['json'] }
        ]
    });

    if (filePath) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return { success: true, path: filePath };
    }

    return { success: false };
});

ipcMain.handle('import-backup', async () => {
    const { dialog } = require('electron');
    const fs = require('fs').promises;

    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        filters: [
            { name: 'JSON Files', extensions: ['json'] }
        ],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        const content = await fs.readFile(filePaths[0], 'utf-8');
        return { success: true, data: JSON.parse(content) };
    }

    return { success: false };
});
