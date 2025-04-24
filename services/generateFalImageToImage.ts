import { fal } from '@fal-ai/client';
require('dotenv').config();

const apiEndpoint = process.env.BRIA_API_ENDPOINT as string;
const falApiWebhook = process.env.FAL_IMAGE_API_WEBHOOK as string;

interface ProductImageParams {
  image_url: string;
  scene_description: string;
  ref_image_url: string;
  optimize_description?: boolean;
  num_results?: number;
  fast?: boolean;
  placement_type?: string;
  shot_size?: [number, number];
  manual_placement_selection?: string;
}

export default async function generateFalImageToImage(
  params: ProductImageParams
) {
  let result: any = null;
  const callback = {
    webhook: falApiWebhook,
    response: result
  };

  try {
    // Check if we're in test mode
    if (
      process.env.FAL_IMAGE_TEST_MODE &&
      process.env.FAL_IMAGE_TEST_MODE === 'true'
    ) {
      // Return a mock response for testing
      result = {
        status: 'IN_QUEUE',
        request_id: 'f3cdc601-9c51-4cc7-a961-23d3280599c2',
        response_url:
          'https://queue.fal.run/fal-ai/bria-product-image/requests/f3cdc601-9c51-4cc7-a961-23d3280599c2',
        status_url:
          'https://queue.fal.run/fal-ai/bria-product-image/requests/f3cdc601-9c51-4cc7-a961-23d3280599c2/status',
        cancel_url:
          'https://queue.fal.run/fal-ai/bria-product-image/requests/f3cdc601-9c51-4cc7-a961-23d3280599c2/cancel',
        logs: null,
        metrics: {},
        queue_position: 0
      };
    } else {
      // Make the actual API call
      result = await fal.queue.submit(apiEndpoint, {
        input: {
          prompt: params.scene_description,
          image_url: params.image_url,
          scene_description: params.scene_description,
          ref_image_url: params.ref_image_url,
          optimize_description: params.optimize_description ?? true,
          num_results: params.num_results ?? 1,
          fast: params.fast ?? true,
          placement_type: params.placement_type ?? 'manual_placement',
          shot_size: params.shot_size ?? [1000, 1000],
          manual_placement_selection:
            params.manual_placement_selection ?? 'bottom_center'
        },
        webhookUrl: falApiWebhook
      });
    }

    console.log('Webhook set: ', falApiWebhook);
    callback.response = result;
    return callback;
  } catch (error) {
    console.error('An error occurred while generating the image:', error);
    throw error;
  }
}
