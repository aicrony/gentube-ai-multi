import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/utils/auth/session';
import { saveSocialToken } from '@/utils/gcloud/socialTokens';

// Constants for LinkedIn OAuth
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';

// Scopes needed for posting
const SCOPES = [
  'r_liteprofile',
  'r_emailaddress',
  'w_member_social'
];

// Start OAuth flow
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user session to ensure they're logged in
    const session = await getServerSession();
    if (!session) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    const userId = session.user.id;
    
    // Get app credentials
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.OAUTH_REDIRECT_URI}/linkedin`;
    
    if (!clientId || !redirectUri) {
      throw new Error('LinkedIn OAuth credentials not configured');
    }
    
    // Generate random state to prevent CSRF
    const state = Math.random().toString(36).substring(2);
    
    // Store state in cookie to verify on callback
    const response = NextResponse.redirect(
      `${LINKEDIN_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(SCOPES.join(' '))}`
    );
    
    // Set secure cookies with state and userId
    response.cookies.set({
      name: 'linkedin_oauth_state',
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });
    
    response.cookies.set({
      name: 'oauth_user_id',
      value: userId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });
    
    return response;
  } catch (error: any) {
    console.error('Error initiating LinkedIn OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate LinkedIn login' },
      { status: 500 }
    );
  }
}