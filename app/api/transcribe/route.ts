import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { transcriptionService } from '../../services/transcriptionService';
import { recordingService } from '../../services/recordingService-server';
import { storageService } from '../../services/storageService';
import { supabaseAdmin } from '../../lib/supabase-admin';

export const maxDuration = 300;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recordingId = body.recordingId as string;

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Missing recording ID' },
        { status: 400 }
      );
    }

    console.log('Starting transcription for recording:', recordingId);

    const recording = await recordingService.getRecording(recordingId);
    
    if (!recording || !recording.audio_url) {
      return NextResponse.json(
        { error: 'Recording not found or no audio file' },
        { status: 404 }
      );
    }

    console.log('Downloading audio from storage:', recording.audio_url);
    const audioBlob = await storageService.downloadAudio(recording.audio_url);
    
    console.log('Audio blob size:', audioBlob.size, 'bytes');
    
    // Validasi: audio minimal 1KB
    if (audioBlob.size < 1000) {
      return NextResponse.json(
        { error: 'Audio file is too small or corrupted. Please record again.' },
        { status: 400 }
      );
    }
    
    const audioFile = new File([audioBlob], 'recording.webm', { 
      type: 'audio/webm;codecs=opus' 
    });
    
    console.log('Audio file created. Size:', audioFile.size, 'bytes');
    
    console.log('Sending to Groq Whisper API...');
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo', 
      language: 'id', 
      response_format: 'json',
    });

    console.log('Transcription completed. Text length:', transcription.text.length);

    const transcriptionData = await transcriptionService.createTranscription({
      recordingId,
      text: transcription.text,
      timestamp: 0, 
    });

    await supabaseAdmin
      .from('recordings')
      .update({ transcribed: true })
      .eq('id', recordingId);

    try {
      console.log('Deleting audio file from storage:', recording.audio_url);
      await storageService.deleteAudio(recording.audio_url);
      console.log('Audio file deleted successfully');
    } catch (deleteError) {
      console.error('Failed to delete audio file:', deleteError);
    }

    return NextResponse.json({
      success: true,
      transcription: transcriptionData,
      text: transcription.text,
      audioDeleted: true,
    });
  } catch (error: any) {
    console.error('Error in /api/transcribe:', error);
    
    let errorMessage = 'Failed to transcribe audio';
    if (error.message?.includes('file size')) {
      errorMessage = 'Audio file is too large. Please try a shorter recording (max 25MB).';
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      errorMessage = 'Transcription timeout. Recording might be too long. Try a shorter recording.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    );
  }
}
