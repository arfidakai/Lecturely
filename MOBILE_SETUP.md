# 📱 Mobile Notifications Setup Guide

## Cara Install Lecturely sebagai PWA di HP

### iOS (iPhone/iPad):

1. **Buka di Safari** (harus Safari, bukan Chrome)
2. Buka `https://your-domain.com` atau `localhost:3000`
3. Tap tombol **Share** (ikon kotak dengan panah ke atas)
4. Scroll ke bawah, tap **"Add to Home Screen"**
5. Tap **"Add"**
6. Icon Lecturely akan muncul di home screen

### Android:

1. **Buka di Chrome**
2. Buka `https://your-domain.com` atau IP address HP
3. Tap menu (3 titik di kanan atas)
4. Tap **"Add to Home screen"** atau **"Install app"**
5. Tap **"Install"**
6. Icon Lecturely akan muncul di home screen

## Setup Notifications:

### Setelah Install PWA:

1. **Buka app dari home screen**
2. **Allow notifications** saat diminta
3. **Test notification** dengan klik tombol "Test 🔔"
4. **Buat reminder** untuk test notification bekerja

### Notification Features:

✅ **In-app notifications** - Muncul saat app dibuka
✅ **Native notifications** - Muncul via service worker
✅ **Background notifications** - Bekerja saat app di-minimize (tergantung browser)
✅ **Click to open** - Tap notification untuk buka recording

## Troubleshooting:

### Notification tidak muncul di HP:

1. **Check phone notification settings:**
   - Settings → Notifications
   - Cari app "Lecturely" atau browser
   - Enable notifications

2. **Check Do Not Disturb:**
   - Pastikan DND mode OFF

3. **Re-allow permissions:**
   - Settings → Apps → Lecturely/Chrome → Permissions
   - Enable Notifications

4. **Keep app running in background:**
   - Beberapa phone membatasi background process
   - Add Lecturely ke "Protected apps" atau "Battery optimization whitelist"

### iOS Limitations:

⚠️ iOS Safari memiliki batasan untuk background notifications
- Notifications hanya muncul **saat app dibuka** di background
- Tidak ada true background notifications tanpa server push
- Workaround: Keep app tab open di Safari

### Android:

✅ Full support untuk background notifications
✅ Service worker dapat trigger notifications saat app closed
✅ Reliable notification delivery

## Advanced: Server Push Notifications (Optional)

Untuk notifications yang bekerja saat app benar-benar closed, perlu implement:

1. **Firebase Cloud Messaging (FCM)** atau **Web Push**
2. **Backend service** untuk send push notifications
3. **Push subscription** di client

Fitur ini akan memerlukan:
- Push API credentials
- Backend endpoint untuk trigger push
- Subscription management

*Current implementation: In-app + Service Worker notifications (works when app is open or minimized)*
