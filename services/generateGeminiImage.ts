import { GoogleGenAI } from '@google/genai';
import { uploadImageToGCSFromBase64 } from '@/utils/gcloud/uploadImage';
require('dotenv').config();

const geminiApiKey = process.env.GEMINI_API_KEY as string;
const geminiImageModel = process.env.GEMINI_IMAGE_MODEL as string || 'gemini-2.5-flash-image-preview';

// Define response types for TypeScript
export interface GeminiImageResponse {
  status: string;
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
  logs: any;
  metrics: any;
  queue_position?: number;
  output?: {
    image: string;
  };
}

export interface GeminiImageCallback {
  webhook: string;
  response: GeminiImageResponse | null;
}

/**
 * Generate an image using Gemini API and upload it to Google Cloud Storage
 * This function is designed to be a drop-in replacement for generateFalImage.ts
 * 
 * @param loop - Kept for API compatibility with generateFalImage, not actually used
 * @param imagePrompt - The text prompt for the image generation
 * @returns A callback object with webhook (for compatibility) and response properties
 */
export default async function generateGeminiImage(
  loop: string,
  imagePrompt: string | undefined
): Promise<GeminiImageCallback | undefined> {
  try {
    // Keep the same response structure as FAL for compatibility
    let result: GeminiImageResponse | null = null;
    const callback: GeminiImageCallback = {
      webhook: process.env.FAL_IMAGE_API_WEBHOOK as string,
      response: null
    };

    // If we're in test mode, return a mock response
    if (
      process.env.FAL_IMAGE_TEST_MODE &&
      process.env.FAL_IMAGE_TEST_MODE === 'true'
    ) {
      const requestId = 'gemini-test-' + Date.now();
      result = {
        status: 'IN_QUEUE',
        request_id: requestId,
        response_url: `https://gemini-api.google/requests/${requestId}`,
        status_url: `https://gemini-api.google/requests/${requestId}/status`,
        cancel_url: `https://gemini-api.google/requests/${requestId}/cancel`,
        logs: null,
        metrics: {},
        queue_position: 0
      };
    } else {
      if (!imagePrompt) {
        throw new Error('Image prompt is required');
      }

      // Initialize the Google Generative AI client
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      
      console.log('Generating image with Gemini API:', imagePrompt);
      
      // Generate the image using the models.generateContent method
      const response = await ai.models.generateContent({
        model: geminiImageModel,
        contents: imagePrompt
      });
      
      // Extract the image data
      let imageData: string | null = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageData = part.inlineData.data;
            break;
          }
        }
      }
      
      if (!imageData) {
        throw new Error('No image data was generated');
      }
      
      console.log('Image data received from Gemini API');
      
      // Upload the image to Google Cloud Storage
      const imageUrl = await uploadImageToGCSFromBase64('default', imageData);
      console.log('Image uploaded to GCS:', imageUrl);
      
      // Create a request ID from the image URL
      const requestId = imageUrl.split('/').pop()?.split('.')[0] || `gemini-${Date.now()}`;
      
      // Return in the same format as FAL for compatibility
      result = {
        status: 'COMPLETED',
        request_id: requestId,
        response_url: imageUrl,
        status_url: `https://gemini-api.google/requests/${requestId}/status`,
        cancel_url: `https://gemini-api.google/requests/${requestId}/cancel`,
        logs: null,
        metrics: {},
        output: {
          image: imageUrl
        }
      };
    }

    console.log('Webhook set: ', callback.webhook);
    callback.response = result;
    return callback;
  } catch (error) {
    console.error('An error occurred while generating the image:', error);
    return undefined;
  }
}