-- Add transcription_id column to highlights table to support highlighting transcriptions

-- Add the new column (make it nullable first)
ALTER TABLE highlights 
ADD COLUMN transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_highlights_transcription_id ON highlights(transcription_id);

-- Note: summary_id should still be nullable to support both summaries and transcriptions
-- Highlights can now be associated with either summary_id OR transcription_id (not both)
