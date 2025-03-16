import { NextRequest, NextResponse } from 'next/server';
import { aggregateUserCredits } from '@/utils/gcloud/processUserImageRequest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { type, table, record, schema, old_record } = body;
    console.log('Type:', type);
    console.log('Table:', table);
    console.log('Record:', record);
    console.log('Schema:', schema);
    console.log('Old Record:', old_record);

    if (record) {
      const { id, amount, user_id, currency, created_at, credits_purchased } =
        record;
      console.log('Record ID:', id);
      console.log('Amount:', amount);
      console.log('User ID:', user_id);
      console.log('Currency:', currency);
      console.log('Created At:', created_at);
      console.log('Credits Purchased:', credits_purchased);
      await aggregateUserCredits(user_id, '-', credits_purchased);
      return NextResponse.json({ received: true });
    } else {
      return NextResponse.json({ received: false });
    }
  } catch (error) {
    console.error('Sync Webhook handler failed.', error);
    return NextResponse.json(
      { error: 'Sync Webhook handler failed.' },
      { status: 500 }
    );
  }
}