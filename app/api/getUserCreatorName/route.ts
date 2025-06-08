import { NextRequest, NextResponse } from 'next/server';
import { getUserCreatorName } from '@/utils/gcloud/getUserCreatorName';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user's name from Google Cloud Datastore
    const creatorName = await getUserCreatorName(userId);
    
    return NextResponse.json({ 
      success: true, 
      creatorName 
    });
  } catch (error) {
    console.error('Failed to get creator name:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve creator name' },
      { status: 500 }
    );
  }
}