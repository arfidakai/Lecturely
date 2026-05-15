import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createAuthenticatedSupabaseClient } from '../../../lib/auth-helpers';

interface QuizAnswer {
  question_id: string;
  answer: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId, answers } = await request.json() as {
      quizId: string;
      answers: QuizAnswer[];
    };

    if (!quizId || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Missing quiz ID or answers' },
        { status: 400 }
      );
    }

    const supabase = createAuthenticatedSupabaseClient(request);

    // Get quiz questions to check answers
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer, question_type')
      .eq('quiz_id', quizId);

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const evaluatedAnswers = answers.map(answer => {
      const question = questions.find(q => q.id === answer.question_id);
      if (!question) return { ...answer, is_correct: false };

      let isCorrect = false;
      
      if (question.question_type === 'true_false') {
        isCorrect = answer.answer.toLowerCase() === question.correct_answer?.toLowerCase();
      } else if (question.question_type === 'short_answer') {
        // Normalize for short answer comparison
        const userAnswer = answer.answer.toLowerCase().trim();
        const correctAnswer = question.correct_answer?.toLowerCase().trim() || '';
        isCorrect = userAnswer === correctAnswer || 
                   correctAnswer.includes(userAnswer) ||
                   userAnswer.includes(correctAnswer);
      } else {
        // multiple_choice
        isCorrect = answer.answer === question.correct_answer;
      }

      if (isCorrect) correctCount++;
      return { ...answer, is_correct: isCorrect };
    });

    const percentage = Math.round((correctCount / questions.length) * 100);

    // Save submission
    const { data: submission, error: submitError } = await supabase
      .from('quiz_submissions')
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        score: correctCount,
        total_questions: questions.length,
        percentage,
        answers: evaluatedAnswers,
      })
      .select()
      .single();

    if (submitError || !submission) {
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        score: submission.score,
        totalQuestions: submission.total_questions,
        percentage: submission.percentage,
        answers: evaluatedAnswers,
      },
    });
  } catch (error: any) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
