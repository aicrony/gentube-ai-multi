import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/utils/auth/session';
import { saveSocialToken } from '@/utils/gcloud/socialTokens';

// Constants for TikTok OAuth
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';

// Scopes needed for posting
const SCOPES = ['user.info.basic', 'video.upload', 'video.publish'];

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
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = `${process.env.OAUTH_REDIRECT_URI}/tiktok`;

    if (!clientKey || !redirectUri) {
      throw new Error('TikTok OAuth credentials not configured');
    }

    // Generate random state to prevent CSRF
    const state = Math.random().toString(36).substring(2);

    // Store state in cookie to verify on callback
    const response = NextResponse.redirect(
      `${TIKTOK_AUTH_URL}?client_key=${clientKey}&response_type=code&scope=${SCOPES.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    );

    // Set secure cookies with state and userId
    response.cookies.set({
      name: 'tiktok_oauth_state',
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
    console.error('Error initiating TikTok OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate TikTok login' },
      { status: 500 }
    );
  }
}
