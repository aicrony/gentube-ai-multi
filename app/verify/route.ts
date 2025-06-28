import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';

export async function GET(request: NextRequest) {
  // This route handles the email verification link
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type') || 'email';

  if (token) {
    const supabase = createClient();

    try {
      // Use verifyOtp for email verification
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any
      });

      if (error) {
        console.error('Email verification error:', error);
        return NextResponse.redirect(
          getErrorRedirect(
            `${requestUrl.origin}/signin`,
            error.name,
            "Sorry, we weren't able to verify your email. The link may have expired or already been used."
          )
        );
      }

      // Try to exchange code for session as a fallback
      // This is needed because Supabase sometimes sends confirmation links
      // with a token parameter instead of a code parameter
      if (type === 'recovery' || type === 'email') {
        try {
          await supabase.auth.exchangeCodeForSession(token);
        } catch (exchangeError) {
          // This is expected to fail in some cases, so we just log it
          console.log('Token exchange fallback attempt:', exchangeError);
        }
      }
    } catch (e) {
      console.error('Unexpected error during verification:', e);
      return NextResponse.redirect(
        getErrorRedirect(
          `${requestUrl.origin}/signin`,
          'VerificationError',
          "Sorry, we weren't able to verify your email. Please try again."
        )
      );
    }
  } else {
    return NextResponse.redirect(
      getErrorRedirect(
        `${requestUrl.origin}/signin`,
        'MissingToken',
        "The verification link is invalid. Please request a new one."
      )
    );
  }

  // Redirect to appropriate page based on verification type
  if (type === 'recovery') {
    return NextResponse.redirect(
      getStatusRedirect(
        `${requestUrl.origin}/signin/update_password`,
        'Success!',
        'You can now set a new password for your account.'
      )
    );
  } else {
    return NextResponse.redirect(
      getStatusRedirect(
        `${requestUrl.origin}/gallery`,
        'Success!',
        'Your email has been verified. You are now signed in.'
      )
    );
  }
}