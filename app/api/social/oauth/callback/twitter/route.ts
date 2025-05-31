import { NextRequest, NextResponse } from 'next/server';
import { saveSocialToken } from '@/utils/gcloud/socialTokens';

// Constants for Twitter OAuth 2.0
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWITTER_USER_URL = 'https://api.twitter.com/2/users/me';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get parameters from callback URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Get stored state, code verifier, and userId from cookies
    const storedState = request.cookies.get('twitter_oauth_state')?.value;
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value;
    const userId = request.cookies.get('oauth_user_id')?.value;

    // Validate state to prevent CSRF
    if (!state || state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    // Check for userId and code verifier
    if (!userId || !codeVerifier) {
      throw new Error('User ID or code verifier not found');
    }

    // Check for errors from Twitter
    if (error) {
      throw new Error(`Twitter OAuth error: ${error}`);
    }

    // Check for auth code
    if (!code) {
      throw new Error('Authorization code not received');
    }

    // Get app credentials
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${process.env.OAUTH_REDIRECT_URI}/twitter`;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Twitter OAuth credentials not configured');
    }

    // Exchange code for access token using PKCE
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);
    params.append('code_verifier', codeVerifier);

    const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(
        `Failed to exchange code for token: ${JSON.stringify(errorData)}`
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user profile
    const userResponse = await fetch(TWITTER_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Twitter user data');
    }

    const userData = await userResponse.json();

    // Save token to database
    const saveResult = await saveSocialToken(userId, 'twitter', {
      platform: 'twitter',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      platformUserId: userData.data.id,
      platformUserName: userData.data.username
    });

    if (!saveResult) {
      throw new Error('Failed to save Twitter token');
    }

    // Create response redirecting back to the social media page
    const response = NextResponse.redirect(
      new URL('/personal/social-media', request.url)
    );

    // Clear OAuth cookies
    ['twitter_oauth_state', 'twitter_code_verifier', 'oauth_user_id'].forEach(
      (cookieName) => {
        response.cookies.set({
          name: cookieName,
          value: '',
          expires: new Date(0)
        });
      }
    );

    return response;
  } catch (error: any) {
    console.error('Error processing Twitter OAuth callback:', error);

    // Redirect to error page or back to app with error parameter
    const errorUrl = new URL('/personal/social-media', request.url);
    errorUrl.searchParams.set('error', 'twitter_connect_failed');

    const response = NextResponse.redirect(errorUrl);

    // Clear cookies even on error
    ['twitter_oauth_state', 'twitter_code_verifier', 'oauth_user_id'].forEach(
      (cookieName) => {
        response.cookies.set({
          name: cookieName,
          value: '',
          expires: new Date(0)
        });
      }
    );

    return response;
  }
}
