import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';
import { Storage } from '@google-cloud/storage';
import getStabilityVideoResult from '../functions/getStabilityVideoResult';
import uploadImageToGCSFromUrl from '../functions/uploadImage';
import sharp from 'sharp';
import extractImageName from '../functions/uploadImage';
import { getFileDataAndResize } from './video_utils';
import { pingUntilCompleted } from '@/functions/getLumaVideoResult';
require('dotenv').config();

const apiKey = process.env.LUMA_API_KEY;
const apiEndpoint = process.env.LUMA_API_ENDPOINT;

export default async function generateLumaVideo(
  url: string,
  description: string
) {
  try {
    const data = {
      prompt: description,
      keyframes: {
        frame0: {
          type: 'image',
          url: url
        }
      }
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
    // console.log('Video URL:', response.data.assets.video);
    const videoResponse = await pingUntilCompleted(response.data.id);
    console.log(videoResponse);

    // Call getVideoResult with the generation ID
    return videoResponse;
  } catch (error) {
    console.error('An error occurred while generating the video:', error);
  }
}
