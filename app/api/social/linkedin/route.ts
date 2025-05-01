import { NextRequest, NextResponse } from 'next/server';
import { postToLinkedIn } from '@/services/socialMedia/linkedinService';
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
    const { text, imageUrl, organizationId } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Post text is required' },
        { status: 400 }
      );
    }

    // Get LinkedIn access token from environment variables or database
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Configuration Error', message: 'LinkedIn API token not configured' },
        { status: 500 }
      );
    }

    const result = await postToLinkedIn({
      text,
      imageUrl,
      accessToken,
      organizationId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'LinkedIn API Error', message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      platform: 'linkedin'
    });
  } catch (error: any) {
    console.error('Error posting to LinkedIn:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}