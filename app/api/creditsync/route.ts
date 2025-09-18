import { NextRequest, NextResponse } from 'next/server';
import { aggregateUserCredits } from '@/utils/gcloud/processUserImageRequest';
import { getSupabaseUserCreditsTimestamp } from '@/utils/gcloud/getSupabaseUserCreditsTimestamp';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    let creditsPaidLast24: boolean;
    // Check if record exists
    if (!data.record) {
      return NextResponse.json({ received: false }, { status: 200 });
    }

    // Extract necessary data
    const { user_id, credits_purchased } = data.record;

    try {
      // Process credits update
      creditsPaidLast24 = await getSupabaseUserCreditsTimestamp(user_id);
      console.log(`creditsPaidLast24: ${creditsPaidLast24}`);
      if (!creditsPaidLast24) {
        console.error('No recent credit purchases found for user:', user_id);
        return NextResponse.json(
          { error: 'No recent credit purchases found for this user' },
          { status: 400 }
        );
      }
      await aggregateUserCredits(user_id, '-', credits_purchased);
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
      console.error('Error updating user credits:', error);
      // Make sure this explicitly returns a response
      return NextResponse.json(
        { error: 'Sync Webhook handler failed.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Sync Webhook handler failed.' },
      { status: 500 }
    );
  }
}
