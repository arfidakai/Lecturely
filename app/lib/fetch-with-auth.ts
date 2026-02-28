import { supabase } from './supabase';

/**
 * Fetch wrapper that automatically includes auth token
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Fetch wrapper for FormData (e.g., file uploads) with auth
 */
export async function fetchWithAuthFormData(url: string, formData: FormData) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      // Don't set Content-Type for FormData, browser will set it with boundary
    },
    body: formData,
  });
}
