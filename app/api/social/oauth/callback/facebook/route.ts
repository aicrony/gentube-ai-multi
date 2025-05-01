import { NextRequest, NextResponse } from 'next/server';
import { saveSocialToken } from '@/utils/gcloud/socialTokens';

// Constants for Facebook OAuth
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v17.0/oauth/access_token';
const FACEBOOK_PROFILE_URL = 'https://graph.facebook.com/v17.0/me';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get parameters from callback URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Get stored state and userId from cookies
    const storedState = request.cookies.get('facebook_oauth_state')?.value;
    const userId = request.cookies.get('oauth_user_id')?.value;
    
    // Validate state to prevent CSRF
    if (!state || state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    
    // Check for userId
    if (!userId) {
      throw new Error('User ID not found');
    }
    
    // Check for errors from Facebook
    if (error) {
      throw new Error(`Facebook OAuth error: ${error}`);
    }
    
    // Check for auth code
    if (!code) {
      throw new Error('Authorization code not received');
    }
    
    // Get app credentials
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.OAUTH_REDIRECT_URI}/facebook`;
    
    if (!appId || !appSecret || !redirectUri) {
      throw new Error('Facebook OAuth credentials not configured');
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch(
      `${FACEBOOK_TOKEN_URL}?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      { method: 'GET' }
    );
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Failed to exchange code for token: ${JSON.stringify(errorData)}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user profile to get unique Facebook ID
    const profileResponse = await fetch(
      `${FACEBOOK_PROFILE_URL}?access_token=${tokenData.access_token}`,
      { method: 'GET' }
    );
    
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Facebook profile');
    }
    
    const profileData = await profileResponse.json();
    
    // Save token to database
    const saveResult = await saveSocialToken(userId, 'facebook', {
      platform: 'facebook',
      accessToken: tokenData.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      tokenType: tokenData.token_type,
      platformUserId: profileData.id,
      platformUserName: profileData.name
    });
    
    if (!saveResult) {
      throw new Error('Failed to save Facebook token');
    }
    
    // Create response redirecting back to the social media page
    const response = NextResponse.redirect(new URL('/personal/social-media', request.url));
    
    // Clear OAuth cookies
    response.cookies.set({
      name: 'facebook_oauth_state',
      value: '',
      expires: new Date(0)
    });
    
    response.cookies.set({
      name: 'oauth_user_id',
      value: '',
      expires: new Date(0)
    });
    
    return response;
  } catch (error: any) {
    console.error('Error processing Facebook OAuth callback:', error);
    
    // Redirect to error page or back to app with error parameter
    const errorUrl = new URL('/personal/social-media', request.url);
    errorUrl.searchParams.set('error', 'facebook_connect_failed');
    
    const response = NextResponse.redirect(errorUrl);
    
    // Clear cookies even on error
    response.cookies.set({
      name: 'facebook_oauth_state',
      value: '',
      expires: new Date(0)
    });
    
    response.cookies.set({
      name: 'oauth_user_id',
      value: '',
      expires: new Date(0)
    });
    
    return response;
  }
}