# Authentication System Documentation

## Overview
Lecturely sekarang dilengkapi dengan sistem authentication lengkap menggunakan Supabase Auth.

## Fitur yang Tersedia

### 1. **Login** (`/login`)
- Email & password authentication
- Error handling
- Auto redirect ke homepage setelah login sukses
- Link ke sign up page

### 2. **Sign Up** (`/signup`)
- Register dengan email, password, dan full name
- Password validation (minimal 6 karakter)
- Confirm password
- Email verification (otomatis dari Supabase)
- Success message dan auto redirect ke login

### 3. **Logout**
- Button logout tersedia di homepage (klik icon user di kanan atas)
- User menu menampilkan email dan nama user
- Logout akan redirect ke login page

### 4. **Protected Routes**
- Homepage dan semua routes utama sudah protected
- User yang belum login akan auto redirect ke `/login`
- Loading state saat checking authentication

## Cara Menggunakan

### Untuk Protect Route Baru
Ada 2 cara:

#### Cara 1: Manual di component
```tsx
"use client";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return <div>Protected Content</div>;
}
```

#### Cara 2: Menggunakan HOC `withAuth`
```tsx
import withAuth from "../components/withAuth";

function MyPage() {
  return <div>Protected Content</div>;
}

export default withAuth(MyPage);
```

### Mengakses User Data
```tsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Name: {user?.user_metadata?.full_name}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

## Setup Supabase Auth (Jika Belum)

1. Di Supabase Dashboard, enable Email Auth:
   - Go to Authentication > Providers
   - Enable Email provider
   - Set email templates (optional)

2. Configure redirect URLs:
   - Go to Authentication > URL Configuration
   - Add your app URLs (localhost:3000 untuk development)

3. Row Level Security (RLS):
   Pastikan tables punya policy untuk authenticated users:
   ```sql
   -- Enable RLS
   ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
   
   -- Policy untuk authenticated users
   CREATE POLICY "Users can view their own data"
     ON subjects FOR SELECT
     USING (auth.uid() IS NOT NULL);
   
   CREATE POLICY "Users can insert their own data"
     ON subjects FOR INSERT
     WITH CHECK (auth.uid() IS NOT NULL);
   
   -- Ulangi untuk table lain
   ```

## Struktur Files

```
app/
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── components/
│   ├── withAuth.tsx             # HOC untuk protected routes
│   └── Homepage.tsx             # Updated dengan logout button
├── login/
│   └── page.tsx                 # Login page
├── signup/
│   └── page.tsx                 # Sign up page
├── layout.tsx                   # Wrapped dengan AuthProvider
└── page.tsx                     # Protected homepage
```

## Flow Diagram

```
User Access → Check Auth State
              ├─ Not Logged In → Redirect to /login
              └─ Logged In → Show Protected Content

Login Page → Enter Credentials → Supabase Auth
              ├─ Success → Redirect to /
              └─ Error → Show Error Message

Sign Up → Enter Details → Supabase Auth
              ├─ Success → Show Success → Redirect to /login
              └─ Error → Show Error Message
```

## Tips
- Email verification bisa dimatikan di Supabase dashboard jika untuk development
- User data disimpan di `user.user_metadata`
- Session otomatis di-maintain oleh Supabase
- Token disimpan di localStorage secara otomatis

## Next Steps (Optional)
- [ ] Social login (Google, GitHub, dll)
- [ ] Forgot password functionality
- [ ] Profile page untuk edit user data
- [ ] Email verification reminder
- [ ] Remember me functionality
