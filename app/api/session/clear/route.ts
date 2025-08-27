import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Mark this route as dynamic since it uses cookies
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Clear all auth cookies server-side
    const cookieStore = await cookies();
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
    
    for (const name of authCookies) {
      cookieStore.delete?.(name); // Use optional chaining in case delete is not available
    }
    
    // Also sign out via Supabase
    const supabase = await createClient();
    await supabase.auth.signOut();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear session' }, { status: 500 });
  }
}

// Explicitly specify that this route should not be statically generated
export const fetchCache = 'force-no-store';
export const revalidate = 0;