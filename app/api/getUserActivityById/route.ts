import { NextRequest, NextResponse } from 'next/server';
import { getUserActivityById } from '@/utils/gcloud/getUserActivityById';

export async function GET(request: NextRequest) {
  try {
    // Get the ID from the query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Validate the ID parameter
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Fetch the UserActivity by ID
    const activity = await getUserActivityById(id);

    // If no activity was found, return a 404
    if (!activity) {
      return NextResponse.json(
        { error: 'UserActivity not found' },
        { status: 404 }
      );
    }

    // Return the activity
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Failed to fetch UserActivity by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UserActivity' },
      { status: 500 }
    );
  }
}