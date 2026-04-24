"use client";
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../lib/fetch-with-auth';

export function useServiceWorker() {
  const { user } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log('[App] Service Worker registered successfully');
          
          // Request notification permission and subscribe to push
          if ('Notification' in window && user) {
            if (Notification.permission === 'default') {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                await subscribeToPush(registration, user.id);
              }
            } else if (Notification.permission === 'granted') {
              // Already granted, ensure subscribed
              await subscribeToPush(registration, user.id);
            }
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
  }, [user]);

  const subscribeToPush = async (registration: ServiceWorkerRegistration, userId: string) => {
    try {
      // Get push subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
      }

      // Convert subscription to JSON (ArrayBuffer keys need to be base64 encoded)
      const authKey = subscription.getKey('auth');
      const p256dhKey = subscription.getKey('p256dh');

      const subscriptionJson = {
        endpoint: subscription.endpoint,
        keys: {
          auth: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : '',
          p256dh: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
        },
      };

      // Save subscription to database via API
      const response = await fetchWithAuth('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: subscriptionJson }),
      });

      if (response.ok) {
        console.log('[App] Push subscription saved to database');
      } else {
        console.error('[App] Failed to save push subscription');
      }
    } catch (error) {
      console.error('[App] Error subscribing to push notifications:', error);
    }
  };

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

  return {
    showNativeNotification,
  };
}
