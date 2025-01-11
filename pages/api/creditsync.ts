import { NextApiRequest, NextApiResponse } from 'next';
import { updateUserCredits } from '@/utils/gcloud/userCredits';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/creditsync');
    return;
  }

  try {
    console.log('Request body:', req.body);
    const { type, table, record, schema, old_record } = req.body;
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
      await updateUserCredits(user_id, '-', credits_purchased);
      res.status(200).json({ received: true });
    } else {
      res.status(200).json({ received: false });
    }
  } catch (error) {
    console.error('Sync Webhook handler failed.', error);
    res.status(500).json({ error: 'Sync Webhook handler failed.' });
  }
}
