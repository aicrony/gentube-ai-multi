import { NextRequest, NextResponse } from 'next/server';
import { getUserAssets } from '@/utils/gcloud/userAssets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const userIp = searchParams.get('userIp');
  const limit = searchParams.get('limit') || '10';
  const offset = searchParams.get('offset') || '0';
  const assetType = searchParams.get('assetType');
  const searchPrompt = searchParams.get('searchPrompt');

  console.log('USER-IP: ' + userIp);

  if (!userId || !userIp) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  if (userIp !== 'unknown') {
    try {
      const assets = await getUserAssets(
        userId,
        userIp,
        Number(limit),
        Number(offset),
        assetType || undefined,
        searchPrompt
      );

      // Check if we have more assets available from the hasMore flag on the first asset
      const hasMore = assets && assets.length > 0 ? assets[0].hasMore : false;

      // Remove the hasMore flag from each asset before returning (it was only for internal use)
      const cleanAssets = assets
        ? assets.map((asset) => {
            const { hasMore, ...cleanAsset } = asset;
            return cleanAsset;
          })
        : [];

      return NextResponse.json({
        assets: cleanAssets,
        hasMore: hasMore
      });
    } catch (error) {
      console.error('Failed to fetch user assets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user assets' },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json({ assets: [], hasMore: false });
  }
}
