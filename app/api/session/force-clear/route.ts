import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const redirect = url.searchParams.get('redirect') || '/';
    
    // Clear all auth cookies server-side
    const cookieStore = cookies();
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
    
    for (const name of authCookies) {
      cookieStore.delete(name);
    }
    
    // Also sign out via Supabase
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Return a redirect response instead of JSON
    return NextResponse.redirect(new URL(redirect, request.url));
  } catch (error) {
    console.error('Error clearing session:', error);
    
    // Even on error, try to redirect
    const url = new URL(request.url);
    const redirect = url.searchParams.get('redirect') || '/';
    return NextResponse.redirect(new URL(redirect, request.url));
  }
}