self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Listen for push events from the server
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Lecturely Reminder';
  const options = {
    body: data.body || 'Time to review your notes!',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'reminder',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Now',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Periodic background sync for checking reminders (requires registration)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    console.log('Periodic sync: checking reminders...');
    event.waitUntil(checkReminders());
  }
});

async function checkReminders() {
  try {
    // This would call your API to check for pending reminders
    // For now, we'll rely on the app being open
    console.log('Checking reminders in background...');
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}
