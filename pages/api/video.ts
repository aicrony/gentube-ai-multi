// pages/api/video.ts
import { NextApiRequest, NextApiResponse } from 'next';
import callVideoApi from '@/services/generateLumaVideo';
import uploadImageToGCSFromUrl from '@/functions/uploadImage'; // adjust the path according to your project structure

// This function can run for a maximum of 5 seconds
export const config = {
  maxDuration: 120
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const imageUrl = req.query.url as string;
    const videoDescription = req.query.description as string;

    // TODO: We need to get the URL of the image
    console.log('Image URL: ' + imageUrl);
    console.log('Video Description: ' + videoDescription);

    // Upload the image to Google Cloud Storage
    // const uploadedImageUrl = uploadImageToGCSFromUrl(imageUrl);

    // const result = await callVideoApi(await uploadedImageUrl);
    const result = await callVideoApi(imageUrl, videoDescription);
    // https://storage.googleapis.com/gen-image-storage/ZHaFG4T_M4zQxj2JwY6ig.png

    console.log('RESULT: ' + result);
    res.status(200).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}
