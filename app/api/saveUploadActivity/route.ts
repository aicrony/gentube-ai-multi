import { NextRequest, NextResponse } from 'next/server';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';

// App Router route configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds timeout
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get userId from headers instead of body for security
    const userId = request.headers.get('x-user-id');
    const userIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Require both userId and userIp
    if (!userId || userId === 'none') {
      return NextResponse.json(
        { error: 'User ID is required. Please sign in for free credits.' }, 
        { status: 430 } // Custom status code for sign-in required
      );
    }
    
    if (!userIp || userIp === 'unknown') {
      return NextResponse.json(
        { error: 'User IP is required' }, 
        { status: 400 }
      );
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Save user activity
    await saveUserActivity({
      id: undefined,
      AssetSource: '',
      AssetType: 'upl',
      CountedAssetPreviousState: 0,
      CountedAssetState: 0,
      CreatedAssetUrl: imageUrl,
      DateTime: new Date().toISOString(),
      Prompt: '',
      SubscriptionTier: 0,
      UserId: userId,
      UserIp: userIp
    });

    return NextResponse.json({ 
      success: true,
      url: imageUrl
    });

  } catch (error) {
    console.error('Error saving upload activity:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving the upload activity' },
      { status: 500 }
    );
  }
}