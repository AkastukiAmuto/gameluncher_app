import React from 'react';

interface WelcomeProps {
  onFinish: () => void;
  onGoToSettings: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onFinish, onGoToSettings }) => {
  const handleFinish = () => {
    window.api.setHasLaunched();
    onFinish();
  };
  
  const handleGoToSettings = () => {
    window.api.setHasLaunched();
    onGoToSettings();
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-5xl font-bold mb-4">ゲームランチャーへようこそ！</h1>
      <p className="text-lg text-text-dim max-w-2xl mb-8">
        このアプリケーションは、PC上のゲームを一つの場所に集約して管理します。
        最高の体験を得るために、Steamと連携してゲームのカバーアートなどを自動で取得することをお勧めします。
      </p>
      
      <div className="bg-bg-light p-6 rounded-lg shadow-lg max-w-2xl">
        <h2 className="text-2xl font-semibold mb-3">Steam Web APIキーの設定</h2>
        <p className="text-text-dim mb-6">
          カバーアートなどを自動取得するには、Steam Web APIキーが必要です。
          キーは<a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">こちら</a>から無料で取得できます。
          後からでも設定は可能です。
        </p>
        <button 
          onClick={handleGoToSettings}
          className="w-full px-6 py-3 bg-primary hover:bg-primary-hover rounded-md text-lg font-semibold transition-colors"
        >
          設定ページへ移動してキーを設定する
        </button>
      </div>

      <button 
        onClick={handleFinish}
        className="mt-8 text-text-dim hover:text-text-main hover:underline transition-colors"
      >
        今は設定しない
      </button>
    </div>
  );
};

export default Welcome;
