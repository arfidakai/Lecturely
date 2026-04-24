# Data Migration Guide

## Cara Migrasi Data Lama ke User Kamu

Data yang sudah ada di database (recordings, subjects, reminders) perlu di-assign ke user ID kamu supaya bisa muncul setelah login.

### Langkah 1: Dapatkan User ID Kamu

1. Login ke aplikasi Lecturely
2. Buka browser console (F12 atau Cmd+Option+I di Mac)
3. Jalankan command ini di console:

```javascript
(await supabase.auth.getUser()).data.user.id
```

4. Copy UUID yang muncul (contoh: `12345678-1234-1234-1234-123456789abc`)

### Langkah 2: Update Migration Script

1. Buka file `migration-assign-user.sql`
2. Cari baris: `target_user_id UUID := 'YOUR_USER_ID_HERE';`
3. Replace `YOUR_USER_ID_HERE` dengan User ID yang kamu copy tadi
4. Save file

### Langkah 3: Jalankan Migration Script

1. Buka Supabase Dashboard (https://supabase.com/dashboard)
2. Pilih project kamu
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste isi file `migration-assign-user.sql` yang sudah kamu update
6. Klik **Run** atau tekan Cmd/Ctrl + Enter

### Langkah 4: Verifikasi

Setelah migration berhasil, kamu akan melihat output seperti:

```
Updated X subjects
Updated Y recordings
Updated Z reminders
Migration completed successfully!
```

Dan tabel verifikasi akan menampilkan jumlah data yang sudah punya `user_id`.

### Troubleshooting

**Error: User ID does not exist**
- Pastikan kamu sudah login dan user ID yang kamu copy benar
- Coba logout dan login lagi, lalu dapatkan user ID baru

**Data tidak muncul setelah migration**
- Pastikan RLS policies sudah aktif di Supabase
- Clear cache browser atau coba hard refresh (Ctrl+Shift+R)
- Logout dan login kembali

**Data tetap tidak muncul**
- Cek di Supabase Table Editor, pastikan kolom `user_id` sudah terisi
- Pastikan user ID di tabel sama dengan user ID kamu saat login

## Alternative: Reset Data

Jika kamu mau mulai fresh (hapus semua data lama), kamu bisa jalankan:

```sql
-- WARNING: This will delete ALL data!
TRUNCATE subjects CASCADE;
TRUNCATE recordings CASCADE;
TRUNCATE reminders CASCADE;
```

Tapi **HATI-HATI**: ini akan menghapus semua data, tidak bisa dikembalikan!
