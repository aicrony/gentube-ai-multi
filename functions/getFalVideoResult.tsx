// You will need to save the request IDs in a database and then use them to retrieve the video statuses.
// Then continue this process or trend with the other video generation types.

// import { fal } from '@fal-ai/client';

import axios from 'axios';
// import { Storage } from '@google-cloud/storage';
require('dotenv').config();

export async function pingUntilCompleted(requestId: string): Promise<any> {
  const url = `${process.env.FAL_QUEUE_ENDPOINT}/${requestId}/status`;
  const headers = {
    accept: 'application/json'
  };

  while (true) {
    try {
      const response = await axios.get(url, { headers });
      const state = response.statusText;

      if (state === 'COMPLETED') {
        console.log('Video generation is completed.');
        console.log('Video URL:', JSON.stringify(response));
        return JSON.stringify(response);
      }

      console.log(`Current state: ${state}. Retrying in 10 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 100000));
    } catch (error) {
      console.error('An error occurred while pinging the URL:', error);
      throw error;
    }
  }
}
