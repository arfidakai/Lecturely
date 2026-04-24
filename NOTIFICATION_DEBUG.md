# 🔔 Notification Debugging Guide

## Kenapa Notifikasi Tidak Muncul?

### 1. Check Browser Permission
Buka browser console dan ketik:
```javascript
Notification.permission
```
Harus return: `"granted"`

### 2. Check macOS Notification Settings
**System Settings → Notifications**
- Cari **Chrome/Safari/Browser** yang kamu pakai
- Pastikan:
  - ✅ Allow Notifications: ON
  - ✅ Show in Notification Center: ON
  - ✅ Show previews: Always
  - ✅ Play sound for notifications: ON (optional)

### 3. Check Browser Notification Settings
**Chrome:**
- `chrome://settings/content/notifications`
- Pastikan `localhost:3000` ada di "Allowed"

**Safari:**
- Safari → Settings → Websites → Notifications
- Pastikan `localhost` diizinkan

### 4. Check Do Not Disturb
**macOS:**
- Control Center → Focus → Do Not Disturb: OFF

### 5. Test Manual Notification
Buka Console dan jalankan:
```javascript
new Notification('Test', { body: 'Testing 123' })
```

Kalau ini muncul = sistem kerja, kalau tidak = ada masalah di browser/OS settings.

### 6. Common Issues

#### Issue: Permission = "granted" tapi notification tidak muncul
**Solution:**
- Restart browser
- Clear browser cache
- Check macOS Do Not Disturb
- Check browser minimized/background (some browsers block notifications when minimized)

#### Issue: Notification muncul tapi langsung hilang
**Solution:**
- Sudah ada auto-close 10 detik di code
- Ini normal behavior

#### Issue: Permission = "default" atau "denied"
**Solution:**
- Clear site data: Browser DevTools → Application → Clear site data
- Reload dan allow notifications lagi

## Current Logs Show:
✅ `[Notifications] Creating notification...`
✅ `[Notifications] Notification created successfully`
✅ API update success

➡️ **Browser berhasil create notification object**, tapi mungkin blocked di OS level atau browser settings!
