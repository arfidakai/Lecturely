import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { transcriptionService } from '../../services/transcriptionService';
import { summaryService } from '../../services/summaryService';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { recordingId } = await request.json();

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Missing recording ID' },
        { status: 400 }
      );
    }

    console.log('Generating summary for recording:', recordingId);

    // Check if summary already exists
    const existingSummary = await summaryService.getSummaryByRecording(recordingId);
    if (existingSummary) {
      return NextResponse.json({
        success: true,
        summary: existingSummary,
        cached: true,
      });
    }

    // Get transcription text
    const transcriptions = await transcriptionService.getTranscriptionsByRecording(recordingId);
    
    if (!transcriptions || transcriptions.length === 0) {
      return NextResponse.json(
        { error: 'No transcription found for this recording' },
        { status: 404 }
      );
    }

    const fullText = transcriptions.map(t => t.text).join('\n\n');

    // Generate summary using Groq
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast and FREE!
      messages: [
        {
          role: 'system',
          content: `Kamu adalah asisten yang membantu meringkas catatan kuliah. 
Buatlah ringkasan yang:
1. Mencakup poin-poin utama
2. Mudah dipahami
3. Terstruktur dengan baik (gunakan bullet points atau numbering)
4. Fokus pada konsep penting dan definisi
5. Dalam bahasa Indonesia yang baik

Format output dengan Markdown (gunakan **, *, -, dll untuk formatting).`
        },
        {
          role: 'user',
          content: `Ringkas catatan kuliah berikut:\n\n${fullText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const summaryContent = completion.choices[0]?.message?.content || 'Tidak dapat membuat ringkasan';

    console.log('Summary generated:', summaryContent.substring(0, 100) + '...');

    // Save summary to database
    const summary = await summaryService.createSummary({
      recordingId,
      content: summaryContent,
    });

    return NextResponse.json({
      success: true,
      summary,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Missing recording ID' },
        { status: 400 }
      );
    }

    const summary = await summaryService.getSummaryByRecording(recordingId);

    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch summary',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
