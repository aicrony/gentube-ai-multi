import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Add this line to prevent caching this page
export const dynamic = 'force-dynamic';

export default async function SignIn({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams Promise
  const search = await searchParams;
  
  // If we have a session_expired message, clear all auth cookies
  if (search.message === 'session_expired') {
    // Clear auth cookies
    const cookieStore = await cookies();
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
    
    // Manually delete cookies
    for (const name of authCookies) {
      cookieStore.delete?.(name); // Use optional chaining in case delete is not available
    }
    
    // Try to sign out via Supabase as well
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Continue with redirect even if sign-out fails
    }
  }
  
  const cookieStore = await cookies();
  const preferredSignInView =
    cookieStore.get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);

  // Preserve query parameters
  const queryString = Object.entries(search)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  const redirectUrl = queryString
    ? `/signin/${defaultView}?${queryString}`
    : `/signin/${defaultView}`;

  return redirect(redirectUrl);
}
