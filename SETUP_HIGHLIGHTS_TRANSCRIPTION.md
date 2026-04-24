# Setup Highlights for Transcription Page

## 🚨 Status: Database Migration Required

The highlight feature for transcription page requires a database schema update. Follow these steps to enable it:

## Step-by-Step Setup

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your "lecturely" project
- Navigate to **SQL Editor**

### 2. Run the Migration
Copy and paste the following SQL into the SQL Editor:

```sql
-- Add transcription_id column to highlights table to support highlighting transcriptions

-- Add the new column (nullable, will be used for transcription highlights)
ALTER TABLE highlights 
ADD COLUMN transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_highlights_transcription_id ON highlights(transcription_id);

-- Note: Both summary_id and transcription_id can be NULL, but one should always be set
-- This allows highlights to work with either summaries OR transcriptions
```

### 3. Execute the Query
- Click the **Execute** button or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
- Wait for the query to complete (should show no errors)
- You should see: "Successfully executed 2 statements"

### 4. Verify the Changes
Run this query to confirm the new column exists:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'highlights'
ORDER BY ordinal_position;
```

You should see a new row with:
- column_name: `transcription_id`
- data_type: `uuid`
- is_nullable: `YES`

### 5. Test the Feature
1. Return to the app
2. Create a new recording
3. Transcribe it
4. Try selecting text and adding a highlight
5. You should see a green toast: "✅ Text highlighted successfully"

## ✅ What Gets Enabled

Once migration is complete:
- ✅ Users can select and highlight text in transcriptions
- ✅ Choose from 7 colors (yellow, orange, red, green, blue, purple, pink)
- ✅ Highlights are saved to database with RLS protection
- ✅ Hover over highlights to delete them
- ✅ Toast notifications for all actions
- ✅ Highlights persist across sessions

## 🔒 RLS (Row Level Security)

All highlight operations respect RLS policies:
- Users can only view their own highlights
- Users can only modify their own highlights
- Users can only delete their own highlights
- Transcription ID is automatically associated with correct user

## 📊 Database Schema

After migration, the `highlights` table structure:

```
id: UUID (Primary Key)
summary_id: UUID (Foreign Key → summaries) [nullable]
transcription_id: UUID (Foreign Key → transcriptions) [nullable] ← NEW
user_id: UUID (Foreign Key → auth.users)
start_offset: INTEGER (character position of highlight start)
end_offset: INTEGER (character position of highlight end)
color: VARCHAR (color name)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## 🐛 Troubleshooting

### Still Getting 400 Error?
- Make sure you ran the migration SQL correctly
- Check that the `transcription_id` column exists in Supabase
- Try refreshing the page (Cmd+R or Ctrl+R)
- Check browser console for more detailed error messages

### Highlights Not Showing?
- Ensure transcription ID is being returned from API
- Check Network tab in DevTools to verify `/api/transcriptions/{id}` response includes `id` field
- Verify RLS policies are correct in Supabase

### Need Help?
1. Check the SQL Editor history in Supabase to see executed queries
2. Look for error messages in the "Output" panel
3. Verify all columns and indexes exist with the verification query above

## 📝 Related Files

- Feature implementation: `app/transcription/[recordingId]/[subjectId]/page.tsx`
- API endpoint: `app/api/transcriptions/[recordingId]/route.ts`
- Utilities: `app/lib/highlightUtils.ts`
- Migration: `add-transcription-id-to-highlights.sql`
- Documentation: `HIGHLIGHT_FEATURE_TRANSCRIPTION.md`

---

**Once migration is complete, the feature will work seamlessly! 🎉**
