import { NextRequest, NextResponse } from 'next/server';
import { updateUserName } from '@/utils/gcloud/updateUserName';

export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const success = await updateUserName(userId, name);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update user name' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to update user name:', error);
    return NextResponse.json(
      { error: 'Failed to update user name' },
      { status: 500 }
    );
  }
}