import { app, BrowserWindow, ipcMain, dialog, protocol, net, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import vdf from 'vdf-parser';
import Store from 'electron-store';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;
const store = new Store();

// Log updater events
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('show-notification', { type: 'info', message: 'アップデートが見つかりました。ダウンロードを開始します。' });
  }
});
autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('show-notification', { type: 'success', message: 'アップデートの準備ができました。アプリを再起動すると適用されます。' });
    // Optionally, prompt user to restart
    dialog.showMessageBox({
      type: 'info',
      title: 'アップデートの準備ができました',
      message: '新しいバージョンがダウンロードされました。アプリケーションを再起動してアップデートを適用しますか？',
      buttons: ['再起動', '後で']
    }).then(buttonIndex => {
      if (buttonIndex.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});
autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('show-notification', { type: 'error', message: `アップデートエラー: ${err.message}` });
  }
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getSteamPath(): string | null {
  try {
    const { execSync } = require('child_process');
    const command = 'reg query "HKEY_CURRENT_USER\\Software\\Valve\\Steam" /v SteamPath';
    const output = execSync(command, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
    const match = output.match(/SteamPath\s+REG_SZ\s+(.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (error) {
    console.error('Failed to get Steam path from registry:', error);
  }
  return null;
}

async function getSteamLibraryFolders(steamPath: string): Promise<string[]> {
  const libraryFoldersPath = path.join(steamPath, 'config', 'libraryfolders.vdf');
  const libraryFolders: string[] = [steamPath];
  try {
    const data = fs.readFileSync(libraryFoldersPath, 'utf-8');
    const parsedVdf = vdf.parse(data);
    const libFolders = (parsedVdf as any).libraryfolders;
    if (libFolders) {
      for (const key in libFolders) {
        if (libFolders[key].path) {
          libraryFolders.push(libFolders[key].path);
        }
      }
    }
  } catch (error) {
    console.warn(`Could not read or parse libraryfolders.vdf at ${libraryFoldersPath}:`, error);
  }
  return libraryFolders;
}

async function getSteamGames(libraryFolders: string[]): Promise<any[]> {
  const games: any[] = [];
  const seenAppIds = new Set<string>();
  const apiKey = (store as any).get('apiKey', '');
  const gameCache = (store as any).get('gameCache', {});
  let cacheNeedsUpdate = false;
  let apiErrorOccurred = false;

  for (const folder of libraryFolders) {
    const steamAppsPath = path.join(folder, 'steamapps');
    if (!fs.existsSync(steamAppsPath)) continue;

    const files = fs.readdirSync(steamAppsPath);
    for (const file of files) {
      if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
        const acfPath = path.join(steamAppsPath, file);
        try {
          const data = fs.readFileSync(acfPath, 'utf-8');
          const parsedAcf = vdf.parse(data);
          const appState = (parsedAcf as any).AppState;
          const appId = String(appState?.appid);

          const IGNORED_APP_IDS = ['228980']; // Steamworks Common Redistributables
          if (IGNORED_APP_IDS.includes(appId)) {
            console.log(`Skipping ignored app: ${appState.name} (${appId})`);
            continue;
          }

          if (appId && appState.name && !seenAppIds.has(appId)) {
            if (gameCache[appId]) {
              games.push(gameCache[appId]);
            } else {
              const gameData = {
                id: appId,
                type: 'steam' as 'steam',
                title: appState.name,
                coverArt: '',
                backgroundVideo: null,
              };
              if (apiKey) {
                try {
                  const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
                  const appDetails = response.data[appId];
                  if (appDetails?.success) {
                    gameData.coverArt = appDetails.data.header_image || '';
                    if (appDetails.data.movies?.length > 0) {
                      const webmMovie = appDetails.data.movies.find((m: any) => m.webm && m.webm['480']);
                      gameData.backgroundVideo = webmMovie ? webmMovie.webm['480'] : null;
                    }
                  }
                  await delay(200);
                } catch (apiError) {
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
        } catch (error) {
          console.warn(`Could not read or parse appmanifest file ${acfPath}:`, error);
        }
      }
    }
  }

  if (cacheNeedsUpdate) {
    (store as any).set('gameCache', gameCache);
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

async function getAllGames(): Promise<any[]> {
  const steamPath = getSteamPath();
  let steamGames: any[] = [];
  if (steamPath) {
    const libraryFolders = await getSteamLibraryFolders(steamPath);
    steamGames = await getSteamGames(libraryFolders);
  } else {
    console.warn("Steam path not found, skipping Steam game detection.");
  }

  const manualGames = ((store as any).get('manualGames', []) as any[]).map(game => ({
    ...game,
    isPathValid: fs.existsSync(game.executablePath),
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
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }
}

app.whenReady().then(() => {
  protocol.handle('local-file', (request) => {
    const filePath = request.url.slice('local-file://'.length);
    const absolutePath = path.join(app.getPath('userData'), filePath);
    return net.fetch('file://' + absolutePath);
  });

  createWindow();

  // Check for updates after window is created
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }

  ipcMain.handle('get-all-games', () => getAllGames());
  ipcMain.handle('get-api-key', () => (store as any).get('apiKey', ''));
  ipcMain.handle('set-api-key', (_, apiKey: string) => (store as any).set('apiKey', apiKey));
  ipcMain.handle('get-default-view-mode', () => (store as any).get('defaultViewMode', 'grid'));
  ipcMain.handle('set-default-view-mode', (_, viewMode: 'grid' | 'xmb') => (store as any).set('defaultViewMode', viewMode));
  ipcMain.handle('is-first-launch', () => !(store as any).get('hasLaunchedBefore', false));
  ipcMain.handle('set-has-launched', () => (store as any).set('hasLaunchedBefore', true));

  ipcMain.handle('get-theme', () => {
    return (store as any).get('appTheme', 'default');
  });

  ipcMain.handle('set-theme', (_, theme: 'default' | 'monotone') => {
    (store as any).set('appTheme', theme);
  });

  ipcMain.handle('open-file-dialog', async (_, options) => {
    const { filePaths } = await dialog.showOpenDialog(options);
    return filePaths?.[0];
  });

  ipcMain.handle('save-manual-game', async (_, game) => {
    const coversDir = path.join(app.getPath('userData'), 'covers');
    if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
    const newId = randomUUID();
    let coverArtUrl = '';
    if (game.coverArt) {
      const extension = path.extname(game.coverArt);
      const newFileName = `${newId}${extension}`;
      const newFilePath = path.join(coversDir, newFileName);
      fs.copyFileSync(game.coverArt, newFilePath);
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
    const manualGames = (store as any).get('manualGames', []);
    manualGames.push(newGame);
    (store as any).set('manualGames', manualGames);
    return newGame;
  });

  ipcMain.handle('delete-manual-game', async (_, gameId) => {
    const manualGames = (store as any).get('manualGames', []) as any[];
    const gameToDelete = manualGames.find(g => g.id === gameId);
    if (gameToDelete?.coverArt) {
      try {
        const coverPath = gameToDelete.coverArt.slice('local-file://'.length);
        const absolutePath = path.join(app.getPath('userData'), coverPath);
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (error) {
        console.error(`Failed to delete cover art for game ${gameId}:`, error);
      }
    }
    const updatedGames = manualGames.filter(g => g.id !== gameId);
    (store as any).set('manualGames', updatedGames);
  });

  ipcMain.handle('update-manual-game', async (_, updatedGame) => {
    const manualGames = (store as any).get('manualGames', []) as any[];
    const gameIndex = manualGames.findIndex(g => g.id === updatedGame.id);
    if (gameIndex === -1) return;
    const oldGame = manualGames[gameIndex];
    if (updatedGame.coverArt && !updatedGame.coverArt.startsWith('local-file://')) {
      const coversDir = path.join(app.getPath('userData'), 'covers');
      if (oldGame.coverArt) {
        try {
          const oldCoverPath = oldGame.coverArt.slice('local-file://'.length);
          const absoluteOldPath = path.join(app.getPath('userData'), oldCoverPath);
          if (fs.existsSync(absoluteOldPath)) fs.unlinkSync(absoluteOldPath);
        } catch (error) {
          console.error(`Failed to delete old cover art for game ${oldGame.id}:`, error);
        }
      }
      const extension = path.extname(updatedGame.coverArt);
      const newFileName = `${oldGame.id}${extension}`;
      const newFilePath = path.join(coversDir, newFileName);
      fs.copyFileSync(updatedGame.coverArt, newFilePath);
      updatedGame.coverArt = `local-file://covers/${newFileName}`;
    }
    manualGames[gameIndex] = { ...oldGame, ...updatedGame };
    (store as any).set('manualGames', manualGames);
    return manualGames[gameIndex];
  });

  ipcMain.handle('launch-game', async (_, game) => {
    if (game.type === 'steam') {
      await shell.openExternal(`steam://run/${game.id}`);
    } else if (game.type === 'manual') {
      const gameDir = path.dirname(game.executablePath);
      exec(`"${game.executablePath}"`, { cwd: gameDir }, (error) => {
        if (error) console.error(`Failed to launch manual game ${game.title}:`, error);
      });
    }
  });

  ipcMain.handle('refresh-library', () => {
    (store as any).set('gameCache', {});
    console.log('Game cache cleared.');
  });

  ipcMain.handle('show-game-context-menu', (event, game) => {
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      { label: '編集', click: () => { mainWindow?.webContents.send('edit-game', game); } },
      { label: '削除', click: () => { mainWindow?.webContents.send('delete-game', game); } }
    ];
    if (game.type === 'manual' && mainWindow) {
      const menu = Menu.buildFromTemplate(template);
      menu.popup({ window: mainWindow });
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
