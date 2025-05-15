import { NextRequest, NextResponse } from 'next/server';
import { toggleAssetLike } from '@/utils/gcloud/userLikes';

export async function POST(request: NextRequest) {
  try {
    const { userId, assetId, action } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Action should be 'like' or 'unlike'
    if (action !== 'like' && action !== 'unlike') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "like" or "unlike"' },
        { status: 400 }
      );
    }

    const result = await toggleAssetLike(userId, assetId, action);
    
    return NextResponse.json({
      success: true,
      likesCount: result.likesCount,
      isLiked: result.isLiked
    });
  } catch (error) {
    console.error('Failed to toggle asset like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle asset like' },
      { status: 500 }
    );
  }
}