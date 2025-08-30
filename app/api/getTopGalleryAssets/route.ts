import { NextRequest, NextResponse } from 'next/server';
import { getTopGalleryAssets } from '@/utils/gcloud/userAssets';

export async function GET(request: NextRequest) {
  try {
    // Get the top 10 gallery assets by heart count
    // TODO (CONTEST) Step 5 is to set the number of assets to display
    const topAssets = await getTopGalleryAssets(30);
    return NextResponse.json(topAssets);
  } catch (error) {
    console.error('Failed to fetch top gallery assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top gallery assets' },
      { status: 500 }
    );
  }
}
