// Cleaning transcript: hapus pengulangan kata/kalimat tidak penting lebih dari 2x
function cleanTranscript(text: string): string {
  return text
    .replace(/(terima kasih[.!?]?\s*){3,}/gi, 'Terima kasih. ')
    .replace(/(iya[.!?]?\s*){3,}/gi, 'Iya. ')
    .replace(/(oke[.!?]?\s*){3,}/gi, 'Oke. ');
}

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { transcriptionService } from '../../services/transcriptionService';
import { summaryService } from '../../services/summaryService';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Fungsi chunking sederhana (berbasis kata)
function chunkText(text: string, maxWords: number = 1500): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

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

    const existingSummary = await summaryService.getSummaryByRecording(recordingId);
    if (existingSummary) {
      return NextResponse.json({
        success: true,
        summary: existingSummary,
        cached: true,
      });
    }

    const transcriptions = await transcriptionService.getTranscriptionsByRecording(recordingId);
    
    if (!transcriptions || transcriptions.length === 0) {
      return NextResponse.json(
        { error: 'No transcription found for this recording' },
        { status: 404 }
      );
    }


    // Cleaning transcript sebelum summary
    const rawText = transcriptions.map(t => t.text).join('\n\n');
    const fullText = cleanTranscript(rawText);

    // CHUNKING: Bagi teks jika terlalu panjang
    const chunks = chunkText(fullText, 1500); // 1500 kata per chunk
    const summaries: string[] = [];

    for (const chunk of chunks) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Kamu adalah asisten yang membantu meringkas catatan kuliah. \nBuatlah ringkasan yang:\n1. Mencakup poin-poin utama\n2. Mudah dipahami\n3. Terstruktur dengan baik (gunakan bullet points atau numbering)\n4. Fokus pada konsep penting dan definisi\n5. Dalam bahasa Indonesia yang baik\n\nFormat output dengan Markdown (gunakan **, *, -, dll untuk formatting).`
            },
            {
              role: 'user',
              content: `Ringkas catatan kuliah berikut:\n\n${chunk}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });
        const summaryContent = completion.choices[0]?.message?.content || '';
        summaries.push(summaryContent);
      } catch (err: any) {
        // Error handling: jika error pada salah satu chunk, hentikan dan beri pesan user-friendly
        console.error('Error generating summary chunk:', err);
        return NextResponse.json(
          {
            error: 'Gagal membuat summary untuk salah satu bagian. Coba rekaman lebih singkat atau ulangi beberapa saat lagi.',
            details: err.message,
          },
          { status: 500 }
        );
      }
    }

    // Gabungkan semua summary
    const finalSummary = summaries.join("\n\n");

    console.log('Summary generated:', finalSummary.substring(0, 100) + '...');

    const summary = await summaryService.createSummary({
      recordingId,
      content: finalSummary,
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
