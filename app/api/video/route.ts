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
    console.log('duration: ', body.duration);
    console.log('aspectRatio: ', body.aspectRatio);
    console.log('loop: ', body.loop);
    console.log('motion: ', body.motion);
    console.log('imageUrl: ', body.url);

    // Validate prompt length - Google Cloud Datastore has limits
    const MAX_PROMPT_LENGTH = 1500; // Setting a reasonable limit
    const videoDescription = body.description as string;
    
    if (videoDescription && videoDescription.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { 
          error: `Video description is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.`,
          promptLength: videoDescription.length
        }, 
        { status: 400 }
      );
    }
    
    const duration = body.duration as string;
    const aspectRatio = body.aspectRatio as string;
    const loop = body.loop;
    const motion = body.motion as string;
    const imageUrl = (body.url as string) || 'none';

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
}
