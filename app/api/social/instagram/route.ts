import { NextRequest, NextResponse } from 'next/server';
import { postToInstagram } from '@/services/socialMedia/instagramService';
import { getServerSession } from "@/utils/auth/session";

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
    const { caption, imageUrl } = body;

    if (!caption) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Caption is required' },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Image URL is required for Instagram posts' },
        { status: 400 }
      );
    }

    // Get Instagram access token and account ID from environment variables or database
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    if (!accessToken || !instagramAccountId) {
      return NextResponse.json(
        { error: 'Configuration Error', message: 'Instagram API credentials not configured' },
        { status: 500 }
      );
    }

    const result = await postToInstagram({
      caption,
      imageUrl,
      accessToken,
      instagramAccountId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Instagram API Error', message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      platform: 'instagram'
    });
  } catch (error: any) {
    console.error('Error posting to Instagram:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}