import { NextRequest, NextResponse } from 'next/server';

// This endpoint is called by Vercel Cron
// Every 5 minutes to check for pending reminders
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the main reminders check endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${appUrl}/api/reminders/check`, {
      method: 'POST',
      headers: {
        'x-api-secret': process.env.CRON_SECRET || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('[Cron] Reminder check completed:', {
      checked: data.checked,
      sent: data.sent,
      status: response.status,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[Cron] Error checking reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
