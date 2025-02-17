import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/falvideoresult');
    return;
  }

  console.log('Received data:', req.body);

  res.status(200).json({ message: 'Data received successfully' });
}
