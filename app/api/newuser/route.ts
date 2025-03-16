import { NextRequest, NextResponse } from 'next/server';
import { newUserCredits } from '@/utils/gcloud/processUserImageRequest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { type, table, record, schema } = body;
    console.log('Type:', type);
    console.log('Table:', table);
    console.log('Record:', record);
    console.log('Schema:', schema);

    if (record) {
      const { id } = record;
      console.log('New User Record ID:', id);
      await newUserCredits(id);
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