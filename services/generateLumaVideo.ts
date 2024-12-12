import axios from 'axios';
import { pingUntilVideoCompleted } from '@/functions/getLumaVideoResult';
require('dotenv').config();

const apiKey = process.env.LUMA_API_KEY;
const apiEndpoint = process.env.LUMA_API_ENDPOINT;

export default async function generateLumaVideo(
  url: string,
  description: string
) {
  try {
    const data =
      url !== 'none'
        ? {
            prompt: description,
            keyframes: {
              frame0: {
                type: 'image',
                url: url
              }
            }
          }
        : {
            prompt: description
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
