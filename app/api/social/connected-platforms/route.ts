import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/utils/auth/session';
import { getUserConnectedPlatforms } from '@/utils/gcloud/socialTokens';

export const dynamic = 'force-dynamic';

// Get all platforms that a user has connected to
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get all platforms the user has connected to
    const platforms = await getUserConnectedPlatforms(userId);
    
    return NextResponse.json({ platforms });
  } catch (error: any) {
    console.error('Error getting connected platforms:', error);
    return NextResponse.json(
      { error: 'Failed to get connected platforms' },
      { status: 500 }
    );
  }
}