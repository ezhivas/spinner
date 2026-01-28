const { app, BrowserWindow, ipcMain, Menu, protocol } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const getPort = require('get-port');
const fs = require('fs');

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    // Ignore EPIPE errors (broken pipe when writing to stdout/stderr)
    if (error.code === 'EPIPE') {
        return;
    }
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Ignore stdout/stderr errors
if (process.stdout) {
    process.stdout.on('error', (err) => {
        if (err.code === 'EPIPE') return;
    });
}

if (process.stderr) {
    process.stderr.on('error', (err) => {
        if (err.code === 'EPIPE') return;
    });
}

let mainWindow;
let nestBackend;
let backendPort;

// Path to backend build
const BACKEND_PATH = path.join(__dirname, '..', 'dist', 'main.js');

/**
 * Исправленная функция поиска Node.js
 * Убрали process.execPath из списка, чтобы избежать рекурсии
 */
function findNodePath() {
    // 1. Попытка найти через which (для Mac/Linux)
    if (process.platform === 'darwin' || process.platform === 'linux') {
        try {
            // Расширенный PATH для поиска
            const extraPaths = [
                '/opt/homebrew/bin',
                '/usr/local/bin',
                '/usr/bin',
                '/bin',
                process.env.PATH
            ].join(':');

            const result = execSync('which node', {
                env: { ...process.env, PATH: extraPaths },
                encoding: 'utf8'
            }).trim();

            if (result && fs.existsSync(result)) {
                return result;
            }
        } catch (e) {
            // Игнорируем ошибки which
        }
    }

    // 2. Проверка стандартных путей
    const possiblePaths = [
        '/opt/homebrew/bin/node',     // Apple Silicon
        '/usr/local/bin/node',        // Intel Mac
        '/usr/bin/node',              // System
        '/bin/node'
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    return null; // Если не нашли системный node
}

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
        // Load React app from backend server (it serves static from public/)
        mainWindow.loadURL(`http://localhost:${backendPort}/index.html`);
        
        // Open DevTools to see console errors
        mainWindow.webContents.openDevTools();
        
        // Log when page finishes loading
        mainWindow.webContents.on('did-finish-load', () => {
            console.log('✅ Page loaded successfully');
        });
        
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('❌ Page failed to load:', errorCode, errorDescription);
        });
    }).catch((err) => {
        console.error('Failed to start backend:', err);
        app.quit();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

async function startBackend() {
    const logPath = path.join(app.getPath('userData'), 'backend-startup.log');
    const log = (msg) => {
        const text = `${new Date().toISOString()} ${msg}\n`;
        try {
            fs.appendFileSync(logPath, text);
        } catch (e) {
            // Ignore file write errors
        }
        // Safely write to console (may fail with EPIPE if stdout is closed)
        try {
            console.log(msg);
        } catch (e) {
            // Ignore console errors (EPIPE, etc)
        }
    };

    log('--- App Launching ---');

    // 1. Определяем, какой Node.js использовать
    let executable = findNodePath();
    let useElectronAsNode = false;

    if (!executable) {
        log('⚠️ System Node.js not found. Falling back to Electron internal Node.');
        // Используем сам Electron как Node.js рантайм
        executable = process.execPath;
        useElectronAsNode = true;
    } else {
        log(`✅ Found System Node.js at: ${executable}`);
    }

    // Поиск порта
    try {
        backendPort = await getPort({ port: getPort.makeRange(3000, 3010) });
    } catch (err) {
        log(`Port error: ${err.message}`);
        backendPort = 3000;
    }

    // 2. Настройка переменных окружения
    const env = {
        ...process.env,
        NODE_ENV: 'production',
        DB_TYPE: 'sqlite',
        DB_PATH: path.join(app.getPath('userData'), 'spinner.db'),
        REDIS_ENABLED: 'false',
        PORT: backendPort.toString(),
    };

    // ВАЖНО: Если используем Electron как Node, нужно установить этот флаг
    if (useElectronAsNode) {
        env.ELECTRON_RUN_AS_NODE = '1';
    }

    // Добавляем пути в PATH для ребенка (на всякий случай)
    if (process.platform === 'darwin') {
        env.PATH = `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH}`;
    }

    // Путь к main.js (dist)
    const finalBackendPath = BACKEND_PATH;
    log(`Backend Script: ${finalBackendPath}`);
    log(`DB Path: ${env.DB_PATH}`);
    log(`Port: ${backendPort}`);

    // Проверка существования файла перед запуском
    if (!fs.existsSync(finalBackendPath)) {
        const err = `CRITICAL: Backend file not found at ${finalBackendPath}`;
        log(err);
        const { dialog } = require('electron');
        dialog.showErrorBox('Startup Error', err);
        throw new Error(err);
    }

    return new Promise((resolve, reject) => {
        log('Spawning Node process...');
        log(`Using executable: ${executable}`);
        if (useElectronAsNode) {
            log('Mode: ELECTRON_RUN_AS_NODE');
        }

        try {
            nestBackend = spawn(executable, [finalBackendPath], {
                env: env, // Используем подготовленный env
                stdio: ['ignore', 'pipe', 'pipe'] // ignore для stdin, чтобы не висел
            });
        } catch (spawnError) {
            log(`Spawn Error: ${spawnError.message}`);
            reject(spawnError);
            return;
        }

        let startupTimeout;

        nestBackend.on('error', (err) => {
            log(`Failed to start subprocess: ${err.message}`);
            const { dialog } = require('electron');
            dialog.showErrorBox('Node.js Error',
                `Could not start backend.\nError: ${err.message}\n\nMake sure Node.js is installed.`);
            reject(err);
        });

        nestBackend.stdout.on('data', (data) => {
            const output = data.toString();
            log(`Backend: ${output.trim()}`);

            if (output.includes('Nest application successfully started') ||
                output.includes('successfully started')) {
                clearTimeout(startupTimeout);
                log('✅ Backend started successfully!');
                resolve();
            }
        });

        nestBackend.stderr.on('data', (data) => {
            log(`Backend STDERR: ${data.toString()}`);
        });

        nestBackend.on('close', (code) => {
            log(`Backend process exited with code ${code}`);
            if (code !== 0 && code !== null) {
                // Не реджектим сразу, если окно уже открыто
                log(`⚠️ Backend exited with non-zero code, but not rejecting if UI is already loaded`);
            }
        });

        // Timeout with fallback
        startupTimeout = setTimeout(() => {
            log('⚠️ Backend startup timeout, attempting to load UI anyway...');
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

app.whenReady().then(() => {
    createWindow();
});

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
