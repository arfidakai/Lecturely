import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Server-side check for pending reminders
 * This can be called by:
 * 1. Client-side periodic checks (with auth header)
 * 2. Cron jobs / scheduled tasks (with secret header)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretHeader = request.headers.get('x-api-secret');

    // Verify auth (either user token or server secret)
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = user.id;
    } else if (secretHeader === process.env.CRON_SECRET) {
      // Server-side cron job, check all users
      userId = null;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pending reminders
    let query = supabaseAdmin
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
      .eq('sent', false)
      .order('reminder_time', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: allReminders, error } = await query;

    if (error) {
      console.error('[Reminders] Error fetching pending reminders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reminders' },
        { status: 500 }
      );
    }

    // Filter reminders that are ready to be sent (within ±5 minutes of reminder_time)
    const now = new Date();
    const pendingReminders = (allReminders || []).filter((reminder) => {
      const reminderTime = new Date(reminder.reminder_time);
      const diffMs = Math.abs(now.getTime() - reminderTime.getTime());
      const diffMinutes = diffMs / (1000 * 60);
      return diffMinutes <= 5; // Send if within ±5 minutes
    });

    console.log(`[Reminders] Found ${pendingReminders.length} pending reminders ready to send`);

    // Send push notification for each pending reminder
    for (const reminder of pendingReminders) {
      try {
        const subjectName = reminder.recordings?.subjects?.name || 'Unknown Subject';
        const recordingTitle = reminder.recordings?.title || 'Untitled Recording';
        const subjectIcon = reminder.recordings?.subjects?.icon || '📚';

        // Call send-notification API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-secret': process.env.CRON_SECRET || '',
            },
            body: JSON.stringify({
              userId: reminder.user_id,
              title: `${subjectIcon} Review Reminder: ${subjectName}`,
              body: `Time to review: ${recordingTitle}`,
              tag: reminder.id,
              data: {
                url: `/transcription/${reminder.recording_id}/${reminder.recordings?.subject_id || ''}`,
                reminderId: reminder.id,
              },
            }),
          }
        );

        if (!response.ok) {
          console.error(`[Reminders] Failed to send notification for reminder ${reminder.id}`);
          continue;
        }

        // Mark reminder as sent
        const { error: updateError } = await supabaseAdmin
          .from('reminders')
          .update({ sent: true })
          .eq('id', reminder.id);

        if (updateError) {
          console.error(`[Reminders] Error marking reminder ${reminder.id} as sent:`, updateError);
        } else {
          console.log(`[Reminders] Marked reminder ${reminder.id} as sent`);
        }
      } catch (err) {
        console.error(`[Reminders] Error processing reminder ${reminder.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      checked: allReminders?.length || 0,
      sent: pendingReminders.length,
      reminders: pendingReminders,
    });
  } catch (error) {
    console.error('[Reminders] Error in check endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
