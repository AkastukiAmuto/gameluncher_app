import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getAllGames: () => ipcRenderer.invoke('get-all-games'),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),
  openFileDialog: (options: any) => ipcRenderer.invoke('open-file-dialog', options),
  saveManualGame: (game: any) => ipcRenderer.invoke('save-manual-game', game),
  launchGame: (game: any) => ipcRenderer.invoke('launch-game', game),
  refreshLibrary: () => ipcRenderer.invoke('refresh-library'),
  onShowNotification: (callback: (data: any) => void) => ipcRenderer.on('show-notification', (_event, value) => callback(value)),
  showGameContextMenu: (game: any) => ipcRenderer.invoke('show-game-context-menu', game),
  onEditGame: (callback: (game: any) => void) => ipcRenderer.on('edit-game', (_event, game) => callback(game)),
  onDeleteGame: (callback: (game: any) => void) => ipcRenderer.on('delete-game', (_event, game) => callback(game)),
  deleteManualGame: (gameId: string) => ipcRenderer.invoke('delete-manual-game', gameId),
  updateManualGame: (game: any) => ipcRenderer.invoke('update-manual-game', game),
  isFirstLaunch: () => ipcRenderer.invoke('is-first-launch'),
  setHasLaunched: () => ipcRenderer.invoke('set-has-launched'),
  getDefaultViewMode: () => ipcRenderer.invoke('get-default-view-mode'),
  setDefaultViewMode: (viewMode: 'grid' | 'xmb') => ipcRenderer.invoke('set-default-view-mode', viewMode),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: 'default' | 'monotone') => ipcRenderer.invoke('set-theme', theme),
});
