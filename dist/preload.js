"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    getAllGames: () => electron_1.ipcRenderer.invoke('get-all-games'),
    getApiKey: () => electron_1.ipcRenderer.invoke('get-api-key'),
    setApiKey: (apiKey) => electron_1.ipcRenderer.invoke('set-api-key', apiKey),
    openFileDialog: (options) => electron_1.ipcRenderer.invoke('open-file-dialog', options),
    saveManualGame: (game) => electron_1.ipcRenderer.invoke('save-manual-game', game),
    launchGame: (game) => electron_1.ipcRenderer.invoke('launch-game', game),
    refreshLibrary: () => electron_1.ipcRenderer.invoke('refresh-library'),
    onShowNotification: (callback) => electron_1.ipcRenderer.on('show-notification', (_event, value) => callback(value)),
    showGameContextMenu: (game) => electron_1.ipcRenderer.invoke('show-game-context-menu', game),
    onEditGame: (callback) => electron_1.ipcRenderer.on('edit-game', (_event, game) => callback(game)),
    onDeleteGame: (callback) => electron_1.ipcRenderer.on('delete-game', (_event, game) => callback(game)),
    deleteManualGame: (gameId) => electron_1.ipcRenderer.invoke('delete-manual-game', gameId),
    updateManualGame: (game) => electron_1.ipcRenderer.invoke('update-manual-game', game),
    isFirstLaunch: () => electron_1.ipcRenderer.invoke('is-first-launch'),
    setHasLaunched: () => electron_1.ipcRenderer.invoke('set-has-launched'),
    getDefaultViewMode: () => electron_1.ipcRenderer.invoke('get-default-view-mode'),
    setDefaultViewMode: (viewMode) => electron_1.ipcRenderer.invoke('set-default-view-mode', viewMode),
    getTheme: () => electron_1.ipcRenderer.invoke('get-theme'),
    setTheme: (theme) => electron_1.ipcRenderer.invoke('set-theme', theme),
});
