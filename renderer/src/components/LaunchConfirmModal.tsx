import React from 'react';

interface LaunchConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    gameTitle: string;
}

const LaunchConfirmModal: React.FC<LaunchConfirmModalProps> = ({ isOpen, onClose, onConfirm, gameTitle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-bg-light text-text-main rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">ゲーム起動の確認</h2>
                <p className="mb-8 text-text-dim">
                    「{gameTitle}」を起動しますか？
                </p>

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-bg-lighter hover:bg-opacity-80 rounded-md transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-md transition-colors"
                    >
                        起動する
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LaunchConfirmModal;
