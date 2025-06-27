import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Add this line to prevent caching this page
export const dynamic = 'force-dynamic';

export default async function SignIn({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // If we have a session_expired message, clear all auth cookies
  if (searchParams.message === 'session_expired') {
    // Clear auth cookies
    const cookieStore = cookies();
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
    
    // Manually delete cookies
    for (const name of authCookies) {
      cookieStore.delete(name);
    }
    
    // Try to sign out via Supabase as well
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Continue with redirect even if sign-out fails
    }
  }
  
  const preferredSignInView =
    cookies().get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);

  // Preserve query parameters
  const queryString = Object.entries(searchParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  const redirectUrl = queryString
    ? `/signin/${defaultView}?${queryString}`
    : `/signin/${defaultView}`;

  return redirect(redirectUrl);
}
