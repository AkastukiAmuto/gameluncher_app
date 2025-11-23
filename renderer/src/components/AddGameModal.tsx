import React, { useState, useEffect } from 'react';
import { Game } from '../types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: () => void;
  gameToEdit: Game | null;
}

const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose, onGameAdded, gameToEdit }) => {
  const [title, setTitle] = useState('');
  const [executablePath, setExecutablePath] = useState('');
  const [coverArt, setCoverArt] = useState('');

  const isEditMode = gameToEdit !== null;

  useEffect(() => {
    if (isEditMode && isOpen) {
      setTitle(gameToEdit.title);
      setExecutablePath(gameToEdit.executablePath || '');
      setCoverArt(gameToEdit.coverArt);
    } else {
      // Reset form when opening for a new game
      setTitle('');
      setExecutablePath('');
      setCoverArt('');
    }
  }, [gameToEdit, isOpen, isEditMode]);

  if (!isOpen) return null;

  const handleSelectFile = async (type: 'executable' | 'cover') => {
    const options = type === 'executable'
      ? { properties: ['openFile'], filters: [{ name: 'Executables', extensions: ['exe'] }] }
      : { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }] };
    
    const path = await window.api.openFileDialog(options);
    if (path) {
      if (type === 'executable') {
        setExecutablePath(path);
      } else {
        setCoverArt(path);
      }
    }
  };

  const handleSave = async () => {
    if (!title || !executablePath) {
      alert('ゲームタイトルと実行ファイルパスは必須です。');
      return;
    }
    
    if (isEditMode) {
      const updatedGame = {
        ...gameToEdit,
        title,
        executablePath,
        coverArt,
      };
      await window.api.updateManualGame(updatedGame);
    } else {
      await window.api.saveManualGame({ title, executablePath, coverArt });
    }
    
    onGameAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-bg-light text-text-main rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'ゲームを編集' : 'ゲームを手動で追加'}</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-dim mb-1">ゲームタイトル</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded-md bg-bg-lighter border border-border-color focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex space-x-4">
            <div className="flex-grow">
              <label htmlFor="executablePath" className="block text-sm font-medium text-text-dim mb-1">実行ファイルパス</label>
              <div className="flex">
                <input
                  type="text"
                  id="executablePath"
                  value={executablePath}
                  readOnly
                  className="w-full p-2 rounded-l-md bg-bg-main border border-border-color focus:outline-none"
                  placeholder="C:\\path\\to\\game.exe"
                />
                <button onClick={() => handleSelectFile('executable')} className="px-4 py-2 bg-border-color hover:bg-opacity-80 rounded-r-md transition-colors">
                  選択...
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-grow">
              <label htmlFor="coverArt" className="block text-sm font-medium text-text-dim mb-1">カバーアート画像</label>
               <div className="flex">
                <input
                  type="text"
                  id="coverArt"
                  value={coverArt}
                  readOnly
                  className="w-full p-2 rounded-l-md bg-bg-main border border-border-color focus:outline-none"
                  placeholder="C:\\path\\to\\cover.png"
                />
                <button onClick={() => handleSelectFile('cover')} className="px-4 py-2 bg-border-color hover:bg-opacity-80 rounded-r-md transition-colors">
                  選択...
                </button>
              </div>
            </div>
            <div className="w-24 h-36 bg-bg-lighter rounded-md flex-shrink-0 flex items-center justify-center">
              {coverArt ? (
                <img src={coverArt} alt="Cover Preview" className="w-full h-full object-cover rounded-md" />
              ) : (
                <span className="text-xs text-text-dim">Preview</span>
              )}
            </div>
          </div>
          
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="px-6 py-2 bg-bg-lighter hover:bg-opacity-80 rounded-md transition-colors">
            キャンセル
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-md transition-colors">
            {isEditMode ? '更新' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
