import { NextRequest, NextResponse } from 'next/server';
import { recordingService } from '../../../services/recordingService-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  try {
    const { recordingId } = await params;

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      );
    }

    await recordingService.deleteRecording(recordingId);

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
