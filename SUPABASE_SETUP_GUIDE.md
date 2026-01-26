# Supabase Setup Guide

## ✅ Completed Steps
- [x] Supabase project created
- [x] Environment variables configured (.env.local)
- [x] Database schema designed (supabase-setup.sql)
- [x] Storage service created (app/services/storageService.ts)
- [x] Recording service created (app/services/recordingService.ts)
- [x] Recording page integrated with Supabase

## 🚀 Next Steps (MUST DO)

### 1. Create Storage Bucket
1. Go to your Supabase dashboard: https://icanpxqmddlzmuehcyam.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure:
   - **Name**: `recordings`
   - **Public bucket**: Yes (enable)
   - **Allowed MIME types**: `audio/*`
   - **File size limit**: 50 MB (or adjust as needed)
5. Click **Create bucket**

### 2. Run Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Open the file `supabase-setup.sql` in this project
4. Copy all the SQL code
5. Paste it into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify no errors (you should see success messages)

### 3. Test Recording Flow
1. Make sure your dev server is running (`npm run dev`)
2. Navigate to the homepage
3. Click **Start Recording**
4. Select a subject
5. Record some audio (at least a few seconds)
6. Click **Stop** (the square button)
7. You should see "Saving recording..." message
8. After saving, you'll be redirected to the post-record page

### 4. Verify in Supabase Dashboard
**Check Storage:**
1. Go to **Storage** > **recordings**
2. You should see your audio file (format: `{userId}/{timestamp}.webm`)

**Check Database:**
1. Go to **Table Editor** > **recordings**
2. You should see a new row with:
   - `title`: Auto-generated from subject and timestamp
   - `audio_url`: Path to the storage file
   - `duration`: Recording duration in seconds
   - `subject_id`: The selected subject

## 📋 Current Features Working
- ✅ Audio recording with MediaRecorder API
- ✅ Pause/resume during recording
- ✅ Duration timer
- ✅ Save to Supabase Storage
- ✅ Save metadata to PostgreSQL database
- ✅ Subject association

## 🔄 Next Development Steps

### Phase 1: Authentication (Recommended Next)
- Replace temporary user ID with Supabase Auth
- Add login/signup pages
- Implement Row Level Security (RLS) policies

### Phase 2: Transcription
- Create API route: `app/api/transcribe/route.ts`
- Use OpenAI Whisper API to transcribe audio
- Save transcription to `transcriptions` table
- Link to recording via `recording_id`

### Phase 3: AI Summary
- Create API route: `app/api/summarize/route.ts`
- Use GPT-4 to generate summary from transcription
- Save summary to `summaries` table
- Display on note detail page

### Phase 4: Reminders
- Create reminder service
- Add UI for setting reminders
- Implement notifications (browser notifications or email)

### Phase 5: UI Polish
- Add loading states throughout
- Improve error handling and messages
- Add success animations
- Implement optimistic UI updates

## 🔧 Troubleshooting

### Recording fails to save
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure Storage bucket `recordings` exists and is public
- Check database schema is applied

### Permission errors
- Verify RLS policies are set up correctly (from SQL file)
- Check Supabase service role key if using server-side operations

### Audio playback issues
- Verify audio file uploaded to Storage
- Check `audio_url` in database matches Storage path
- Test with `downloadAudio()` function from storageService

## 📚 Helpful Resources
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

## 🔑 Environment Variables Reference
```env
NEXT_PUBLIC_SUPABASE_URL=https://icanpxqmddlzmuehcyam.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Groq API for FREE transcription (Recommended!)
GROQ_API_KEY=your_groq_api_key_here

# OpenAI API (Optional, if not using Groq)
OPENAI_API_KEY=your_openai_api_key_here
```

Note: Get **FREE Groq API key** from https://console.groq.com (no credit card needed!)
See `GROQ_SETUP.md` for detailed instructions.
