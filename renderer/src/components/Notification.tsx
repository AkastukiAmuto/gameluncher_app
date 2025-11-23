import React, { useEffect, useState } from 'react';

export interface NotificationData {
  id: number;
  type: 'info' | 'success' | 'error';
  message: string;
}

interface NotificationProps {
  notification: NotificationData;
  onDismiss: (id: number) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(true);
    
    // Animate out and dismiss after a delay
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(notification.id), 300); // Wait for fade out
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const bgColor = {
    info: 'bg-primary',
    success: 'bg-green-500', // Note: We don't have a semantic 'success' color yet, keeping green for now.
    error: 'bg-red-500', // Note: We don't have a semantic 'error' color yet, keeping red for now.
  }[notification.type];

  return (
    <div
      className={`p-4 rounded-lg shadow-lg text-text-main transition-all duration-300 ease-in-out ${bgColor} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {notification.message}
    </div>
  );
};

export default Notification;
