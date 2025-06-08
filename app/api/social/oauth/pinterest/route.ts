import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/utils/auth/session';
import { saveSocialToken } from '@/utils/gcloud/socialTokens';

export const dynamic = 'force-dynamic';

// Constants for Pinterest OAuth
const PINTEREST_AUTH_URL = 'https://www.pinterest.com/oauth/';

// Scopes needed for posting
const SCOPES = [
  'boards:read',
  'pins:read',
  'pins:write',
  'user_accounts:read'
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
    const appId = process.env.PINTEREST_APP_ID;
    const redirectUri = `${process.env.OAUTH_REDIRECT_URI}/pinterest`;
    
    if (!appId || !redirectUri) {
      throw new Error('Pinterest OAuth credentials not configured');
    }
    
    // Generate random state to prevent CSRF
    const state = Math.random().toString(36).substring(2);
    
    // Store state in cookie to verify on callback
    const response = NextResponse.redirect(
      `${PINTEREST_AUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${SCOPES.join(',')}&state=${state}`
    );
    
    // Set secure cookies with state and userId
    response.cookies.set({
      name: 'pinterest_oauth_state',
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
    console.error('Error initiating Pinterest OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Pinterest login' },
      { status: 500 }
    );
  }
}