import { NextRequest, NextResponse } from 'next/server';
import { postToTwitter } from '@/services/socialMedia/twitterService';
import { getServerSession } from '@/utils/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, imageUrl } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Tweet text is required' },
        { status: 400 }
      );
    }

    // Check tweet length - Twitter allows 280 characters
    if (text.length > 280) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Tweet exceeds 280 character limit' },
        { status: 400 }
      );
    }

    // Get Twitter API credentials from environment variables
    const apiKey = process.env.TWITTER_API_KEY;
    const apiKeySecret = process.env.TWITTER_API_KEY_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (
      !apiKey ||
      !apiKeySecret ||
      !accessToken ||
      !accessTokenSecret ||
      !bearerToken
    ) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'Twitter API credentials not configured'
        },
        { status: 500 }
      );
    }

    const result = await postToTwitter({
      text,
      imageUrl,
      apiKey,
      apiKeySecret,
      accessToken,
      accessTokenSecret,
      bearerToken
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Twitter API Error', message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tweetId: result.tweetId,
      platform: 'twitter'
    });
  } catch (error: any) {
    console.error('Error posting to Twitter:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
