# Google OAuth Setup Guide

## Setup di Google Cloud Console

### 1. Buat Project Baru (atau gunakan existing)
1. Pergi ke [Google Cloud Console](https://console.cloud.google.com/)
2. Klik dropdown project di bagian atas, lalu "New Project"
3. Beri nama project (misal: "Lecturely")
4. Klik "Create"

### 2. Enable Google+ API
1. Di sidebar, pergi ke **APIs & Services** > **Library**
2. Cari "Google+ API"
3. Klik dan enable API tersebut

### 3. Configure OAuth Consent Screen
1. Di sidebar, pergi ke **APIs & Services** > **OAuth consent screen**
2. Pilih **External** (jika untuk public) atau **Internal** (jika untuk organization)
3. Klik "Create"
4. Isi form:
   - **App name**: Lecturely
   - **User support email**: your-email@example.com
   - **App logo**: (optional)
   - **Developer contact**: your-email@example.com
5. Klik "Save and Continue"
6. Di **Scopes**, tambahkan:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
7. Klik "Save and Continue"
8. Di **Test users**, tambahkan email untuk testing (jika masih mode testing)
9. Klik "Save and Continue"

### 4. Create OAuth 2.0 Client ID
1. Di sidebar, pergi ke **APIs & Services** > **Credentials**
2. Klik "**+ Create Credentials**" > "**OAuth client ID**"
3. Pilih **Application type**: Web application
4. Beri nama: "Lecturely Web Client"
5. Di **Authorized JavaScript origins**, tambahkan:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. Di **Authorized redirect URIs**, tambahkan:
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   **Note**: Ganti `[YOUR-SUPABASE-PROJECT-REF]` dengan Project Ref dari Supabase
7. Klik "Create"
8. **SIMPAN** Client ID dan Client Secret yang muncul!

---

## Setup di Supabase Dashboard

### 1. Enable Google Provider
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Lecturely
3. Di sidebar, pergi ke **Authentication** > **Providers**
4. Scroll ke bawah, cari **Google**
5. Toggle switch untuk enable
6. Isi:
   - **Client ID**: (dari Google Cloud Console step 4)
   - **Client Secret**: (dari Google Cloud Console step 4)
7. Klik "Save"

### 2. Configure Site URL
1. Masih di **Authentication** settings
2. Pergi ke tab **URL Configuration**
3. Isi:
   - **Site URL**: `http://localhost:3000` (untuk dev) atau `https://your-domain.com` (untuk prod)
   - **Redirect URLs**: Tambahkan URLs yang diizinkan untuk redirect setelah auth:
     ```
     http://localhost:3000
     http://localhost:3000/**
     https://your-domain.com
     https://your-domain.com/**
     ```
4. Klik "Save"

---

## Testing Google Sign In

### Development (localhost)
1. Jalankan app: `npm run dev`
2. Buka `http://localhost:3000/login`
3. Klik "Continue with Google"
4. Akan redirect ke Google login
5. Pilih akun Google
6. Akan redirect kembali ke app dan otomatis login

### Production
1. Deploy app ke hosting (Vercel, Netlify, dll)
2. Update **Authorized JavaScript origins** dan **Redirect URIs** di Google Cloud Console dengan domain production
3. Update **Site URL** dan **Redirect URLs** di Supabase dengan domain production
4. Test login dengan Google

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solusi**: 
- Pastikan redirect URI di Google Cloud Console sudah sesuai
- Format: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- Cek di Supabase Dashboard > Settings > API > Project URL

### Error: "Access blocked: This app's request is invalid"
**Solusi**:
- Pastikan OAuth Consent Screen sudah di-publish (jika External)
- Atau tambahkan email testing di Test Users (jika masih mode Testing)

### User tidak ter-redirect setelah login
**Solusi**:
- Pastikan Site URL di Supabase sudah benar
- Pastikan Redirect URLs include domain yang benar
- Check console browser untuk error

### Email tidak muncul setelah Google Sign In
**Solusi**:
- Pastikan scope `userinfo.email` sudah ditambahkan di OAuth Consent Screen
- Request email scope explicitly jika perlu

---

## Security Tips

1. **Jangan share Client Secret** - Simpan di environment variables
2. **Gunakan HTTPS** di production
3. **Limit redirect URIs** - Hanya tambahkan domain yang dipercaya
4. **Monitor usage** - Cek Google Cloud Console untuk suspicious activity
5. **Rotate credentials** - Jika Client Secret leaked, generate baru

---

## Next Steps

Setelah setup berhasil:
- [ ] Test login dengan multiple Google accounts
- [ ] Test signup dengan Google
- [ ] Verify user data tersimpan dengan benar
- [ ] Test logout functionality
- [ ] Deploy ke production dan test
- [ ] Setup email notifications (optional)
- [ ] Add more OAuth providers (GitHub, Facebook, dll)

---

## Reference Links

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://support.google.com/cloud/answer/6158849)
- [Next.js + Supabase Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
