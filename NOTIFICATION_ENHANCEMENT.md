# Background Notification Enhancement Guide

## Overview

Lecturely sekarang punya sistem notifikasi yang lebih robust dengan kemampuan untuk menampilkan notifikasi bahkan ketika web browser tidak sedang dibuka (dalam kondisi tertentu). Fitur ini menggunakan kombinasi:

- **Service Worker** dengan periodic background sync
- **Improved reminder checking logic** dengan locking mechanism
- **Background sync API** untuk sync reminders saat connectivity kembali
- **Visibility API** untuk context-aware checking

## Arsitektur Notification System

### 1. Service Worker (`public/sw.js`)

Service Worker sekarang mendukung:

#### **Periodic Background Sync**
```javascript
// Registered with 15-minute interval
registration.periodicSync.register('check-reminders', {
  minInterval: 15 * 60 * 1000 // 15 minutes
});
```

#### **Background Sync**
Ketika connectivity hilang dan kembali, otomatis trigger sync:
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(checkRemindersInBackground());
  }
});
```

#### **Message-based Triggering**
Frontend dapat secara eksplisit trigger reminder check via service worker:
```javascript
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_REMINDERS') {
    checkRemindersInBackground();
  }
});
```

#### **Native Notifications dari Service Worker**
```javascript
await self.registration.showNotification(title, {
  body: message,
  tag: reminderId, // Prevent duplicates
  requireInteraction: true,
  vibrate: [200, 100, 200],
  actions: [
    { action: 'view', title: 'View Now' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
});
```

### 2. Improved useReminderChecker Hook

#### **Features:**

**Duplicate Prevention**
```typescript
const isCheckingRef = useRef(false);
// Prevent simultaneous duplicate checks
if (isCheckingRef.current) return;
```

**Rate Limiting**
```typescript
const lastCheckTimeRef = useRef<number>(0);
// Only check if more than 10 seconds have passed
if (now - lastCheckTimeRef.current < 10000) return;
```

**Context-Aware Checking**
- Checks immediately when tab becomes visible
- Checks every 30 seconds while tab is active
- Triggers background sync when tab is hidden
- Checks again when window regains focus

```typescript
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkReminders();
  } else {
    triggerBackgroundSync?.(); // Let service worker take over
  }
};
```

### 3. Enhanced useServiceWorker Hook

**Periodic Sync Registration**
```typescript
if ('periodicSync' in registration) {
  (registration as any).periodicSync.register('check-reminders', {
    minInterval: 15 * 60 * 1000 // 15 minutes
  });
}
```

**Explicit Background Sync Trigger**
```typescript
const triggerBackgroundSync = async () => {
  if ('sync' in registration) {
    await (registration as any).sync.register('sync-reminders');
  }
  // Also message service worker for immediate check
  registration.active?.postMessage({ type: 'CHECK_REMINDERS' });
};
```

## Fitur-Fitur Notifikasi

### 1. **In-App Notifications** (Browser Terbuka)
- Real-time display via `useNotifications` hook
- Toast-style components di atas halaman
- Immediate feedback dan interactivity

### 2. **Native Notifications** (Browser Bisa Tertutup)
- Standard Web Notifications API
- System-level notifications
- Persist even ketika browser closed (di beberapa OS)
- Interactive buttons (View, Dismiss)

### 3. **Service Worker Background Checks**
- Periodic checks setiap 15 menit (jika browser support)
- Background sync saat connectivity restored
- Cache last-check timestamp untuk avoid redundant calls

### 4. **Smart Retry Logic**
- Graceful fallback kalau periodic sync tidak supported
- Message-based communication antara app dan service worker
- Exponential backoff untuk failed API calls

## Setup Requirements

### 1. **HTTPS Only**
Service Worker dan Periodic Background Sync hanya bekerja di HTTPS (atau localhost untuk development).

```
✅ Production: https://lecturely.com
✅ Development: http://localhost:3000
❌ Won't work: http://example.com (non-local HTTP)
```

### 2. **Notification Permission**
User harus grant notification permission:
```typescript
const permission = await Notification.requestPermission();
// 'granted' | 'denied' | 'default'
```

### 3. **Service Worker Registration**
Otomatis terjadi saat app mounts via `useServiceWorker` hook.

## How It Works - Skenario

### Scenario 1: Browser Dibuka, Tab Active
```
1. useReminderChecker.checkReminders() dipanggil setiap 30 detik
2. Fetch pending reminders dari /api/reminders
3. Untuk reminder yang sudah waktunya:
   - Show in-app toast notification
   - Show native notification (optional, untuk mobile)
   - Mark as sent di database
4. User bisa click notification untuk navigate ke recording
```

### Scenario 2: Browser Dibuka, Tab Background
```
1. Visibility API detect tab tersembunyi
2. Trigger background sync via service worker
3. Service worker:
   - Check reminders setiap interval (jika supported)
   - Cache hasil untuk avoid duplicate checks
   - Show native notifications otomatis
4. Saat tab kembali active:
   - Frontend check reminders lagi
   - Sync dengan backend state
```

### Scenario 3: Browser Tertutup
```
1. Periodic sync runs setiap 15 menit (browser support dependent)
   OR
   Browser dapat menerima push notifications dari server
   (requires push subscription setup)

2. Service worker:
   - Akses cached reminders
   - Check timing dengan current time
   - Show native notifications
   
3. User tap notification:
   - Open browser
   - Navigate ke recording page
   - Mark reminder as interacted
```

## Konfigurasi & Customization

### Reminder Check Interval
Edit di `useReminderChecker.ts`:
```typescript
// Change from 30000ms (30 seconds)
const interval = setInterval(checkReminders, 30000);
// To your desired interval
```

### Service Worker Periodic Sync Interval
Edit di `useServiceWorker.ts`:
```typescript
// Change from 15 minutes
minInterval: 15 * 60 * 1000
// To your desired interval (must be > 15 minutes in production)
```

### Notification Timing Window
Edit di `useReminderChecker.ts` dan `public/sw.js`:
```typescript
// Currently: 5 minutes before/after reminder time
if (diffInMinutes <= 0 && diffInMinutes >= -5)

// Change to your desired window (e.g., 10 minutes)
if (diffInMinutes <= 0 && diffInMinutes >= -10)
```

### Cache Expiration
Edit di `public/sw.js`:
```typescript
// Currently: 2 minutes minimum between checks
if (now - lastCheck < 2 * 60 * 1000)

// Change to your desired duration
if (now - lastCheck < 5 * 60 * 1000) // 5 minutes
```

## Testing Background Notifications

### 1. Test Service Worker Registration
```javascript
// Open DevTools Console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### 2. Test Periodic Sync
```javascript
// Check if registered
const registration = await navigator.serviceWorker.ready;
if ('periodicSync' in registration) {
  const tags = await registration.periodicSync.getTags();
  console.log('Periodic sync tags:', tags);
}
```

### 3. Manually Trigger Sync
```javascript
// From DevTools Console
const registration = await navigator.serviceWorker.ready;
await registration.sync.register('sync-reminders');
console.log('Sync triggered manually');
```

### 4. Monitor Service Worker Logs
```
DevTools → Application → Service Workers
→ Check "Show all" and "Update on reload"
→ Check console logs from service worker
```

### 5. Test Native Notifications
```javascript
// From DevTools Console
if (Notification.permission === 'granted') {
  new Notification('Test Notification', {
    body: 'This is a test',
    tag: 'test-notification',
    requireInteraction: true
  });
}
```

### 6. Create Test Reminder
1. Buat reminder dengan time = sekarang + 1 menit
2. Close browser/minimize tab
3. Tunggu notifikasi appear
4. Check Service Worker logs untuk debug

## Troubleshooting

### Notifications Tidak Muncul

**Check 1: Permission**
```javascript
console.log('Notification permission:', Notification.permission);
// Should be 'granted'
```

**Check 2: Service Worker Active**
```javascript
const registration = await navigator.serviceWorker.ready;
console.log('Service worker active:', registration.active);
```

**Check 3: Browser Support**
- Safari: Limited periodic sync support
- Chrome: Full support (HTTPS required)
- Firefox: Full support (HTTPS required)
- Edge: Full support (HTTPS required)

**Check 4: Browser Settings**
- Check system notification settings (OS level)
- Check browser notification settings
- Ensure browser not blocking notifications

### Service Worker Not Updating
```javascript
// Force update
const registration = await navigator.serviceWorker.ready;
await registration.update();
```

### Duplicate Notifications
- Lihat `tag` property - should prevent duplicates
- Check `sent` flag di database untuk prevent re-triggering
- Verify `isCheckingRef` locking mechanism

## Performance Considerations

### 1. **Battery Usage**
- Periodic sync setiap 15 menit minimal untuk mencegah battery drain
- Background checking di-limit dengan cache dan rate limiting
- Adjust interval berdasarkan user preferences

### 2. **Network Usage**
- Cache reminder checks untuk avoid redundant API calls
- Batch reminder updates dalam single request
- Use service worker caching untuk offline support

### 3. **CPU Usage**
- Locking mechanism prevent duplicate simultaneous checks
- Minimal processing di service worker
- Efficient filtering dan matching logic

## Future Enhancements

### 1. **Push Notifications from Server**
```
Server generates push notifications
↓
Send to all active subscriptions
↓
Service worker receives push event
↓
Show native notification even if browser closed
```

### 2. **Advanced Scheduling**
```
- Snooze reminders
- Recurring reminders
- Custom notification timing (e.g., 5 minutes before vs 30 minutes)
- Timezone-aware scheduling
```

### 3. **Notification Preferences**
```
- User can choose notification type (in-app only, native, both)
- Quiet hours configuration
- Sound/vibration settings
- Notification grouping
```

### 4. **Analytics**
```
- Track notification engagement
- Measure interaction rates
- Identify optimal notification timing
- A/B test notification content
```

## API Changes Required for Full Push Support

Untuk mendukung notifications bahkan saat browser completely closed, perlu tambahan:

```typescript
// 1. POST /api/notifications/subscribe
// Receive push subscription object
{
  endpoint: "https://...",
  keys: { p256dh: "...", auth: "..." }
}

// 2. Store subscription di database
// 3. Schedule push notifications dari backend
// 4. Send push saat reminder time reached

// Current implementation sudah siap untuk integration ini
```

## References

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN: Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
- [MDN: Periodic Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Periodic_Background_Sync_API)
- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## Summary

✅ **Dengan Enhancement ini, Lecturely sekarang:**
- ✓ Show notifications saat browser active
- ✓ Show notifications saat browser background (contextual)
- ✓ Attempt background sync saat browser closed (dengan periodic sync)
- ✓ Intelligent retry logic dengan rate limiting
- ✓ No duplicate notifications via tag + sent flags
- ✓ User-friendly interaction (view/dismiss actions)
- ✓ Graceful fallback untuk unsupported browsers
- ✓ Efficient resource usage dengan caching

**Next Step:**
- Implement push notification backend untuk notifications saat browser completely closed
- Add user notification preferences/settings
- Create notification analytics dashboard
