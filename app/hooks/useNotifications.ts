import { useEffect, useState, useCallback } from 'react';

interface CustomNotification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  onClick?: () => void;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<CustomNotification[]>([]);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return false;
  };

  const showNotification = useCallback((title: string, options?: { 
    body?: string; 
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }) => {
    const notification: CustomNotification = {
      id: options?.tag || Date.now().toString(),
      title,
      message: options?.body || '',
      icon: options?.icon,
      onClick: options?.onClick,
    };

    setNotifications(prev => [...prev, notification]);
    
    return notification;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    permission,
    requestPermission,
    showNotification,
    removeNotification,
    notifications,
    isSupported: 'Notification' in window,
  };
}
