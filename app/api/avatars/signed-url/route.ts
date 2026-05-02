import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const path: string = body.path;
    const expires = typeof body.expires === 'number' ? body.expires : 60; // seconds

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .createSignedUrl(path, expires);

    if (error) {
      console.error('createSignedUrl error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err: any) {
    console.error('signed-url handler error', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
