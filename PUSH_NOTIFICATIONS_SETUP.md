# Push Notifications Implementation Guide

## Overview

Lecturely now uses **Web Push API** untuk send reminders langsung ke browser, bahkan ketika app tidak dibuka. Ini jauh lebih baik daripada polling.

**Flow:**
```
User opens web
    ↓
Click "Allow" → permission granted
    ↓
Service Worker di-register
    ↓
Push subscription dibuat & disimpan ke DB (push_subscriptions table)
    ↓
Server-side reminder check (cron / /api/reminders/check)
    ↓
Reminder waktu sudah tiba?
    ↓
Server call /api/send-notification
    ↓
Web Push Service kirim ke browser via endpoint
    ↓
Service Worker "bangun" → showNotification() 
    ↓
Notifikasi muncul di system tray ✅
```

---

## Architecture

### 1. Frontend (useServiceWorker)
- Service Worker registration
- Request notification permission (`Notification.requestPermission()`)
- Subscribe to push (`registration.pushManager.subscribe()`)
- Send subscription to `/api/subscribe` endpoint
- Subscription stored in IndexedDB by browser

### 2. Database (push_subscriptions table)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- endpoint: TEXT UNIQUE (push service endpoint)
- auth_key: TEXT (authentication key - base64)
- p256dh_key: TEXT (encryption key - base64)
- created_at: TIMESTAMP
- last_used: TIMESTAMP
- is_active: BOOLEAN
```

### 3. Backend APIs

#### POST /api/subscribe
Save browser subscription to database

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://push.example.com/v1/...",
    "keys": {
      "auth": "base64-encoded-auth-key",
      "p256dh": "base64-encoded-p256dh-key"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... subscription ... }
}
```

#### POST /api/send-notification
Send push notification to all user subscriptions

**Request (from server/cron):**
```json
{
  "userId": "user-id",
  "title": "📚 Review Reminder: Math",
  "body": "Time to review: Chapter 5 Notes",
  "tag": "reminder-id",
  "data": {
    "url": "/transcription/recording-id/subject-id",
    "reminderId": "reminder-id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "message": "Sent to 2/2 subscriptions"
}
```

#### POST /api/reminders/check
Server-side check for pending reminders (can be called by cron or client)

**Behavior:**
- Get all pending reminders (sent = false)
- Filter reminders ready to send (within ±5 minutes of reminder_time)
- Call `/api/send-notification` for each
- Mark reminder as sent after successful notification

---

## Setup Steps

### 1. Environment Variables (Already Done ✅)

```env
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIjbvpG4I1ohyE2sqHG-EHi3FPWCuuatXDGrrQ2VgmqfVgdmdZ0aVwvBLrxLjLpogO_92UJaBiO4zLNnRn-vQJA
VAPID_PRIVATE_KEY=p-PFUjlH9wRER2Xt1ozoP77jrPJ4VvJyLU6kVgzTuJw
VAPID_SUBJECT=mailto:lecturely@example.com
CRON_SECRET=your-secret-key-for-cron-jobs
```

### 2. Database Migration (Already Done ✅)

Run this SQL in Supabase:
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
```

### 3. Service Worker (Already Done ✅)

The service worker (`public/sw.js`) listens for push events:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      data: data.data,
      actions: [
        { action: 'view', title: 'View Now' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  if (event.action === 'view' && event.notification.data.url) {
    clients.openWindow(event.notification.data.url);
  }
  event.notification.close();
});
```

---

## How to Use

### For Users

1. **First time opening app:**
   - Browser asks "Allow notifications from Lecturely?"
   - Click "Allow" (or "Allow on this site")
   - Subscription automatically saved

2. **Set a reminder:**
   - Go to a recording → click "Set Reminder"
   - Choose reminder time (e.g., "1 hour before review")
   - Reminder scheduled ✅

3. **Even if app is closed:**
   - Server checks pending reminders periodically
   - When time arrives, push notification sent
   - Notifikasi appears di system tray
   - Click to view recording

### For Developers

**To trigger reminders manually (testing):**

```bash
# Check pending reminders for a user
curl -X POST http://localhost:3000/api/reminders/check \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"

# Send notification immediately
curl -X POST http://localhost:3000/api/send-notification \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "title": "Test Notification",
    "body": "This is a test",
    "tag": "test-123"
  }'
```

---

## Cron Job Setup (Production)

To automatically check reminders, setup a cron job that calls `/api/reminders/check` periodically.

**Using a service like EasyCron or AWS EventBridge:**

```bash
# Every 5 minutes, check reminders
POST https://your-app.vercel.app/api/reminders/check
Header: x-api-secret: your-cron-secret
```

**Or using Node.js (node-cron):**

```typescript
import cron from 'node-cron';

// Every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/reminders/check', {
      method: 'POST',
      headers: {
        'x-api-secret': process.env.CRON_SECRET,
        'Content-Type': 'application/json'
      }
    });
    console.log('Reminder check completed');
  } catch (error) {
    console.error('Cron job error:', error);
  }
});
```

---

## Browser Support

| Browser | Push Notifications | Status |
|---------|-------------------|--------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Edge | ✅ | Full support |
| Safari (iOS/macOS) | ❌ | Not supported |
| Opera | ✅ | Full support |

**Note:** Push API requires HTTPS in production. Localhost works for development.

---

## Testing

### Manual Testing Steps:

1. **Open browser DevTools** (F12)
2. **Go to Application → Service Workers**
   - Verify service worker is registered and active
3. **Go to Application → Manifest**
   - Check that manifest loads correctly
4. **Set a test reminder:**
   - Create a recording
   - Set reminder for 1 minute from now
5. **Call check endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/reminders/check \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
6. **Check console logs:**
   - Should show `[Reminders] Sending push notification...`
7. **Look for notification:**
   - Should appear in system notification area
   - On macOS: Check Notification Center
   - On Windows: Check system tray

### Debugging:

**Check if subscription saved:**
```bash
# In Supabase SQL editor
SELECT COUNT(*) FROM push_subscriptions WHERE user_id = 'your-user-id';
```

**Check service worker logs:**
```javascript
// In DevTools Console
navigator.serviceWorker.controller.postMessage({
  type: 'DEBUG_SUBSCRIPTIONS'
});
```

**Verify VAPID keys:**
```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
// Should output the public key
```

---

## Troubleshooting

### "Permission denied" error
- **Cause:** Browser blocking notifications
- **Fix:** Go to browser settings → Site permissions → Notifications → Allow

### Notification not appearing
- **Check:** Is service worker active? (`Application → Service Workers`)
- **Check:** Did user grant permission? (`Notification.permission === 'granted'`)
- **Check:** Is subscription saved? (Query `push_subscriptions` table)
- **Check:** Did server successfully send push? (Check logs)

### "HTTPS required" error
- **Cause:** Push API only works on HTTPS (or localhost for development)
- **Fix:** Deploy to HTTPS server or test on localhost

### Notification appears but doesn't respond to clicks
- **Cause:** Service worker not handling `notificationclick` event
- **Fix:** Check `sw.js` has the event listener and it's correctly formatted

---

## Future Enhancements

1. **User Preferences:**
   - Allow users to disable notifications
   - Customize notification times (e.g., "2 hours before")
   - Do Not Disturb hours

2. **Analytics:**
   - Track notification engagement
   - Optimize send times based on user behavior
   - A/B test notification content

3. **Rich Notifications:**
   - Add thumbnail images
   - Add action buttons (Snooze, Mark as Done)
   - Custom sounds and vibration patterns

4. **Persistent Push (Server-side):**
   - Send notifications even after browser closes
   - Requires backend push subscription service
   - Uses Firebase Cloud Messaging or similar

---

## Code References

- **Frontend:** `app/hooks/useServiceWorker.ts`
- **Service Worker:** `public/sw.js`
- **API Endpoints:** `app/api/subscribe/route.ts`, `app/api/send-notification/route.ts`, `app/api/reminders/check/route.ts`
- **Database:** `create-push-subscriptions-table.sql`
- **Environment:** `.env.local` (VAPID keys, CRON_SECRET)

---

## FAQ

**Q: Will notifications work if the app is completely closed?**
A: Yes! Push notifications work even if browser is closed (on supporting browsers). The browser OS handles the notification display.

**Q: Does this work on mobile browsers?**
A: Partially. Android Chrome/Firefox support it. iOS Safari does not support Web Push API.

**Q: Can I test on localhost?**
A: Yes! Web Push API works on localhost without HTTPS. Use `localhost:3000` for testing.

**Q: What happens if the push service is down?**
A: The notification is queued by the push service and delivered when it's back online (usually within minutes).

**Q: Can I send notifications from the frontend?**
A: No. Only the server can trigger push notifications (for security reasons). The frontend can request reminders, but the server sends the actual push.

**Q: What if user has multiple devices?**
A: Each device gets its own subscription. If user has phone + laptop, they'll get notifications on both.
