import { NextRequest, NextResponse } from 'next/server';
import { transcriptionService } from '../../../services/transcriptionService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  try {
    const { recordingId } = await params;

    const transcriptions = await transcriptionService.getTranscriptionsByRecording(recordingId);

    if (!transcriptions || transcriptions.length === 0) {
      return NextResponse.json(
        { error: 'No transcription found' },
        { status: 404 }
      );
    }
    const fullText = transcriptions.map(t => t.text).join('\n\n');

    return NextResponse.json({
      success: true,
      text: fullText,
      transcriptions,
    });
  } catch (error: any) {
    console.error('Error fetching transcription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcription', details: error.message },
      { status: 500 }
    );
  }
}
