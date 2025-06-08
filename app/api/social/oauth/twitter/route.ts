import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/utils/auth/session';
import { saveSocialToken } from '@/utils/gcloud/socialTokens';

export const dynamic = 'force-dynamic';

// Constants for Twitter OAuth 2.0
const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';

// Scopes needed for posting
const SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access'
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
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.OAUTH_REDIRECT_URI}/twitter`;
    
    if (!clientId || !redirectUri) {
      throw new Error('Twitter OAuth credentials not configured');
    }
    
    // Generate random state and code verifier for PKCE
    const state = Math.random().toString(36).substring(2);
    const codeVerifier = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
    
    // Generate code challenge from verifier (using SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    
    // Convert digest to base64-url format
    const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Store state and code verifier in cookies to verify on callback
    const response = NextResponse.redirect(
      `${TWITTER_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES.join(' '))}&state=${state}&code_challenge=${base64Digest}&code_challenge_method=S256`
    );
    
    // Set secure cookies with state, code verifier, and userId
    response.cookies.set({
      name: 'twitter_oauth_state',
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });
    
    response.cookies.set({
      name: 'twitter_code_verifier',
      value: codeVerifier,
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
    console.error('Error initiating Twitter OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Twitter login' },
      { status: 500 }
    );
  }
}