import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';

export async function GET(request: NextRequest) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the `@supabase/ssr` package. It exchanges an auth code for the user's session.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // TODO: Email address confirmations are turned off in Supabase, so we need to send a success message regardless of true confirmation
    if (error) {
      return NextResponse.redirect(
        // getErrorRedirect(
        //   `${requestUrl.origin}/signin`,
        //   error.name,
        //   "Sorry, we weren't able to log you in. Please try again."
        // )
        getStatusRedirect(
          `${requestUrl.origin}/gallery`,
          'Success!',
          'Please sign in.'
        )
      );
    }
  }

  // URL to redirect to after sign in process completes
  // TODO: Flow for email confirmation is still flawed - start troubleshooting with first email received
  return NextResponse.redirect(
    // getStatusRedirect(
    //   `${requestUrl.origin}/gallery`,
    //   'Success!',
    //   'You are now signed in.'
    // )
    getStatusRedirect(
      `${requestUrl.origin}/gallery`,
      'Success!',
      'Please sign in.'
    )
  );
}
