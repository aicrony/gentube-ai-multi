import { NextRequest, NextResponse } from 'next/server';
import { getPublicAssets } from '@/utils/gcloud/userAssets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get('limit') || '100';
  const offset = searchParams.get('offset') || '0';

  try {
    const assetUrls = await getPublicAssets(Number(limit), Number(offset));
    return NextResponse.json(assetUrls);
  } catch (error) {
    console.error('Failed to fetch public assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public assets' },
      { status: 500 }
    );
  }
}
