import { NextRequest, NextResponse } from 'next/server';
import { getAssetLikes, getUserLikedAssets, getBulkAssetLikes } from '@/utils/gcloud/userLikes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assetId = searchParams.get('assetId');
  const assetIds = searchParams.get('assetIds'); // New parameter for bulk likes
  const userId = searchParams.get('userId');

  try {
    // If assetIds is provided, get likes for multiple assets in one request
    if (assetIds) {
      const assetIdArray = assetIds.split(',').filter(Boolean);
      console.log(`Bulk likes request for ${assetIdArray.length} assets`);
      
      if (assetIdArray.length === 0) {
        return NextResponse.json({});
      }
      
      const bulkLikes = await getBulkAssetLikes(assetIdArray, userId || undefined);
      return NextResponse.json(bulkLikes);
    }
    // If assetId is provided, get likes for a specific asset
    else if (assetId) {
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
        { error: 'Either assetId, assetIds or userId is required' },
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