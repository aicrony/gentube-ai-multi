// pages/api/video.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { callImageApi } from '@/services/generateImage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const imagePrompt = req.query.prompt;
        const result = await callImageApi(imagePrompt);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
}
