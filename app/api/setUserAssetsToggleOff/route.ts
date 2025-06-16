import { NextRequest, NextResponse } from 'next/server';
import { toggleOffGallery } from '@/utils/gcloud/userGalleryToggle';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assetUrl } = body;

    console.log('userId:', userId);
    console.log('assetUrl:', assetUrl);

    if (!userId || !assetUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const assets = await toggleOffGallery(userId, assetUrl);
    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Failed to fetch user assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user assets' },
      { status: 500 }
    );
  }
}
