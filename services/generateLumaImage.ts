import axios from 'axios';
import { pingUntilImageCompleted } from '@/functions/getLumaImageResult';
import uploadImageToGCSFromUrl from '@/functions/uploadImage';
require('dotenv').config();

const apiKey = process.env.LUMA_API_KEY;
const apiEndpoint = process.env.LUMA_API_ENDPOINT;
const apiImageEndpoint = apiEndpoint + '/image';

export default async function generateLumaImage(
  url: string,
  description: string
) {
  try {
    if (url !== 'none') {
      // Send the imag url and the description
      const data = {
        prompt: description,
        model: 'photon-1'
      };
      const response = await axios.request({
        url: apiImageEndpoint,
        method: 'post',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json'
        },
        data: data
      });
      console.log(
        'Response from LumaLabs (image): ',
        JSON.stringify(response.data)
      );
      console.log('Generation ID (image):', response.data.id);
      console.log('State (image):', response.data.state);
      // console.log('Video URL:', response.data.assets.video);
      const imageResponse = await pingUntilImageCompleted(response.data.id);
      console.log(imageResponse);
      // Call getVideoResult with the generation ID
      return imageResponse;
    } else {
      // Just send the description
      const data = {
        prompt: description
      };

      const response = await axios.request({
        url: apiImageEndpoint,
        method: 'post',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json'
        },
        data: data
      });
      console.log(
        'Response from LumaLabs (image): ',
        JSON.stringify(response.data)
      );
      console.log('Generation ID (image):', response.data.id);
      console.log('State (image):', response.data.state);
      // console.log('Video URL:', response.data.assets.video);
      const imageResponse = await pingUntilImageCompleted(response.data.id);
      console.log('IMAGE URL: ' + imageResponse);
      return await uploadImageToGCSFromUrl(imageResponse);
    }
  } catch (error) {
    console.error('An error occurred while generating the image:', error);
  }
}
