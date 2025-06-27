import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

/**
 * Endpoint to test session handling
 * 
 * This API route can:
 * 1. Check if a session exists (?action=check)
 * 2. Explicitly clear a session (?action=clear)
 * 3. Force-invalidate a session for testing (?action=invalidate)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'check';
  
  try {
    const supabase = createClient();
    const cookieStore = cookies();

    switch (action) {
      case 'check':
        // Just check if we have a valid session
        const { data, error } = await supabase.auth.getUser();
        
        return NextResponse.json({ 
          action: 'check',
          hasSession: !!data.user, 
          error: error?.message || null,
          hasCookies: !!cookieStore.get('supabase-auth-token')
        });
        
      case 'clear':
        // Clear all auth cookies
        const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
        for (const name of authCookies) {
          cookieStore.delete(name);
        }
        
        // Also sign out via Supabase
        await supabase.auth.signOut();
        
        return NextResponse.json({ 
          action: 'clear',
          success: true 
        });
        
      case 'invalidate':
        // This simulates a session that appears valid in cookies but is actually invalid
        // We'll keep the cookies but the session will be invalid server-side
        
        // Force sign out in Supabase but keep cookies
        await supabase.auth.signOut({ scope: 'global' });
        
        return NextResponse.json({ 
          action: 'invalidate',
          success: true,
          message: 'Session has been invalidated but cookies still exist'
        });
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in test-session API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}