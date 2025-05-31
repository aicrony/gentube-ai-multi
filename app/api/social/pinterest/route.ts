import { NextRequest, NextResponse } from 'next/server';
import { postToPinterest } from '@/services/socialMedia/pinterestService';
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
    const { title, description, imageUrl, link, boardId } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Image URL is required for Pinterest pins'
        },
        { status: 400 }
      );
    }

    // Get Pinterest access token from environment variables
    const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    // If boardId is not provided, use a default one (user's should select one in UI)
    const defaultBoardId = process.env.PINTEREST_DEFAULT_BOARD_ID;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'Pinterest API token not configured'
        },
        { status: 500 }
      );
    }

    const result = await postToPinterest({
      title,
      description,
      imageUrl,
      link,
      accessToken,
      boardId: boardId || defaultBoardId || ''
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Pinterest API Error', message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pinId: result.pinId,
      platform: 'pinterest'
    });
  } catch (error: any) {
    console.error('Error posting to Pinterest:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
