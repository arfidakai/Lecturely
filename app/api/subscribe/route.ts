import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Save subscription to database
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          auth_key: subscription.keys.auth,
          p256dh_key: subscription.keys.p256dh,
          is_active: true,
        },
        { onConflict: 'endpoint' }
      )
      .select();

    if (error) {
      console.error('[Push] Error saving subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    console.log('[Push] Subscription saved for user:', user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Push] Error in subscribe endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
