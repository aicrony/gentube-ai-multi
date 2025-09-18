import { NextRequest, NextResponse } from 'next/server';
import { aggregateUserCredits } from '@/utils/gcloud/processUserImageRequest';
import { getSupabaseUserCreditsTimestamp } from '@/utils/gcloud/getSupabaseUserCreditsTimestamp';
import { updateCreditsValidationTimestamp } from '@/utils/gcloud/updateCreditsValidationTimestamp';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    let creditsPaidLast24: any;
    if (!data.record) {
      return NextResponse.json({ received: false }, { status: 200 });
    }

    const { user_id, credits_purchased } = data.record;

    try {
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
      await updateCreditsValidationTimestamp(user_id, creditsPaidLast24);
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
