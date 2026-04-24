import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push dengan VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, tag, data, icon, badge } = await request.json();
    const secretHeader = request.headers.get('x-api-secret');

    // Verify auth
    const authHeader = request.headers.get('authorization');
    let authenticatedUserId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      authenticatedUserId = user.id;
    } else if (secretHeader === process.env.CRON_SECRET) {
      // Server-side cron/scheduled task
      authenticatedUserId = null;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title' },
        { status: 400 }
      );
    }

    // If authenticated as user, can only send to themselves
    if (authenticatedUserId && authenticatedUserId !== userId) {
      return NextResponse.json(
        { error: 'Can only send notifications to own subscriptions' },
        { status: 403 }
      );
    }

    // Get all active subscriptions for user
    const { data: subscriptions, error: dbError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (dbError) {
      console.error('[Push] Error fetching subscriptions:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] No active subscriptions found for user:', userId);
      return NextResponse.json(
        { success: true, sent: 0, message: 'No active subscriptions' }
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      tag: tag || 'reminder',
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-192x192.png',
      data: data || {},
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth_key,
              p256dh: sub.p256dh_key,
            },
          },
          payload
        )
      )
    );

    // Count successful sends
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Log failures and mark inactive subscriptions
    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      if (result.status === 'rejected') {
        const error = result.reason;
        console.error(`[Push] Failed to send to subscription ${index}:`, error.message);

        // Mark subscription as inactive if gone (410) or invalid (404)
        if (error.statusCode === 410 || error.statusCode === 404) {
          const sub = subscriptions[index];
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('endpoint', sub.endpoint);
          console.log(`[Push] Marked subscription ${index} as inactive`);
        }
      }
    }

    console.log(`[Push] Notification sent to ${successful}/${subscriptions.length} subscriptions`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      message: `Sent to ${successful}/${subscriptions.length} subscriptions`,
    });
  } catch (error) {
    console.error('[Push] Error in send-notification endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
