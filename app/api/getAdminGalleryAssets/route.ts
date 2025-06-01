import { NextRequest, NextResponse } from 'next/server';
import { getAllAssets } from '@/utils/gcloud/userAssets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get('limit') || '100';
  const offset = searchParams.get('offset') || '0';

  try {
    // For admin, get ALL assets from UserActivity (not filtered by SubscriptionTier)
    // This shows every image/video that has been generated, uploaded, or processed
    const assetUrls = await getAllAssets(Number(limit), Number(offset));
    
    // Add admin-specific metadata if needed
    const adminAssets = assetUrls?.map(asset => ({
      ...asset,
      isAdmin: true, // Flag to indicate this is from admin view
      // Add other admin-specific fields here if needed
    })) || [];
    
    return NextResponse.json(adminAssets);
  } catch (error) {
    console.error('Failed to fetch admin gallery assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin gallery assets' },
      { status: 500 }
    );
  }
}