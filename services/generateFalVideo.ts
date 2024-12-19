import { fal, InProgressQueueStatus, QueueStatus } from '@fal-ai/client';
require('dotenv').config();

const apiEndpoint = process.env.KLING_API_ENDPOINT as string;

export default async function generateFalVideo(
  url: string,
  description: string
) {
  try {
    const result = await fal.subscribe(apiEndpoint, {
      input: {
        prompt: description,
        image_url: url,
        duration: '5', // 5,10 for Kling; 4,6 for Haiper
        aspect_ratio: '16:9'
      },
      logs: true,
      onQueueUpdate: (status: QueueStatus) => {
        if (status.status === 'IN_PROGRESS') {
          (status as InProgressQueueStatus).logs
            .map((log: { message: string }) => log.message)
            .forEach(console.log);
        }
      }
    });
    console.log(result.data);
    console.log(result.requestId);

    return result.data.video.url;
  } catch (error) {
    console.error('An error occurred while generating the video:', error);
  }
}
