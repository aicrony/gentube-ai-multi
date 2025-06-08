import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/utils/auth/session';
import { saveSocialToken } from '@/utils/gcloud/socialTokens';

export const dynamic = 'force-dynamic';

// Constants for Facebook OAuth
const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v17.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v17.0/oauth/access_token';

// Scopes needed for posting
const SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'publish_to_groups',
  'public_profile',
  'email'
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
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = `${process.env.OAUTH_REDIRECT_URI}/facebook`;
    
    if (!appId || !redirectUri) {
      throw new Error('Facebook OAuth credentials not configured');
    }
    
    // Generate random state to prevent CSRF
    const state = Math.random().toString(36).substring(2);
    
    // Store state in cookie to verify on callback
    const response = NextResponse.redirect(
      `${FACEBOOK_AUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${SCOPES.join(',')}&response_type=code`
    );
    
    // Set secure cookies with state and userId
    response.cookies.set({
      name: 'facebook_oauth_state',
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
    console.error('Error initiating Facebook OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Facebook login' },
      { status: 500 }
    );
  }
}