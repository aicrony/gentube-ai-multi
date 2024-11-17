// Next.js API route: /pages/api/sendImageToStability.js
import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { imageName } = req.body;
  if (!imageName) {
    return res.status(400).json({ error: 'Image name is required' });
  }

  const storage = new Storage();
  const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME);

  const file = bucket.file(imageName);
  const stream = file.createReadStream();

  const formData = new FormData();
  formData.append('image', stream, imageName);

  // Add other parameters as needed
  formData.append('seed', 0);
  formData.append('cfg_scale', 3);
  formData.append('motion_bucket_id', 150);

  try {
    const response = await axios.post(
      process.env.STABILITY_API_ENDPOINT,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`
        },
        validateStatus: undefined
      }
    );

    if (response.status === 200) {
      // Handle success
      console.log('Success:', response.data);
      res.status(200).json(response.data);
    } else {
      // Handle error
      console.error('Error:', response.data);
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error('Request failed:', error);
    res.status(500).json({ error: 'Failed to send image to Stability AI' });
  }
}
