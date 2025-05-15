import { NextRequest, NextResponse } from 'next/server';
import { getAssetLikes, getUserLikedAssets } from '@/utils/gcloud/userLikes';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assetId = searchParams.get('assetId');
  const userId = searchParams.get('userId');

  try {
    // If assetId is provided, get likes for a specific asset
    if (assetId) {
      const likes = await getAssetLikes(assetId, userId || undefined);
      return NextResponse.json(likes);
    }

    // If only userId is provided, get all assets liked by the user
    else if (userId) {
      const likedAssets = await getUserLikedAssets(userId);
      return NextResponse.json(likedAssets);
    }

    // If neither is provided, return an error
    else {
      return NextResponse.json(
        { error: 'Either assetId or userId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to fetch asset likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset likes' },
      { status: 500 }
    );
  }
}