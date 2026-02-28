import { NextRequest, NextResponse } from 'next/server';
import { recordingService } from '../../services/recordingService-server';
import { getAuthenticatedUser, createAuthenticatedSupabaseClient } from '../../lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const audioFile = formData.get('audio') as File;
    const subjectId = formData.get('subjectId') as string;
    const duration = parseInt(formData.get('duration') as string);
    const title = formData.get('title') as string;

    if (!audioFile || !subjectId || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { 
      type: audioFile.type 
    });

    const supabase = createAuthenticatedSupabaseClient(request);
    const recording = await recordingService.createRecording({
      userId: user.id,
      subjectId,
      audioBlob,
      duration,
      title,
      supabase,
    });

    return NextResponse.json({ success: true, recording });
  } catch (error) {
    console.error('Error in /api/recordings:', error);
    return NextResponse.json(
      { error: 'Failed to create recording' },
      { status: 500 }
    );
  }
}
