import { NextRequest, NextResponse } from 'next/server';
import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const FEEDBACK_KIND = 'Feedback';
const NAMESPACE = 'GenTube';

export interface FeedbackEntry {
  id?: string;
  userId: string;
  feedback: string;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

// POST - Submit feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, feedback } = body;

    if (!feedback || !feedback.trim()) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get additional metadata
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const now = new Date().toISOString();
    const feedbackKey = datastore.key({
      namespace: NAMESPACE,
      path: [FEEDBACK_KIND]
    });

    const feedbackData = {
      userId,
      feedback: feedback.trim(),
      createdAt: now,
      userAgent,
      ipAddress
    };

    await datastore.save({
      key: feedbackKey,
      data: feedbackData
    });

    const savedFeedback: FeedbackEntry = {
      id: feedbackKey.id?.toString(),
      ...feedbackData
    };

    console.log('Feedback saved:', savedFeedback.id, 'from user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: savedFeedback
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve feedback (for admin purposes)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const query = datastore
      .createQuery(NAMESPACE, FEEDBACK_KIND)
      .order('createdAt', { descending: true })
      .limit(limit)
      .offset(offset);

    const [feedbackEntries] = await datastore.runQuery(query);

    const feedback: FeedbackEntry[] = feedbackEntries.map((entry: any) => ({
      id: entry[datastore.KEY].id?.toString() || entry[datastore.KEY].name,
      userId: entry.userId,
      feedback: entry.feedback,
      createdAt: entry.createdAt,
      userAgent: entry.userAgent,
      ipAddress: entry.ipAddress
    }));

    return NextResponse.json({
      success: true,
      feedback,
      total: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
