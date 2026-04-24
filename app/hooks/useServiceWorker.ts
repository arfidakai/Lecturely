"use client";
import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registered successfully');
          
          // Register periodic background sync (every 15 minutes)
          // Note: This requires HTTPS and the browser supports it
          if ('periodicSync' in registration) {
            (registration as any).periodicSync.register('check-reminders', {
              minInterval: 15 * 60 * 1000, // 15 minutes
            }).catch((error: any) => {
              console.log('[App] Periodic sync registration failed:', error);
              // This is not critical - reminders will still work when app is open
            });
          }
          
          // Check for updates periodically
          const updateCheckInterval = setInterval(() => {
            registration.update().catch((error: any) => 
              console.log('[App] Update check failed:', error)
            );
          }, 60000); // Check every minute
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[App] New service worker available');
                }
              });
            }
          });
          
          return () => clearInterval(updateCheckInterval);
        })
        .catch((error: any) => {
          console.error('[App] Service Worker registration failed:', error);
        });
    }
  }, []);

  const showNativeNotification = async (title: string, options?: NotificationOptions) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.ready;
      
      if (Notification.permission === 'granted') {
        return registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          requireInteraction: true,
          ...options,
        });
      }
    }
    return null;
  };

  // Send message to service worker to check reminders
  const triggerBackgroundSync = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Try to use background sync API
        if ('sync' in registration) {
          await (registration as any).sync.register('sync-reminders');
          console.log('[App] Background sync triggered');
        }
        
        // Also send a message to service worker for immediate check
        registration.active?.postMessage({
          type: 'CHECK_REMINDERS',
        });
      } catch (error: any) {
        console.error('[App] Error triggering background sync:', error);
      }
    }
  };

  return { showNativeNotification, triggerBackgroundSync };
}
