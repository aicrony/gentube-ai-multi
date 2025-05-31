import { NextRequest, NextResponse } from 'next/server';
import { createSlideshow, getSlideshow } from '@/utils/gcloud/slideshowManager';
import { apiErrorHandler } from '@/utils/apiErrorHandler.server';

export const dynamic = 'force-dynamic';

// Create a new slideshow
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { userId, userIp, assetIds, title, settings } = body;

    // Validate inputs
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'Asset IDs are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create slideshow
    const result = await createSlideshow(
      userId,
      assetIds,
      title,
      settings,
      userIp || 'none'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create slideshow' },
        { status: 500 }
      );
    }

    // Return the slideshow ID for sharing
    return NextResponse.json({
      success: true,
      slideshowId: result.slideshowId,
      shareUrl: `${req.nextUrl.origin}/slideshow/${result.slideshowId}`
    });
  } catch (error) {
    return apiErrorHandler(error, 'Error creating slideshow');
  }
}

// Get a slideshow by ID
export async function GET(req: NextRequest) {
  try {
    // Get slideshow ID from query parameters
    const slideshowId = req.nextUrl.searchParams.get('id');

    if (!slideshowId) {
      return NextResponse.json(
        { error: 'Slideshow ID is required' },
        { status: 400 }
      );
    }

    // Retrieve slideshow
    const result = await getSlideshow(slideshowId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve slideshow' },
        { status: 404 }
      );
    }

    // Return the slideshow data
    return NextResponse.json({
      success: true,
      slideshow: result.slideshow
    });
  } catch (error) {
    return apiErrorHandler(error, 'Error retrieving slideshow');
  }
}
