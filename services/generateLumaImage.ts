import axios from 'axios';
import { pingUntilImageCompleted } from '@/functions/getLumaImageResult';
import uploadImageToGCSFromUrl from '@/utils/gcloud/uploadImage';
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
      // Image Reference
      const imageRef = {
        url: 'http://storage-of-image.gcloud.com',
        weight: 50
      };
      // Style Reference
      const styleRef = {
        url: 'http://storage-of-style-image.gcloud.com',
        weight: 50
      };

      // Character Reference
      const characterRef = {
        identity0: {
          images: ['http://storage-of-character-image.gcloud.com']
        }
      };

      // Modify Image Reference
      const modifyImageRef = {
        url: 'http://storage-of-modify-image.gcloud.com',
        weight: 50
      };

      // Callback queue
      const callbackQueue = 'https://gentube.ai/api/callback_queue';

      // Send the img url and the description
      const data = {
        generation_type: 'image',
        model: 'photon-1',
        prompt: description,
        callback_queue: callbackQueue ? callbackQueue : null,
        modify_image_ref: modifyImageRef ? modifyImageRef : null,
        style_ref: styleRef ? [styleRef] : null,
        character_ref: characterRef ? characterRef : null,
        image_ref: imageRef ? [imageRef] : null
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
      return await uploadImageToGCSFromUrl('default', imageResponse);
    }
  } catch (error) {
    console.error('An error occurred while generating the image:', error);
  }
}
