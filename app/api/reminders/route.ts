import { NextRequest, NextResponse } from 'next/server';
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

    const { recordingId, reminderTime } = await request.json();

    if (!recordingId || !reminderTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAuthenticatedSupabaseClient(request);
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        recording_id: recordingId,
        reminder_time: reminderTime,
        sent: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reminder: data,
    });
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create reminder',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');

    const supabase = createAuthenticatedSupabaseClient(request);
    let query = supabase
      .from('reminders')
      .select(`
        *,
        recordings (
          id,
          title,
          subject_id,
          subjects (
            name,
            color,
            icon
          )
        )
      `)
      .order('reminder_time', { ascending: true });

    if (recordingId) {
      query = query.eq('recording_id', recordingId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reminders: data || [],
    });
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reminders',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
