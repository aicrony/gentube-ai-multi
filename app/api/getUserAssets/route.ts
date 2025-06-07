import { NextRequest, NextResponse } from 'next/server';
import { getUserAssets } from '@/utils/gcloud/userAssets';
import { getUserAssetsWithGroups } from '@/utils/gcloud/groupManager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const userIp = searchParams.get('userIp');
  const limit = searchParams.get('limit') || '10';
  const offset = searchParams.get('offset') || '0';
  const assetType = searchParams.get('assetType');
  const groupId = searchParams.get('groupId'); // New parameter for group filtering
  const includeGroups = searchParams.get('includeGroups') === 'true'; // Whether to include group info

  console.log('USER-IP: ' + userIp);
  console.log('API groupId received:', groupId, 'type:', typeof groupId);
  console.log('API includeGroups:', includeGroups);

  if (!userId && !userIp) {
    return NextResponse.json(
      { error: 'Missing required parameters - need either userId or userIp' },
      { status: 400 }
    );
  }

  try {
    // Only return empty array if BOTH conditions are true:
    // 1. userIp is 'unknown' or missing AND
    // 2. userId is missing or 'none'
    if ((userIp === 'unknown' || !userIp) && (!userId || userId === 'none')) {
      console.log('Skipping fetch: no valid identification parameters');
      return NextResponse.json({ assets: [] });
    }
    
    // Log all valid parameters to help with debugging
    const validUserId = userId && userId !== 'none';
    const validUserIp = userIp && userIp !== 'unknown';
    console.log(`Proceeding with fetch - Valid userId: ${validUserId}, Valid userIp: ${validUserIp}`);
    
    // If we got here, we have at least one valid parameter (userId or userIp)

    let assets;
    
    console.log(`Fetching assets for userId: ${userId}, userIp: ${userIp}`);

    if (groupId || includeGroups) {
      // Use enhanced function that includes group information
      assets = await getUserAssetsWithGroups(
        userId,
        userIp,
        Number(limit),
        Number(offset),
        assetType || undefined,
        groupId || undefined
      );
    } else {
      // Use original function for backward compatibility
      assets = await getUserAssets(
        userId,
        userIp,
        Number(limit),
        Number(offset),
        assetType || undefined
      );
    }

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Failed to fetch user assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user assets' },
      { status: 500 }
    );
  }
}
