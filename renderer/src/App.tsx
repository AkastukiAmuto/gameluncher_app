import React, { useEffect, useState } from 'react';
import { Game } from './types';
import Settings from './components/Settings';
import AddGameModal from './components/AddGameModal';
import XMBView from './components/XMBView';
import Notification, { NotificationData } from './components/Notification';
import Welcome from './components/Welcome';
import LaunchConfirmModal from './components/LaunchConfirmModal';

// Declare global interface for window.api to make TypeScript happy
declare global {
  interface Window {
    api: {
      getAllGames: () => Promise<Game[]>;
      getApiKey: () => Promise<string>;
      setApiKey: (apiKey: string) => Promise<void>;
      openFileDialog: (options: any) => Promise<string | undefined>;
      saveManualGame: (game: any) => Promise<any>;
      updateManualGame: (game: Game) => Promise<any>;
      launchGame: (game: any) => Promise<void>;
      refreshLibrary: () => Promise<void>;
      onShowNotification: (callback: (data: NotificationData) => void) => void;
      showGameContextMenu: (game: Game) => void;
      onEditGame: (callback: (game: Game) => void) => void;
      onDeleteGame: (callback: (game: Game) => void) => void;
      deleteManualGame: (gameId: string) => Promise<void>;
      isFirstLaunch: () => Promise<boolean>;
      setHasLaunched: () => Promise<void>;
      getDefaultViewMode: () => Promise<'grid' | 'xmb'>;
      setDefaultViewMode: (viewMode: 'grid' | 'xmb') => Promise<void>;
      getTheme: () => Promise<'default' | 'monotone'>;
      setTheme: (theme: 'default' | 'monotone') => Promise<void>;
    };
  }
}

// Main Library View Component
const LibraryView = ({ onNavigateToSettings }: { onNavigateToSettings: () => void }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isAddGameModalOpen, setAddGameModalOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'xmb'>('grid');
  const [launchingGameName, setLaunchingGameName] = useState<string | null>(null);
  const [launchConfirmGame, setLaunchConfirmGame] = useState<Game | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchGames = async () => {
    try {
      setLoading(true);
      const fetchedGames = await window.api.getAllGames();
      setGames(fetchedGames);
    } catch (err) {
      console.error("Failed to fetch games:", err);
      setError("Failed to load games. Please check the console for more details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const savedViewMode = await window.api.getDefaultViewMode();
      setViewMode(savedViewMode);
      await fetchGames();
      setLoading(false);
    };

    initialize();

    window.api.onEditGame((game) => {
      setGameToEdit(game);
      setAddGameModalOpen(true);
    });

    window.api.onDeleteGame(async (game) => {
      if (window.confirm(`「${game.title}」をライブラリから削除しますか？`)) {
        await window.api.deleteManualGame(game.id);
        await fetchGames();
      }
    });

  }, []);

  const handleGameClick = (game: Game) => {
    if (game.isPathValid === false) return;
    setLaunchConfirmGame(game);
  };

  const handleLaunchConfirm = async () => {
    if (!launchConfirmGame) return;

    const game = launchConfirmGame;
    setLaunchConfirmGame(null);
    setLaunchingGameName(game.title);

    await window.api.launchGame(game);

    setTimeout(() => {
      setLaunchingGameName(null);
    }, 3000);
  };

  const handleContextMenu = (e: React.MouseEvent, game: Game) => {
    e.preventDefault();
    window.api.showGameContextMenu(game);
  };

  const handleRefresh = async () => {
    await window.api.refreshLibrary();
    await fetchGames();
  };

  const handleViewModeToggle = () => {
    setSelectedGame(null);
    setViewMode(prev => prev === 'grid' ? 'xmb' : 'grid');
  };

  const filteredBySearchGames = games.filter(game =>
    game.title.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-bg-main text-text-main">Loading games...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-bg-main text-red-500">Error: {error}</div>;
  }

  const backgroundImageUrl = selectedGame?.coverArt;
  const backgroundVideoUrl = selectedGame?.backgroundVideo;

  return (
    <div className="min-h-screen bg-bg-main text-text-main relative">
      {/* Background Media Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Always render image if available */}
        {backgroundImageUrl && (
          <img
            key={`img-${selectedGame?.id}`}
            src={backgroundImageUrl}
            alt="Game Background"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
        )}

        {/* Render video on top if available */}
        {backgroundVideoUrl && (
          <video
            key={`video-${selectedGame?.id}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            src={backgroundVideoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
      </div>

      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black opacity-80"></div>

      {/* Content */}
      <div className="relative z-10 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-8">
            <h1 className="text-4xl font-bold">My Game Library</h1>
            <input
              type="text"
              placeholder="Search games..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-4 py-2 rounded-full bg-bg-light border border-border-color focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleViewModeToggle} className="px-4 py-2 bg-bg-lighter hover:bg-opacity-80 rounded-md transition-colors">
              {viewMode === 'grid' ? 'リスト表示' : 'グリッド表示'}
            </button>
            <button onClick={handleRefresh} className="px-4 py-2 bg-secondary hover:bg-secondary-hover rounded-md transition-colors">
              ライブラリを更新
            </button>
            <button onClick={() => setAddGameModalOpen(true)} className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-md transition-colors">
              ゲームを手動で追加
            </button>
            <button onClick={onNavigateToSettings} className="px-4 py-2 bg-bg-lighter hover:bg-opacity-80 rounded-md transition-colors">
              設定
            </button>
          </div>
        </div>

        {filteredBySearchGames.length === 0 && games.length > 0 ? (
          <div className="text-center text-text-dim text-lg">No matching games found.</div>
        ) : games.length === 0 ? (
          <div className="text-center text-text-dim text-lg">No games found. Add some manually or ensure Steam is installed.</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredBySearchGames.map((game) => (
              <div
                key={game.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105"
                onMouseEnter={() => setSelectedGame(game)}
                onMouseLeave={() => setSelectedGame(null)}
                onClick={() => handleGameClick(game)}
                onContextMenu={(e) => handleContextMenu(e, game)}
              >
                <img
                  src={game.coverArt || `https://via.placeholder.com/200x300?text=${encodeURIComponent(game.title)}`}
                  alt={game.title}
                  className="w-full h-auto object-cover aspect-[2/3] rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                  <p className="text-text-main text-sm font-semibold truncate w-full">{game.title}</p>
                </div>
                {game.isPathValid === false && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-center p-2">
                    <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-sm text-yellow-300 mt-2">実行ファイルが見つかりません</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <XMBView games={filteredBySearchGames} onGameClick={handleGameClick} onGameSelect={setSelectedGame} onContextMenu={handleContextMenu} />
        )}
      </div>
      <AddGameModal
        isOpen={isAddGameModalOpen}
        onClose={() => {
          setAddGameModalOpen(false);
          setGameToEdit(null);
        }}
        onGameAdded={fetchGames}
        gameToEdit={gameToEdit}
      />

      <LaunchConfirmModal
        isOpen={!!launchConfirmGame}
        onClose={() => setLaunchConfirmGame(null)}
        onConfirm={handleLaunchConfirm}
        gameTitle={launchConfirmGame?.title || ''}
      />

      {launchingGameName && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-text-main px-6 py-3 rounded-full shadow-lg z-50 transition-opacity duration-300">
          <p className="text-lg">「{launchingGameName}」を起動中...</p>
        </div>
      )}
    </div>
  );
}

// Main App Component for Routing
function App() {
  const [view, setView] = useState<'loading' | 'welcome' | 'library' | 'settings'>('loading');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [currentTheme, setCurrentTheme] = useState<'default' | 'monotone'>('default');

  useEffect(() => {
    const checkInitialState = async () => {
      const isFirst = await window.api.isFirstLaunch();
      if (isFirst) {
        setView('welcome');
      } else {
        setView('library');
      }
      const savedTheme = await window.api.getTheme();
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    };
    checkInitialState();

    window.api.onShowNotification((data) => {
      const newNotification = { ...data, id: Date.now() };
      setNotifications(prev => [...prev, newNotification]);
    });
  }, []);

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleThemeChange = (theme: 'default' | 'monotone') => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const renderView = () => {
    switch (view) {
      case 'loading':
        return <div className="flex items-center justify-center min-h-screen bg-bg-main text-text-main">Loading...</div>;
      case 'welcome':
        return <Welcome onFinish={() => setView('library')} onGoToSettings={() => setView('settings')} />;
      case 'settings':
        return <div className="min-h-screen bg-bg-main"><Settings onBack={() => setView('library')} onThemeChange={handleThemeChange} /></div>;
      case 'library':
      default:
        return <LibraryView onNavigateToSettings={() => setView('settings')} />;
    }
  };

  return (
    <>
      {renderView()}

      {/* Notification Area */}
      <div className="fixed bottom-8 right-8 space-y-4 z-50">
        {notifications.map(n => (
          <Notification key={n.id} notification={n} onDismiss={dismissNotification} />
        ))}
      </div>
    </>
  );
}

export default App;