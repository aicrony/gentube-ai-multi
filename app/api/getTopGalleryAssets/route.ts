import { NextRequest, NextResponse } from 'next/server';
import { getTopGalleryAssets } from '@/utils/gcloud/userAssets';

export async function GET(request: NextRequest) {
  try {
    // Get the top 10 gallery assets by heart count
    const topAssets = await getTopGalleryAssets(10);
    return NextResponse.json(topAssets);
  } catch (error) {
    console.error('Failed to fetch top gallery assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top gallery assets' },
      { status: 500 }
    );
  }
}
