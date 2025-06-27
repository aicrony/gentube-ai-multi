import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    // Clear all auth cookies server-side
    const cookieStore = cookies();
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
    
    for (const name of authCookies) {
      cookieStore.delete(name);
    }
    
    // Also sign out via Supabase
    const supabase = createClient();
    await supabase.auth.signOut();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear session' }, { status: 500 });
  }
}