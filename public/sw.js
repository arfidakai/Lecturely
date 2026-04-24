const CACHE_NAME = 'lecturely-v1';
const REMINDERS_CACHE = 'lecturely-reminders-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== REMINDERS_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
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
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    const reminderId = event.notification.data?.reminderId;
    
    // Try to mark as interacted
    if (reminderId) {
      fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reminderId,
          interacted: true,
        }),
      }).catch(error => console.error('[SW] Error updating reminder:', error));
    }
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open with this URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Check for any Lecturely window to reuse
        for (const client of clientList) {
          if (client.url.includes('/transcription') || client.url.includes('/')) {
            return client.navigate(urlToOpen).then(client => client && client.focus());
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

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  const reminderId = event.notification.data?.reminderId;
  if (reminderId) {
    // Mark as dismissed
    fetch('/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reminderId,
        dismissed: true,
      }),
    }).catch(error => console.error('[SW] Error updating reminder:', error));
  }
});

// Periodic background sync for checking reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    console.log('Periodic sync: checking reminders...');
    event.waitUntil(checkRemindersInBackground());
  }
});

// Background sync for when connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    console.log('Background sync: syncing reminders...');
    event.waitUntil(checkRemindersInBackground());
  }
});

// Message from clients (homepage checking in)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_REMINDERS') {
    console.log('Message received: checking reminders...');
    checkRemindersInBackground().catch(error => 
      console.error('Error checking reminders:', error)
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Store auth token temporarily for API calls
let storedAuthToken = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STORE_AUTH_TOKEN') {
    storedAuthToken = event.data.token;
  }
});

async function checkRemindersInBackground() {
  try {
    console.log('[SW] Starting background reminder check...');
    
    // Get stored reminders to avoid repeated checks
    const cache = await caches.open(REMINDERS_CACHE);
    const cachedResponse = await cache.match('last-check');
    
    if (cachedResponse) {
      const data = await cachedResponse.json();
      const lastCheck = new Date(data.timestamp);
      const now = new Date();
      
      // Only check if more than 2 minutes have passed since last check
      if (now - lastCheck < 2 * 60 * 1000) {
        console.log('[SW] Skipping check - recently checked');
        return;
      }
    }

    // Try to call reminder check endpoint
    // Note: This won't have auth token in background, but server can use device token
    const response = await fetch('/api/reminders', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // In production, you might want to add a device/service-worker token
    }).catch(error => {
      console.error('[SW] Fetch error:', error);
      return null;
    });

    if (response && response.ok) {
      const data = await response.json();
      const reminders = data.reminders || [];
      
      console.log('[SW] Found reminders:', reminders.length);
      
      // Cache the check timestamp
      const cacheTimestamp = {
        timestamp: new Date().toISOString(),
        reminderCount: reminders.length,
      };
      
      await cache.put('last-check', new Response(JSON.stringify(cacheTimestamp)));
      
      // Process pending reminders
      const now = new Date();
      for (const reminder of reminders) {
        if (!reminder.sent) {
          const reminderTime = new Date(reminder.reminder_time);
          const diffInMinutes = (reminderTime.getTime() - now.getTime()) / (1000 * 60);
          
          // Show notification if it's time (within 5 minute window)
          if (diffInMinutes <= 0 && diffInMinutes >= -5) {
            const subjectName = reminder.recordings?.subjects?.name || 'Subject';
            const subjectIcon = reminder.recordings?.subjects?.icon || '📚';
            const recordingTitle = reminder.recordings?.title || 'Recording';
            
            console.log('[SW] Showing notification for:', subjectName);
            
            await self.registration.showNotification(
              `${subjectIcon} Review Reminder: ${subjectName}`,
              {
                body: `Time to review: ${recordingTitle}`,
                tag: reminder.id,
                requireInteraction: true,
                vibrate: [200, 100, 200],
                data: {
                  url: `/transcription/${reminder.recording_id}/${reminder.recordings?.subject_id || ''}`,
                  reminderId: reminder.id,
                },
                actions: [
                  { action: 'view', title: 'View Now' },
                  { action: 'dismiss', title: 'Dismiss' },
                ],
              }
            );
            
            // Mark as sent
            try {
              await fetch('/api/reminders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: reminder.id,
                  sent: true,
                }),
              });
            } catch (error) {
              console.error('[SW] Error marking reminder as sent:', error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[SW] Error in checkRemindersInBackground:', error);
  }
}

async function checkReminders() {
  try {
    // This would call your API to check for pending reminders
    // For now, we'll rely on the app being open
    console.log('Checking reminders in background...');
    await checkRemindersInBackground();
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}
