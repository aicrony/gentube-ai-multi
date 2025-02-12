import { NextApiRequest, NextApiResponse } from 'next';
import { newUserCredits } from '@/utils/gcloud/userCredits';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/newuser');
    return;
  }

  try {
    console.log('Request body:', req.body);
    const { type, table, record, schema } = req.body;
    console.log('Type:', type);
    console.log('Table:', table);
    console.log('Record:', record);
    console.log('Schema:', schema);

    if (record) {
      const { id } = record;
      console.log('New User Record ID:', id);
      await newUserCredits(id);
      res.status(200).json({ received: true });
    } else {
      res.status(200).json({ received: false });
    }
  } catch (error) {
    console.error('Sync Webhook handler failed.', error);
    res.status(500).json({ error: 'Sync Webhook handler failed.' });
  }
}
