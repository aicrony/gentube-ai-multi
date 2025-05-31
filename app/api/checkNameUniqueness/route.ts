import { NextRequest, NextResponse } from 'next/server';
import { isNameUnique } from '@/utils/gcloud/checkNameUniqueness';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const userId = searchParams.get('userId');

    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId parameter is required' },
        { status: 400 }
      );
    }

    const isUnique = await isNameUnique(name, userId);

    return NextResponse.json({ isUnique });
  } catch (error) {
    console.error('Error checking name uniqueness:', error);
    return NextResponse.json(
      { error: 'Failed to check name uniqueness' },
      { status: 500 }
    );
  }
}
