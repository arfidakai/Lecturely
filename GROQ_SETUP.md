# Groq Setup Guide (FREE Transcription!)

## Why Groq?
- ✅ **100% FREE** with generous rate limits
- ✅ **Super fast** (faster than OpenAI)
- ✅ Uses the same Whisper model as OpenAI
- ✅ No credit card required

## Setup Steps:

### 1. Get Groq API Key (Free)
1. Go to: https://console.groq.com
2. Sign up / Login (free account)
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy the API key

### 2. Add to .env.local
```env
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Features Implemented:

### 1. ✅ Groq Transcription
- Uses `whisper-large-v3-turbo` (fastest model)
- Supports Indonesian by default (`language: 'id'`)
- Change to `'en'` for English in `/api/transcribe/route.ts`

### 2. ✅ Auto-Delete Audio After Transcription
- Audio file is deleted from Supabase Storage after successful transcription
- Saves storage space (important for free tier!)
- Transcription text is kept in database
- Recording metadata is kept, only audio file is removed

## How It Works:

1. **Record audio** → Saved to Supabase Storage
2. **Click "Transcribe Now"**
3. **Groq transcribes** the audio (FREE & fast!)
4. **Save transcription** to database
5. **Delete audio file** automatically (save storage)
6. **Show transcription** to user

## Storage Benefits:

**Before (keeping audio):**
- 1 hour recording = ~720 MB
- Free tier (1 GB) = ~1.3 hours total

**After (delete after transcribe):**
- 1 hour transcription text = ~100 KB
- Free tier (1 GB) = ~10,000+ hours of transcriptions!

## Rate Limits (Groq Free Tier):

- **6,000 requests per minute** (RPM)
- **1,000 requests per day** (RPD)
- More than enough for most use cases!

## Troubleshooting:

### Error: "Missing GROQ_API_KEY"
- Make sure you added `GROQ_API_KEY` to `.env.local`
- Restart dev server after adding

### Error: "Transcription failed"
- Check Groq console for API key validity
- Check audio file format (should be WebM)
- Check network connection

### Audio still in storage after transcription
- Check console logs for deletion errors
- Verify storage bucket policies allow deletion
- Audio deletion is automatic but logged to console

## Optional: Keep Audio Files

If you want to keep audio files, comment out the deletion code in `/api/transcribe/route.ts`:

```typescript
// Delete audio file from storage to save space
// try {
//   console.log('Deleting audio file from storage:', recording.audio_url);
//   await storageService.deleteAudio(recording.audio_url);
//   console.log('Audio file deleted successfully');
// } catch (deleteError) {
//   console.error('Failed to delete audio file:', deleteError);
// }
```

## Next Steps:

After transcription works, you can add:
- AI Summary generation (also can use Groq for free!)
- Search through transcriptions
- Edit transcriptions
- Export transcriptions to PDF/Word
