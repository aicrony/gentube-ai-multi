// pages/api/video.ts
import { NextApiRequest, NextApiResponse } from 'next';
import callVideoApi from '@/services/generateLumaVideo';
import uploadImageToGCSFromUrl from '@/functions/uploadImage';
import Downloader from '@/components/dynamic/downloader';
import React from 'react'; // adjust the path according to your project structure

// This function can run for a maximum of 5 seconds
export const config = {
  maxDuration: 120
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const videoDescription = req.query.description as string;
    if (req.query.url !== undefined) {
      const imageUrl = req.query.url as string;
      console.log('Image URL: ' + imageUrl);
      console.log('Video Description: ' + videoDescription);
      const result = await callVideoApi(imageUrl, videoDescription);
      console.log('RESULT: ' + result);
      res.status(200).send(result);
    } else {
      console.log('Video Description: ' + videoDescription);
      const result = await callVideoApi('none', videoDescription);
      console.log('RESULT: ' + result);
      res.status(200).send(result);
    }

    // TODO: We need to get the URL of the image
    console.log('Video Description: ' + videoDescription);

    // Upload the image to Google Cloud Storage
    // const uploadedImageUrl = uploadImageToGCSFromUrl(imageUrl);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}
