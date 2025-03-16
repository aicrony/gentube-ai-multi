import { getUserCredits } from '@/utils/gcloud/getUserCredits';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const userIp = searchParams.get('userIp');

  if (!userId || !userIp) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    console.log(
      '+++++++++++++++++++++++++++++ Get User Credits - api/getUserCredits +++++++++++++++++++++++++++++'
    );
    console.log('User ID: ' + userId);
    console.log('User IP: ' + userIp);
    
    const credits = await getUserCredits(userId, userIp);
    console.log('getUserCredits: ', credits);
    
    return NextResponse.json({ credits });
  } catch (error) {
    console.error('Failed to fetch user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user credits' },
      { status: 500 }
    );
  }
}