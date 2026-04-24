# Quick Start: Migrasi Data ke Multi-User

## Langkah Cepat (5 Menit)

### 1. Login & Dapatkan User ID
```
1. Login ke app kamu
2. F12 (buka console)
3. Paste & Enter:
   (await supabase.auth.getUser()).data.user.id
4. Copy UUID yang muncul
```

### 2. Update Migration Script
```
1. Buka: migration-assign-user.sql
2. Cari baris 18: target_user_id UUID := 'YOUR_USER_ID_HERE';
3. Replace dengan UUID kamu
4. Save
```

### 3. Jalankan di Supabase
```
1. Buka: https://supabase.com/dashboard
2. Pilih project
3. Klik: SQL Editor
4. Copy-paste isi migration-assign-user.sql
5. Run
6. Lihat output: "Updated X recordings", etc.
```

### 4. Test
```
1. Refresh app
2. Data lama kamu harus muncul
3. Coba create recording baru
4. Login dengan akun lain → data terpisah
```

## Troubleshooting

### Data tidak muncul?
```sql
-- Cek di Supabase Table Editor (tabel recordings):
SELECT id, title, user_id FROM recordings LIMIT 10;

-- Pastikan user_id match dengan user ID kamu
```

### Mau reset semua?
```sql
-- WARNING: Hapus SEMUA data
TRUNCATE subjects, recordings, reminders CASCADE;
```

### Error 401 Unauthorized?
- Logout → Login lagi
- Clear cache browser
- Cek token di localStorage (DevTools → Application → Local Storage)

## File Penting

- `migration-assign-user.sql` - Script untuk assign data lama
- `MIGRATION_GUIDE.md` - Panduan lengkap
- `MULTI_USER_IMPLEMENTATION.md` - Technical details
- `app/lib/auth-helpers.ts` - Auth utilities
- `app/lib/fetch-with-auth.ts` - API call wrappers

## Yang Berubah

### ✅ API Routes
Semua API sekarang butuh authentication. Otomatis handle di `fetchWithAuth()`.

### ✅ Frontend
Semua fetch calls sekarang pakai `fetchWithAuth()` atau `fetchWithAuthFormData()`.

### ✅ Database
RLS aktif → data otomatis filter by user.

### ✅ Services
Services sekarang accept/use `userId`.

## Testing Multi-User

```
1. Login dengan akun kamu → buat recording "Test A"
2. Logout
3. Register akun baru → login
4. Buat recording "Test B"
5. Cek: hanya "Test B" yang terlihat
6. Login lagi dengan akun pertama
7. Cek: hanya "Test A" yang terlihat
```

## Rollback (Kalau Ada Masalah)

```bash
# Git revert
git log --oneline
git revert <commit-hash>

# Atau manual:
# 1. Checkout ke commit sebelumnya
# 2. Deploy ulang

# Database tetap aman (user_id bisa NULL)
```

---

**Selesai!** Data kamu aman, tidak hilang, dan sekarang support multi-user. 🎉
