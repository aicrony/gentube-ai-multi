import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';

export default function SignIn({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
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
