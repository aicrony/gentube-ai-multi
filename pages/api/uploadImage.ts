import { NextApiRequest, NextApiResponse } from 'next';
import { uploadImageToGCSFromBase64 } from '@/functions/uploadImage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { image } = req.body;

  if (!image) {
    res.status(400).json({ error: 'Image data is required' });
    return;
  }

  try {
    // console.log('Image Data: ', image);
    // Here you would handle the image upload logic, e.g., saving to a storage service
    // For demonstration, we'll just return the received image data
    console.log('Saving image...');
    const imageUrl = await uploadImageToGCSFromBase64(
      process.env.GCLOUD_USER_BUCKET_NAME,
      image
    );
    console.log('Image URL Created:', imageUrl);

    res.status(200).json({ url: imageUrl });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while uploading the image' });
  }
}
