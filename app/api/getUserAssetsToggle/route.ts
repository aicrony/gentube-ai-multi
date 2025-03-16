import { NextRequest, NextResponse } from 'next/server';
import { getUserAssetsToggle } from '@/utils/gcloud/userAssetsToggle';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const limit = searchParams.get('limit') || '10';
  const offset = searchParams.get('offset') || '0';
  const assetType = searchParams.get('assetType');
  const subscriptionTier = searchParams.get('subscriptionTier') || '0';

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const assets = await getUserAssetsToggle(
      userId,
      Number(limit),
      Number(offset),
      assetType || undefined,
      Number(subscriptionTier)
    );
    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Failed to fetch user assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user assets' },
      { status: 500 }
    );
  }
}