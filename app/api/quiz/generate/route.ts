import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAuthenticatedUser, createAuthenticatedSupabaseClient } from '../../../lib/auth-helpers';
import { transcriptionService } from '../../../services/transcriptionService';
import { summaryService } from '../../../services/summaryService';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface QuizQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  question_order: number;
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer?: string;
  explanation: string;
}

function parseQuizResponse(response: string): QuizQuestion[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON array found in response');
  } catch (error) {
    console.error('Error parsing quiz response:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recordingId, difficulty = 'medium', questionCount = 5 } = await request.json();

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Missing recording ID' },
        { status: 400 }
      );
    }

    const supabase = createAuthenticatedSupabaseClient(request);

    // Get summary or transcription
    let content = '';
    
    const summary = await summaryService.getSummaryByRecording(recordingId, supabase);
    if (summary) {
      content = summary.content;
    } else {
      const transcriptions = await transcriptionService.getTranscriptionsByRecording(
        recordingId,
        supabase
      );
      if (!transcriptions || transcriptions.length === 0) {
        return NextResponse.json(
          { error: 'No transcription or summary found' },
          { status: 404 }
        );
      }
      content = transcriptions.map(t => t.text).join('\n\n');
    }

    // Generate questions using Groq
    const prompt = `Berdasarkan materi berikut, buatkan ${questionCount} soal untuk menguji pemahaman. 
Tingkat kesulitan: ${difficulty}
Gunakan kombinasi tipe soal: multiple choice (60%), true/false (20%), dan short answer (20%).

Materi:
${content.substring(0, 3000)} ${content.length > 3000 ? '...' : ''}

Berikan response dalam format JSON array dengan struktur berikut:
[
  {
    "question_text": "Pertanyaan di sini?",
    "question_type": "multiple_choice|true_false|short_answer",
    "question_order": 1,
    "options": [
      {"text": "Pilihan A", "is_correct": true},
      {"text": "Pilihan B", "is_correct": false}
    ],
    "correct_answer": "Untuk true/false dan short answer",
    "explanation": "Penjelasan jawaban ini"
  }
]

Pastikan JSON valid dan sesuai struktur di atas.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah pendidik profesional yang membuat soal berkualitas tinggi untuk menguji pemahaman siswa. Selalu berikan penjelasan yang jelas.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const questions = parseQuizResponse(responseText);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }

    // Get recording title
    const { data: recording } = await supabase
      .from('recordings')
      .select('title, subject_id')
      .eq('id', recordingId)
      .single();

    // Get subject name
    let subjectName = 'Quiz';
    if (recording?.subject_id) {
      const { data: subject } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', recording.subject_id)
        .single();
      if (subject) {
        subjectName = subject.name;
      }
    }

    // Create quiz in database
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        recording_id: recordingId,
        title: `${subjectName} - Quiz`,
        description: `Quiz generated from recording: ${recording?.title || 'Untitled'}`,
        question_count: questions.length,
        difficulty,
      })
      .select()
      .single();

    if (quizError || !quizData) {
      throw new Error('Failed to create quiz');
    }

    // Insert questions
    const questionsToInsert = questions.map((q, index) => ({
      quiz_id: quizData.id,
      question_text: q.question_text,
      question_type: q.question_type,
      question_order: index + 1,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      explanation: q.explanation,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      throw new Error('Failed to create questions');
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        questionCount: questions.length,
        difficulty,
      },
      questions: questions.map((q, index) => ({
        id: '', // Will be populated from database
        order: index + 1,
        ...q,
      })),
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
