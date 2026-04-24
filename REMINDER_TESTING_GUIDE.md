# Reminder System Testing Guide

Panduan lengkap untuk test dan maksimalkan fitur reminder di Lecturely.

## Quick Start

### 1. Enable Notifications
```
Homepage → Banner "Enable Reminder Notifications"
→ Click "Enable Notifications"
→ Browser akan minta permission
→ Grant permission
```

### 2. Create a Reminder
```
Recording Page → Set reminder time
→ Click "Set Reminder"
→ Reminder ditambahkan ke database
```

### 3. Wait for Notification
```
Tab active: Notifikasi akan muncul sebagai toast
Tab background: Notifikasi native system akan muncul
Tab closed: Perlu periodic sync support (HTTPS + browser support)
```

## Test Scenarios

### Scenario A: In-App Notification (Browser Terbuka)

**Setup:**
1. Create reminder dengan time = sekarang + 1 menit
2. Keep browser tab open
3. Stay on any page dalam app

**Expected:**
- Setelah 1 menit, toast notification appear di atas page
- Toast menunjukkan subject icon, subject name, dan recording title
- Toast punya close button

**Debug:**
```javascript
// DevTools Console
// Monitor reminder checks
window.addEventListener('visibilitychange', () => {
  console.log('Visibility changed:', document.visibilityState);
});

// Manual check
const checkButton = document.querySelector('[title="Add new reminder"]');
// Or trigger via service worker message
navigator.serviceWorker.ready.then(reg => {
  reg.active?.postMessage({ type: 'CHECK_REMINDERS' });
});
```

### Scenario B: Native Notification (Tab Background)

**Setup:**
1. Create reminder dengan time = sekarang + 2 menit
2. Open another tab (app tetap running)
3. Click on other tab (app tab goes to background)

**Expected:**
- Setelah 2 menit, system notification muncul (OS level)
- Notification mungkin tidak visible di browser (depends on OS)
- Check notification center / system tray
- Bisa click notifikasi untuk bring browser to foreground

**Debug:**
```javascript
// DevTools Console - Monitor background detection
let visibilityChangeCount = 0;
document.addEventListener('visibilitychange', () => {
  visibilityChangeCount++;
  console.log(`Visibility changed ${visibilityChangeCount}x:`, 
    document.visibilityState);
});

// Monitor service worker messages
navigator.serviceWorker?.controller?.postMessage({
  type: 'STORE_AUTH_TOKEN',
  token: localStorage.getItem('auth_token') // Jika ada
});
```

### Scenario C: Background Sync (Network Restored)

**Setup:**
1. Create reminder dengan time = sekarang + 3 menit
2. Go to DevTools → Network → Throttle ke "Offline"
3. Wait sampai reminder time pass
4. Restore network (change back to "Online" atau reload)

**Expected:**
- Saat network restored, service worker background sync triggered
- Notification akan shown oleh service worker
- Check notification dalam system notification center

**Debug:**
```javascript
// DevTools Console
// Check background sync API support
const registration = await navigator.serviceWorker.ready;
console.log('Has sync:', 'sync' in registration);

// Get pending syncs
if ('sync' in registration) {
  const tags = await registration.sync.getTags();
  console.log('Pending syncs:', tags);
}

// Manually trigger sync
await registration.sync.register('sync-reminders');
console.log('Manual sync registered');
```

### Scenario D: Periodic Sync (Browser Closed)

**Setup:**
1. Create reminder dengan time = sekarang + 15 menit
2. Close browser completely (atau close all tabs)
3. Wait 15 menit +
4. Reopen browser

**Expected:**
- Service worker periodic sync trigger (kalau supported)
- Notification might show saat browser reopened
- Depends on OS dan browser support

**Note:** 
- Periodic sync support varies by browser:
  - Chrome/Edge: ✅ Full support
  - Firefox: ✅ Full support  
  - Safari: ❌ Limited/No support
  - Mobile browsers: Vary by device

**Debug:**
```javascript
// DevTools Console - Check periodic sync
const registration = await navigator.serviceWorker.ready;
if ('periodicSync' in registration) {
  try {
    const tags = await registration.periodicSync.getTags();
    console.log('Periodic sync tags:', tags);
  } catch(e) {
    console.log('Periodic sync not supported:', e);
  }
}
```

## Debugging Tools

### 1. Service Worker Inspector

**Open:**
```
DevTools → Application → Service Workers
```

**Check:**
- ✓ Service worker status: "activated and running"
- ✓ Scope: http://localhost:3000/ or https://domain.com/
- ✓ Version: Latest hash

**Actions:**
- Click "Update" to refresh service worker
- Check "Update on reload" for auto-update
- Use "Unregister" to remove (if needed for testing)

### 2. Service Worker Console Logs

**Open:**
```
DevTools → Application → Service Workers
→ Click on service worker
→ New window opens with service worker console
```

**Monitor:**
```
[App] Service Worker registered successfully
[Reminders] Starting reminder check...
[SW] Starting background reminder check...
[SW] Found reminders: 2
[SW] Showing notification for: Math
[SW] Notification clicked: view
```

### 3. Network Activity

**Open:**
```
DevTools → Network
```

**Monitor:**
- `/api/reminders` - Reminder check requests
- Filter untuk see background sync requests (might be hidden)
- Check request headers untuk see if auth token sent

### 4. Notification API Calls

**Open:**
```
DevTools → Console
```

**Test:**
```javascript
// Check permission
console.log('Notification.permission:', Notification.permission);
// Output: 'granted', 'denied', or 'default'

// Request permission manually
Notification.requestPermission().then(perm => {
  console.log('Permission result:', perm);
});

// Test showing native notification
if (Notification.permission === 'granted') {
  const n = new Notification('Test Title', {
    body: 'Test Body',
    tag: 'test-1',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  });
  
  n.onclick = () => console.log('Notification clicked!');
  n.onclose = () => console.log('Notification closed!');
}
```

## Performance Metrics

### Reminder Check Performance

**Monitor:**
```javascript
// Add to useReminderChecker.ts
const start = performance.now();
// ... check reminders ...
const duration = performance.now() - start;
console.log(`Reminder check took ${duration.toFixed(2)}ms`);
```

**Target:**
- ✓ < 500ms untuk check reminders
- ✓ < 100ms untuk filter pending reminders
- ✓ < 50ms untuk show notification

### API Response Time

**Monitor:**
```javascript
// In Network tab
// Check /api/reminders response time
// Should be < 200ms
```

### Service Worker Performance

**Monitor:**
```
DevTools → Performance
→ Start recording
→ Trigger background sync
→ Stop recording
→ Check timeline untuk service worker operations
```

## Common Issues & Solutions

### Issue 1: Notifications Not Showing

**Symptoms:**
- Reminder time passed tapi no notification

**Checklist:**
```
□ Permission granted? Notification.permission === 'granted'
□ Service Worker registered? navigator.serviceWorker.controller exists
□ Network online? navigator.onLine === true
□ Reminder actually pending? Check database
□ Time correct? Check server time vs client time
□ Tab visible? Check document.visibilityState
```

**Solution:**
```javascript
// Complete diagnostic
const diag = {
  permission: Notification.permission,
  swActive: !!navigator.serviceWorker.controller,
  online: navigator.onLine,
  tabVisible: document.visibilityState,
  time: new Date().toISOString(),
};
console.table(diag);

// Check service worker logs
const reg = await navigator.serviceWorker.ready;
console.log('SW state:', reg.active?.state);
```

### Issue 2: Duplicate Notifications

**Symptoms:**
- Same reminder notification shows multiple times

**Cause:**
- Multiple service workers active
- Multiple check cycles in rapid succession
- `tag` property not preventing deduplication

**Solution:**
```javascript
// In service worker, verify tag is unique per reminder
const tag = reminder.id; // Must be unique and consistent
await self.registration.showNotification(title, {
  tag: tag, // This prevents duplicates
  // ... other options
});
```

### Issue 3: Service Worker Not Updating

**Symptoms:**
- Changes to sw.js tidak terlihat
- Old notifications still show old format

**Solution:**
```javascript
// Option 1: Manual update
const reg = await navigator.serviceWorker.ready;
await reg.update();

// Option 2: Force unregister & re-register
await navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
// Reload page

// Option 3: Hard refresh
// Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac)
```

### Issue 4: Background Sync Not Triggering

**Symptoms:**
- Service worker tidak run saat browser closed
- No notifications bahkan di database ada pending

**Possible Causes:**
1. Browser doesn't support periodic sync (Safari)
2. HTTPS not enabled (only works on HTTPS + localhost)
3. Periodic sync not registered properly
4. Browser didn't sync within 15-minute window

**Check:**
```javascript
// Check support
const registration = await navigator.serviceWorker.ready;
const hasPeriodicSync = 'periodicSync' in registration;
const hasSync = 'sync' in registration;
console.log({ hasPeriodicSync, hasSync });

// Check registered tags
if (hasPeriodicSync) {
  const tags = await registration.periodicSync.getTags();
  console.log('Periodic sync tags:', tags); // Should include 'check-reminders'
}
```

## Best Practices

### 1. Always Request Permission
```typescript
// Don't assume permission, always ask
const granted = await requestPermission();
if (!granted) {
  console.log('User denied notification permission');
  // Fall back to in-app only
}
```

### 2. Use Unique Tags
```typescript
// Prevent duplicate notifications
const tag = `reminder-${reminder.id}`;
await registration.showNotification(title, { tag });
```

### 3. Test Across Browsers
```
Chrome:    ✅ Full support (desktop & mobile)
Firefox:   ✅ Full support (desktop & mobile)
Safari:    ❌ Limited support (no periodic sync)
Edge:      ✅ Full support
```

### 4. Monitor Error Logs
```typescript
// Always log errors untuk debugging
try {
  await checkReminders();
} catch (error) {
  console.error('[Reminders] Error:', error);
  // Could also send to error tracking service
}
```

### 5. Respect User Preferences
```
- Provide settings untuk enable/disable notifications
- Allow custom notification timing
- Respect system notification settings
- Provide "do not disturb" options
```

## Testing Checklist

- [ ] Permission request works
- [ ] In-app notifications show
- [ ] Native notifications show (tab background)
- [ ] Service Worker registered successfully
- [ ] Background sync triggered correctly
- [ ] Periodic sync (if browser supports)
- [ ] No duplicate notifications
- [ ] Reminders mark as sent
- [ ] Notification click navigates correctly
- [ ] Works on mobile devices
- [ ] Works after browser restart
- [ ] Works with slow network
- [ ] Works offline then back online

## Support Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Web Notifications | ✅ | ✅ | ✅ | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ✅ | ❌ | ✅ |
| Periodic Sync | ✅ | ✅ | ❌ | ✅ |
| Push Notifications | ✅ | ✅ | ❌ | ✅ |

**Legend:**
- ✅ Full support
- ⚠️ Partial support
- ❌ No support

---

Happy testing! 🎉
