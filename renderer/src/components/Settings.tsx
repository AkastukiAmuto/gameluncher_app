import React, { useState, useEffect } from 'react';

interface SettingsProps {
  onBack: () => void;
  onThemeChange: (theme: 'default' | 'monotone') => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onThemeChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [defaultView, setDefaultView] = useState<'grid' | 'xmb'>('grid');
  const [currentTheme, setCurrentTheme] = useState<'default' | 'monotone'>('default');

  useEffect(() => {
    const fetchSettings = async () => {
      const key = await window.api.getApiKey();
      setApiKey(key);
      const viewMode = await window.api.getDefaultViewMode();
      setDefaultView(viewMode);
      const theme = await window.api.getTheme();
      setCurrentTheme(theme);
    };
    fetchSettings();
  }, []);

  const handleSaveApi = async () => {
    await window.api.setApiKey(apiKey);
    setMessage('API Key saved successfully!');
    setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
  };

  const handleViewChange = async (view: 'grid' | 'xmb') => {
    setDefaultView(view);
    await window.api.setDefaultViewMode(view);
  };

  const handleThemeChange = async (theme: 'default' | 'monotone') => {
    setCurrentTheme(theme);
    await window.api.setTheme(theme);
    onThemeChange(theme);
  };

  return (
    <div className="p-8 text-text-main">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="px-4 py-2 bg-bg-lighter hover:bg-opacity-80 rounded-md transition-colors mr-4">
          &larr; Back to Library
        </button>
        <h1 className="text-4xl font-bold">Settings</h1>
      </div>

      <div className="space-y-12">
        <div className="max-w-md">
          <h2 className="text-2xl mb-4">Steam Web API</h2>
          <p className="text-text-dim mb-4">
            To fetch game cover art and other details, you need a Steam Web API key.
            You can get one from <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">here</a>.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API Key"
              className="flex-grow p-2 rounded-md bg-bg-light border border-border-color focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleSaveApi}
              className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-md transition-colors"
            >
              Save
            </button>
          </div>
          {message && <p className="mt-4 text-green-400">{message}</p>}
        </div>

        <div className="max-w-md">
          <h2 className="text-2xl mb-4">表示設定</h2>
          <p className="text-text-dim mb-4">
            起動時のデフォルトの表示モードを選択します。
          </p>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="viewMode"
                value="grid"
                checked={defaultView === 'grid'}
                onChange={() => handleViewChange('grid')}
                className="form-radio h-5 w-5 text-accent bg-bg-lighter border-border-color focus:ring-accent"
              />
              <span>グリッド表示</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="viewMode"
                value="xmb"
                checked={defaultView === 'xmb'}
                onChange={() => handleViewChange('xmb')}
                className="form-radio h-5 w-5 text-accent bg-bg-lighter border-border-color focus:ring-accent"
              />
              <span>リスト表示</span>
            </label>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-2xl mb-4">テーマ設定</h2>
          <p className="text-text-dim mb-4">
            アプリケーションのUIテーマを選択します。
          </p>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="appTheme"
                value="default"
                checked={currentTheme === 'default'}
                onChange={() => handleThemeChange('default')}
                className="form-radio h-5 w-5 text-accent bg-bg-lighter border-border-color focus:ring-accent"
              />
              <span>デフォルト</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="appTheme"
                value="monotone"
                checked={currentTheme === 'monotone'}
                onChange={() => handleThemeChange('monotone')}
                className="form-radio h-5 w-5 text-accent bg-bg-lighter border-border-color focus:ring-accent"
              />
              <span>モノトーン</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
