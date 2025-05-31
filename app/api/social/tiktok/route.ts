import { NextRequest, NextResponse } from 'next/server';
import { postToTikTok } from '@/services/socialMedia/tiktokService';
import { getServerSession } from '@/utils/auth/session';

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
        { error: 'Bad Request', message: 'Caption text is required' },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Media URL is required for TikTok posts'
        },
        { status: 400 }
      );
    }

    // Get TikTok API credentials from environment variables
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    const openId = process.env.TIKTOK_OPEN_ID;

    if (!accessToken || !openId) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'TikTok API credentials not configured'
        },
        { status: 500 }
      );
    }

    const result = await postToTikTok({
      text,
      imageUrl,
      accessToken,
      openId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'TikTok API Error', message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      platform: 'tiktok'
    });
  } catch (error: any) {
    console.error('Error posting to TikTok:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
