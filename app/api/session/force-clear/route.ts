import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Mark this route as dynamic since it uses cookies and request.url
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const redirect = url.searchParams.get('redirect') || '/';
    
    // Clear all auth cookies server-side
    const cookieStore = await cookies();
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
    
    for (const name of authCookies) {
      cookieStore.delete?.(name); // Use optional chaining in case delete is not available
    }
    
    // Also sign out via Supabase
    const supabase = await createClient();
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

// Explicitly specify that this route should not be statically generated
export const fetchCache = 'force-no-store';
export const revalidate = 0;