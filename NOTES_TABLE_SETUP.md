# Notes Table Setup Guide

## Status Check

Jika kamu melihat error "Failed to load notes" di aplikasi, artinya table `notes` belum ada atau RLS policy tidak tersetup dengan benar.

## How to Setup

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor (di sidebar kiri)

### Step 2: Run the SQL Script

Copy and paste seluruh kode di bawah ini ke SQL Editor, lalu klik "Run":

```sql
-- Create notes table for Lecturely App

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for notes
CREATE POLICY "Users can view their own notes" 
  ON notes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
  ON notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
  ON notes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON notes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Add trigger for updated_at (jika belum ada function)
-- CREATE TRIGGER IF NOT EXISTS update_notes_updated_at BEFORE UPDATE ON notes
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Verify

Setelah script berhasil dijalankan:
1. Go to Database → Tables di Supabase dashboard
2. Cek apakah `notes` table ada
3. Buka aplikasi dan klik button "My Notes" di homepage

## Jika Masih Error

Kemungkinan penyebab:
1. **RLS Policy tidak aktif** - Cek di Table "notes" → RLS apakah sudah "Enable RLS"
2. **User tidak authenticated** - Make sure sudah login di aplikasi
3. **Update trigger belum ada** - Jika ada error tentang `update_updated_at_column()`, comment out trigger line

## Fitur yang Akan Bekerja Setelah Setup

✅ Lihat semua saved notes dari recordings
✅ Akses notes dari homepage button "My Notes"
✅ Tambah notes saat menyeleksi transcription highlights
✅ Delete, update, dan share notes
✅ PDF export dari note detail
