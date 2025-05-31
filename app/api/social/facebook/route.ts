import { NextRequest, NextResponse } from 'next/server';
import { postToFacebook } from '@/services/socialMedia/facebookService';
import { getServerSession } from '@/utils/auth/session';
import { getSocialToken } from '@/utils/gcloud/socialTokens';

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

    const userId = session.user.id;
    const body = await request.json();
    const { message, imageUrl, pageId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Post message is required' },
        { status: 400 }
      );
    }

    // Get user's Facebook token from the database
    const token = await getSocialToken(userId, 'facebook');

    if (!token) {
      return NextResponse.json(
        {
          error: 'Authentication Error',
          message: 'Facebook account not connected'
        },
        { status: 401 }
      );
    }

    const result = await postToFacebook({
      message,
      imageUrl,
      accessToken: token.accessToken,
      pageId: pageId || token.platformUserId // Use page ID if provided, otherwise use user ID
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Facebook API Error', message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      platform: 'facebook'
    });
  } catch (error: any) {
    console.error('Error posting to Facebook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
