import { NextRequest, NextResponse } from 'next/server';
import { processUserImageRequest } from '@/utils/gcloud/processUserImageRequest';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Parse the request body
    const body = await request.json();
    console.log('userId: ', userId);
    console.log('userIp: ', userIp);
    console.log('prompt: ', body.prompt);

    // Validate prompt length - Google Cloud Datastore has limits
    const MAX_PROMPT_LENGTH = 1500; // Setting a reasonable limit
    const prompt = body.prompt ? body.prompt : '';

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.`,
          promptLength: prompt.length
        },
        { status: 400 }
      );
    }

    console.log('Prompt OK');

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

    const userResponse = await processUserImageRequest(userId, userIp, prompt);

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error processing image request:', error);

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

function encodeCount(count: number): string {
  return Buffer.from(count.toString()).toString('base64');
}

function decodeCount(encodedCount: string): number {
  return parseInt(Buffer.from(encodedCount, 'base64').toString('ascii'), 10);
}
