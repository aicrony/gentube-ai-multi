// Add this line to prevent caching this page
export const dynamic = 'force-dynamic';

import Logo from '@/components/icons/Logo';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import Card from '@/components/ui/Card';
import PasswordSignIn from '@/components/ui/AuthForms/PasswordSignIn';
import EmailSignIn from '@/components/ui/AuthForms/EmailSignIn';
import Separator from '@/components/ui/AuthForms/Separator';
import OauthSignIn from '@/components/ui/AuthForms/OauthSignIn';
import ForgotPassword from '@/components/ui/AuthForms/ForgotPassword';
import UpdatePassword from '@/components/ui/AuthForms/UpdatePassword';
import SignUp from '@/components/ui/AuthForms/Signup';

export default async function SignIn({
  params,
  searchParams = {}
}: {
  params: { id: string };
  searchParams?: {
    disable_button?: boolean;
    new_user_prompt?: string;
    message?: string;
  };
}) {
  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  let viewProp: string;

  // Remove redundant typeof check
  if (viewTypes.includes(params.id)) {
    viewProp = params.id;
  } else {
    // Await cookies() to get the actual cookie object
    const cookieStore = await cookies();
    const preferredSignInView =
      cookieStore.get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);

    const queryString = searchParams
      ? Object.entries(searchParams)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
      : '';

    const redirectUrl = queryString
      ? `/signin/${viewProp}?${queryString}`
      : `/signin/${viewProp}`;

    return redirect(redirectUrl);
  }

  const hasSessionExpiredMessage = searchParams?.message === 'session_expired';
  const supabase = createClient();
  let user: any = null;

  if (hasSessionExpiredMessage) {
    // Await cookies() to get the actual cookie object
    const cookieStore = await cookies();
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token'
    ];
    for (const name of authCookies) {
      cookieStore.delete?.(name); // Use optional chaining in case delete is not available
    }
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  } else {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (error) {
      console.error('Error getting user:', error);
      user = null;
    }
  }

  // Handle normal auth redirects
  if (user && viewProp !== 'update_password') {
    return redirect('/');
  } else if (!user && viewProp === 'update_password') {
    return redirect('/signin');
  }

  return (
    <div className="flex justify-center height-screen-helper">
      <div className="flex flex-col justify-between max-w-lg p-3 m-auto w-80 ">
        <div className="mt-12 flex justify-center pb-2 ">
          <Logo width="90px" height="90px" />
        </div>
        {searchParams?.new_user_prompt && (
          <div
            className="mb-1 p-2 rounded-md border border-blue-500 text-center"
            style={{
              backgroundColor: 'var(--primary-2)',
              color: 'var(--text-color)'
            }}
          >
            <p className="font-medium">
              New users{' '}
              <a
                href="/signin/signup"
                className="underline font-semibold"
                style={{ color: 'var(--primary-color)' }}
              >
                sign up for your Free Credits
              </a>
            </p>
          </div>
        )}

        {searchParams?.message === 'session_expired' && (
          <div
            className="mb-1 p-2 rounded-md border border-orange-500 text-center"
            style={{
              backgroundColor: 'var(--error-bg)',
              color: 'var(--error-text)'
            }}
          >
            <p className="font-medium">
              Your session has expired. Please sign in again.
            </p>
          </div>
        )}
        <Card
          title={
            viewProp === 'forgot_password'
              ? 'Reset Password'
              : viewProp === 'update_password'
                ? 'Update Password'
                : viewProp === 'signup'
                  ? 'Sign Up'
                  : 'Sign In'
          }
        >
          {viewProp === 'password_signin' && (
            <PasswordSignIn
              allowEmail={allowEmail}
              redirectMethod={redirectMethod}
            />
          )}
          {viewProp === 'email_signin' && (
            <EmailSignIn
              allowPassword={allowPassword}
              redirectMethod={redirectMethod}
              disableButton={searchParams?.disable_button}
            />
          )}
          {viewProp === 'forgot_password' && (
            <ForgotPassword
              allowEmail={allowEmail}
              redirectMethod={redirectMethod}
              disableButton={searchParams?.disable_button}
            />
          )}
          {viewProp === 'update_password' && (
            <UpdatePassword redirectMethod={redirectMethod} />
          )}
          {viewProp === 'signup' && (
            <SignUp allowEmail={allowEmail} redirectMethod={redirectMethod} />
          )}
          {viewProp !== 'update_password' &&
            viewProp !== 'signup' &&
            allowOauth && (
              // Show Google sign-in option for all users
              <>
                <Separator text="Third-party sign-in" />
                <OauthSignIn />
              </>
            )}
        </Card>
      </div>
    </div>
  );
}
