// pages/api/video.ts
import { NextApiRequest, NextApiResponse } from 'next';
import callVideoApi from '@/services/generateVideo';
import uploadImageToGCSFromUrl from "@/functions/uploadImage"; // adjust the path according to your project structure

// This function can run for a maximum of 5 seconds
export const config = {
    maxDuration: 120,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const imageUrl = req.query.url as string;

        // TODO: We need to get the URL of the image
        console.log("Image URL: " + imageUrl);

        // Upload the image to Google Cloud Storage
        const uploadedImageUrl = uploadImageToGCSFromUrl(imageUrl);

        const result = await callVideoApi(await uploadedImageUrl);
        console.log("RESULT: " + result);
        res.status(200).send(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
}