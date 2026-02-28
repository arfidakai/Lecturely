import { NextRequest, NextResponse } from 'next/server';
import { recordingService } from '../../../services/recordingService-server';
import { getAuthenticatedUser, createAuthenticatedSupabaseClient } from '../../../lib/auth-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { recordingId } = await params;

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAuthenticatedSupabaseClient(request);
    await recordingService.deleteRecording(recordingId, supabase);

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting recording:', error);
    return NextResponse.json(
      { error: 'Failed to delete recording', details: error.message },
      { status: 500 }
    );
  }
}
