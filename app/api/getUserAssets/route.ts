import { NextRequest, NextResponse } from 'next/server';
import { getUserAssets } from '@/utils/gcloud/userAssets';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const userIp = searchParams.get('userIp');
  const limit = searchParams.get('limit') || '10';
  const offset = searchParams.get('offset') || '0';
  const assetType = searchParams.get('assetType');

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
        assetType || undefined
      );
      
      return NextResponse.json({ assets });
    } catch (error) {
      console.error('Failed to fetch user assets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user assets' },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json({ assets: [] });
  }
}
