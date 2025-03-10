import type { NextApiRequest, NextApiResponse } from 'next';
import { fileTypeFromBuffer } from 'file-type';
import heicConvert from 'heic-convert';
import { uploadImageToGCSFromBase64 } from '@/utils/gcloud/uploadImage';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb' // Set the maximum body size to 5MB
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { image, userId, userIp } = req.body;

  if (!image) {
    res.status(400).json({ error: 'Image data is required' });
    return;
  }

  try {
    let imageBuffer = Buffer.from(image, 'base64');
    const fileType = await fileTypeFromBuffer(imageBuffer);

    if (!fileType) {
      res.status(400).json({ error: 'File type could not be determined' });
      return;
    }

    if (fileType.ext === 'heic') {
      // Convert HEIC to PNG
      const outputBuffer = await heicConvert({
        buffer: imageBuffer, // the HEIC file buffer
        format: 'PNG', // output format
        quality: 1 // quality of the output image, between 0 and 1
      });
      imageBuffer = outputBuffer;
    }

    console.log('fileType:', fileType.ext);

    const base64Image = imageBuffer.toString('base64');
    const imageUrl = await uploadImageToGCSFromBase64(
      process.env.GCLOUD_TEMP_PUBLIC_BUCKET_NAME,
      base64Image
    );

    // Save user activity
    await saveUserActivity({
      id: undefined,
      AssetSource: '',
      AssetType: 'upl',
      CountedAssetPreviousState: 0,
      CountedAssetState: 0,
      CreatedAssetUrl: imageUrl,
      DateTime: new Date().toISOString(),
      Prompt: '',
      SubscriptionTier: 0,
      UserId: userId,
      UserIp: userIp
    });

    res.status(200).json({ url: imageUrl, fileType: fileType.ext });
  } catch (error) {
    console.error('Conversion error:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while uploading the image' });
  }
}
