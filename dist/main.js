"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const vdf_parser_1 = __importDefault(require("vdf-parser"));
const electron_store_1 = __importDefault(require("electron-store"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
const electron_updater_1 = require("electron-updater");
let mainWindow = null;
const store = new electron_store_1.default();
// Log updater events
electron_updater_1.autoUpdater.on('update-available', () => {
    if (mainWindow) {
        mainWindow.webContents.send('show-notification', { type: 'info', message: 'アップデートが見つかりました。ダウンロードを開始します。' });
    }
});
electron_updater_1.autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
        mainWindow.webContents.send('show-notification', { type: 'success', message: 'アップデートの準備ができました。アプリを再起動すると適用されます。' });
        // Optionally, prompt user to restart
        electron_1.dialog.showMessageBox({
            type: 'info',
            title: 'アップデートの準備ができました',
            message: '新しいバージョンがダウンロードされました。アプリケーションを再起動してアップデートを適用しますか？',
            buttons: ['再起動', '後で']
        }).then(buttonIndex => {
            if (buttonIndex.response === 0) {
                electron_updater_1.autoUpdater.quitAndInstall();
            }
        });
    }
});
electron_updater_1.autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    if (mainWindow) {
        mainWindow.webContents.send('show-notification', { type: 'error', message: `アップデートエラー: ${err.message}` });
    }
});
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function getSteamPath() {
    try {
        const { execSync } = require('child_process');
        const command = 'reg query "HKEY_CURRENT_USER\\Software\\Valve\\Steam" /v SteamPath';
        const output = execSync(command, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        const match = output.match(/SteamPath\s+REG_SZ\s+(.*)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    catch (error) {
        console.error('Failed to get Steam path from registry:', error);
    }
    return null;
}
async function getSteamLibraryFolders(steamPath) {
    const libraryFoldersPath = path_1.default.join(steamPath, 'config', 'libraryfolders.vdf');
    const libraryFolders = [steamPath];
    try {
        const data = fs_1.default.readFileSync(libraryFoldersPath, 'utf-8');
        const parsedVdf = vdf_parser_1.default.parse(data);
        const libFolders = parsedVdf.libraryfolders;
        if (libFolders) {
            for (const key in libFolders) {
                if (libFolders[key].path) {
                    libraryFolders.push(libFolders[key].path);
                }
            }
        }
    }
    catch (error) {
        console.warn(`Could not read or parse libraryfolders.vdf at ${libraryFoldersPath}:`, error);
    }
    return libraryFolders;
}
async function getSteamGames(libraryFolders) {
    const games = [];
    const seenAppIds = new Set();
    const apiKey = store.get('apiKey', '');
    const gameCache = store.get('gameCache', {});
    let cacheNeedsUpdate = false;
    let apiErrorOccurred = false;
    for (const folder of libraryFolders) {
        const steamAppsPath = path_1.default.join(folder, 'steamapps');
        if (!fs_1.default.existsSync(steamAppsPath))
            continue;
        const files = fs_1.default.readdirSync(steamAppsPath);
        for (const file of files) {
            if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
                const acfPath = path_1.default.join(steamAppsPath, file);
                try {
                    const data = fs_1.default.readFileSync(acfPath, 'utf-8');
                    const parsedAcf = vdf_parser_1.default.parse(data);
                    const appState = parsedAcf.AppState;
                    const appId = String(appState?.appid);
                    const IGNORED_APP_IDS = ['228980']; // Steamworks Common Redistributables
                    if (IGNORED_APP_IDS.includes(appId)) {
                        console.log(`Skipping ignored app: ${appState.name} (${appId})`);
                        continue;
                    }
                    if (appId && appState.name && !seenAppIds.has(appId)) {
                        if (gameCache[appId]) {
                            games.push(gameCache[appId]);
                        }
                        else {
                            const gameData = {
                                id: appId,
                                type: 'steam',
                                title: appState.name,
                                coverArt: '',
                                backgroundVideo: null,
                            };
                            if (apiKey) {
                                try {
                                    const response = await axios_1.default.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
                                    const appDetails = response.data[appId];
                                    if (appDetails?.success) {
                                        gameData.coverArt = appDetails.data.header_image || '';
                                        if (appDetails.data.movies?.length > 0) {
                                            const webmMovie = appDetails.data.movies.find((m) => m.webm && m.webm['480']);
                                            gameData.backgroundVideo = webmMovie ? webmMovie.webm['480'] : null;
                                        }
                                    }
                                    await delay(200);
                                }
                                catch (apiError) {
                                    console.error(`Failed to fetch API details for appid ${appId}:`, apiError);
                                    apiErrorOccurred = true;
                                }
                            }
                            games.push(gameData);
                            gameCache[appId] = gameData;
                            cacheNeedsUpdate = true;
                        }
                        seenAppIds.add(appId);
                    }
                }
                catch (error) {
                    console.warn(`Could not read or parse appmanifest file ${acfPath}:`, error);
                }
            }
        }
    }
    if (cacheNeedsUpdate) {
        store.set('gameCache', gameCache);
        console.log('Game cache updated.');
    }
    if (apiErrorOccurred && mainWindow) {
        mainWindow.webContents.send('show-notification', {
            type: 'error',
            message: 'Steam APIエラー: 一部のゲーム情報の取得に失敗しました。',
        });
    }
    return games;
}
async function getAllGames() {
    const steamPath = getSteamPath();
    let steamGames = [];
    if (steamPath) {
        const libraryFolders = await getSteamLibraryFolders(steamPath);
        steamGames = await getSteamGames(libraryFolders);
    }
    else {
        console.warn("Steam path not found, skipping Steam game detection.");
    }
    const manualGames = store.get('manualGames', []).map(game => ({
        ...game,
        isPathValid: fs_1.default.existsSync(game.executablePath),
    }));
    const allGames = [...steamGames, ...manualGames];
    const uniqueGames = new Map();
    for (const game of allGames) {
        if (!uniqueGames.has(game.title)) {
            uniqueGames.set(game.title, game);
        }
    }
    return Array.from(uniqueGames.values());
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../renderer/dist/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    electron_1.protocol.handle('local-file', (request) => {
        const filePath = request.url.slice('local-file://'.length);
        const absolutePath = path_1.default.join(electron_1.app.getPath('userData'), filePath);
        return electron_1.net.fetch('file://' + absolutePath);
    });
    createWindow();
    // Check for updates after window is created
    if (process.env.NODE_ENV !== 'development') {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
    electron_1.ipcMain.handle('get-all-games', () => getAllGames());
    electron_1.ipcMain.handle('get-api-key', () => store.get('apiKey', ''));
    electron_1.ipcMain.handle('set-api-key', (_, apiKey) => store.set('apiKey', apiKey));
    electron_1.ipcMain.handle('get-default-view-mode', () => store.get('defaultViewMode', 'grid'));
    electron_1.ipcMain.handle('set-default-view-mode', (_, viewMode) => store.set('defaultViewMode', viewMode));
    electron_1.ipcMain.handle('is-first-launch', () => !store.get('hasLaunchedBefore', false));
    electron_1.ipcMain.handle('set-has-launched', () => store.set('hasLaunchedBefore', true));
    electron_1.ipcMain.handle('get-theme', () => {
        return store.get('appTheme', 'default');
    });
    electron_1.ipcMain.handle('set-theme', (_, theme) => {
        store.set('appTheme', theme);
    });
    electron_1.ipcMain.handle('open-file-dialog', async (_, options) => {
        const { filePaths } = await electron_1.dialog.showOpenDialog(options);
        return filePaths?.[0];
    });
    electron_1.ipcMain.handle('save-manual-game', async (_, game) => {
        const coversDir = path_1.default.join(electron_1.app.getPath('userData'), 'covers');
        if (!fs_1.default.existsSync(coversDir))
            fs_1.default.mkdirSync(coversDir, { recursive: true });
        const newId = (0, crypto_1.randomUUID)();
        let coverArtUrl = '';
        if (game.coverArt) {
            const extension = path_1.default.extname(game.coverArt);
            const newFileName = `${newId}${extension}`;
            const newFilePath = path_1.default.join(coversDir, newFileName);
            fs_1.default.copyFileSync(game.coverArt, newFilePath);
            coverArtUrl = `local-file://covers/${newFileName}`;
        }
        const newGame = {
            id: newId,
            type: 'manual',
            title: game.title,
            executablePath: game.executablePath,
            coverArt: coverArtUrl,
            backgroundVideo: null,
        };
        const manualGames = store.get('manualGames', []);
        manualGames.push(newGame);
        store.set('manualGames', manualGames);
        return newGame;
    });
    electron_1.ipcMain.handle('delete-manual-game', async (_, gameId) => {
        const manualGames = store.get('manualGames', []);
        const gameToDelete = manualGames.find(g => g.id === gameId);
        if (gameToDelete?.coverArt) {
            try {
                const coverPath = gameToDelete.coverArt.slice('local-file://'.length);
                const absolutePath = path_1.default.join(electron_1.app.getPath('userData'), coverPath);
                if (fs_1.default.existsSync(absolutePath))
                    fs_1.default.unlinkSync(absolutePath);
            }
            catch (error) {
                console.error(`Failed to delete cover art for game ${gameId}:`, error);
            }
        }
        const updatedGames = manualGames.filter(g => g.id !== gameId);
        store.set('manualGames', updatedGames);
    });
    electron_1.ipcMain.handle('update-manual-game', async (_, updatedGame) => {
        const manualGames = store.get('manualGames', []);
        const gameIndex = manualGames.findIndex(g => g.id === updatedGame.id);
        if (gameIndex === -1)
            return;
        const oldGame = manualGames[gameIndex];
        if (updatedGame.coverArt && !updatedGame.coverArt.startsWith('local-file://')) {
            const coversDir = path_1.default.join(electron_1.app.getPath('userData'), 'covers');
            if (oldGame.coverArt) {
                try {
                    const oldCoverPath = oldGame.coverArt.slice('local-file://'.length);
                    const absoluteOldPath = path_1.default.join(electron_1.app.getPath('userData'), oldCoverPath);
                    if (fs_1.default.existsSync(absoluteOldPath))
                        fs_1.default.unlinkSync(absoluteOldPath);
                }
                catch (error) {
                    console.error(`Failed to delete old cover art for game ${oldGame.id}:`, error);
                }
            }
            const extension = path_1.default.extname(updatedGame.coverArt);
            const newFileName = `${oldGame.id}${extension}`;
            const newFilePath = path_1.default.join(coversDir, newFileName);
            fs_1.default.copyFileSync(updatedGame.coverArt, newFilePath);
            updatedGame.coverArt = `local-file://covers/${newFileName}`;
        }
        manualGames[gameIndex] = { ...oldGame, ...updatedGame };
        store.set('manualGames', manualGames);
        return manualGames[gameIndex];
    });
    electron_1.ipcMain.handle('launch-game', async (_, game) => {
        if (game.type === 'steam') {
            await electron_1.shell.openExternal(`steam://run/${game.id}`);
        }
        else if (game.type === 'manual') {
            const gameDir = path_1.default.dirname(game.executablePath);
            (0, child_process_1.exec)(`"${game.executablePath}"`, { cwd: gameDir }, (error) => {
                if (error)
                    console.error(`Failed to launch manual game ${game.title}:`, error);
            });
        }
    });
    electron_1.ipcMain.handle('refresh-library', () => {
        store.set('gameCache', {});
        console.log('Game cache cleared.');
    });
    electron_1.ipcMain.handle('show-game-context-menu', (event, game) => {
        const template = [
            { label: '編集', click: () => { mainWindow?.webContents.send('edit-game', game); } },
            { label: '削除', click: () => { mainWindow?.webContents.send('delete-game', game); } }
        ];
        if (game.type === 'manual' && mainWindow) {
            const menu = electron_1.Menu.buildFromTemplate(template);
            menu.popup({ window: mainWindow });
        }
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
