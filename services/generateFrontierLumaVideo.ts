import axios from 'axios';
import { pingUntilVideoCompleted } from '@/functions/getLumaVideoResult';
require('dotenv').config();

const apiKey = process.env.LUMA_API_KEY;
const apiEndpoint = process.env.LUMA_API_ENDPOINT;

export default async function generateFrontierLumaVideo(
  url: string,
  description: string,
  // no duration option in Luma Image to Video as of 2/16/25, only Luma Text to Video
  loop: string,
  aspectRatio: string
) {
  try {
    const data =
      url !== 'none'
        ? {
            prompt: description,
            aspect_ratio: aspectRatio,
            loop: loop,
            model: 'ray-2',
            keyframes: {
              frame0: {
                type: 'image',
                url: url
              }
            }
          }
        : {
            prompt: description,
            aspect_ratio: aspectRatio,
            loop: loop
          };

    const response = await axios.request({
      url: apiEndpoint,
      method: 'post',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      data: data
    });
    console.log('Response from LumaLabs: ', JSON.stringify(response.data));
    console.log('Generation ID:', response.data.id);
    console.log('State:', response.data.state);
    const videoResponse = await pingUntilVideoCompleted(response.data.id);
    console.log(videoResponse);
    return videoResponse;
  } catch (error) {
    console.error('An error occurred while generating the video:', error);
    throw new Error('Failed to generate video');
  }
}
