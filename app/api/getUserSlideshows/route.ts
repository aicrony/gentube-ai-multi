import { NextRequest, NextResponse } from 'next/server';
import { getUserSlideshows } from '@/utils/gcloud/slideshowManager';
import { apiErrorHandler } from '@/utils/apiErrorHandler.server';

export const dynamic = 'force-dynamic';

// Get all slideshows for a user
export async function GET(req: NextRequest) {
  try {
    // Get user ID from query params
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Retrieve slideshows
    const result = await getUserSlideshows(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve slideshows' },
        { status: 500 }
      );
    }

    // Return the slideshows data
    return NextResponse.json({
      success: true,
      slideshows: result.slideshows,
      baseUrl: `${req.nextUrl.origin}/slideshow/`
    });

  } catch (error) {
    return apiErrorHandler(error, 'Error retrieving user slideshows');
  }
}