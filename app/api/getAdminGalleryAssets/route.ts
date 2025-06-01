import { NextRequest, NextResponse } from 'next/server';
import { getGalleryAssets } from '@/utils/gcloud/userAssets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get('limit') || '100';
  const offset = searchParams.get('offset') || '0';

  try {
    // For admin, get all gallery assets including those marked for removal
    // This could be extended to include additional admin-specific fields
    const assetUrls = await getGalleryAssets(Number(limit), Number(offset));
    
    // Add admin-specific metadata if needed
    const adminAssets = assetUrls.map(asset => ({
      ...asset,
      isAdmin: true, // Flag to indicate this is from admin view
      // Add other admin-specific fields here if needed
    }));
    
    return NextResponse.json(adminAssets);
  } catch (error) {
    console.error('Failed to fetch admin gallery assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin gallery assets' },
      { status: 500 }
    );
  }
}