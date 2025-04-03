import { NextRequest, NextResponse } from 'next/server';
import { processUserVideoRequest } from '@/utils/gcloud/processUserVideoRequest';
import { localIpConfig } from '@/utils/ipUtils';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Parse the request body
    const body = await request.json();
    console.log('userId: ', userId);
    console.log('userIp: ', localIpConfig(userIp));
    console.log('description: ', body.description);
    
    const videoDescription = body.description as string;
    const duration = body.duration as string;
    const aspectRatio = body.aspectRatio as string;
    const loop = body.loop;
    const motion = body.motion as string;
    const imageUrl = (body.url as string) || 'none';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }

    const userResponse = await processUserVideoRequest(
      userId,
      userIp,
      videoDescription,
      imageUrl,
      duration,
      aspectRatio,
      loop,
      motion
    );

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error processing video request:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred' }, 
        { status: 500 }
      );
    }
  }
}
