/**
 * Example usage of the Gemini image generation service
 * This shows how to replace the FAL image generation with Gemini
 */

import callFalImageApi from '@/services/generateFalImage';
import callGeminiImageApi from '@/services/generateGeminiImage';

// Example function showing how to use the new Gemini image generation
async function generateImageWithGemini(prompt: string) {
  try {
    console.log('Generating image with Gemini API');
    console.log('Prompt:', prompt);
    
    // Call the Gemini image generation API
    // Note: the 'none' parameter is not used by Gemini but is included for API compatibility
    const result = await callGeminiImageApi('none', prompt);
    
    if (!result) {
      throw new Error('Failed to generate image');
    }
    
    console.log('Image generation initiated');
    console.log('Request ID:', result.response.request_id);
    
    // In a real implementation, you would save the request ID
    // and wait for the webhook callback to get the final result
    
    return result.response.request_id;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Example function to demonstrate replacing FAL with Gemini
async function compareImageGenerationMethods(prompt: string) {
  try {
    console.log('Comparing image generation methods');
    
    // Generate with FAL (original method)
    console.log('Generating with FAL:');
    const falResult = await callFalImageApi('none', prompt);
    console.log('FAL request ID:', falResult?.response.request_id);
    
    // Generate with Gemini (new method)
    console.log('Generating with Gemini:');
    const geminiResult = await callGeminiImageApi('none', prompt);
    console.log('Gemini request ID:', geminiResult?.response.request_id);
    
    // Compare the response structures
    console.log('FAL response format:');
    console.log(JSON.stringify(falResult?.response, null, 2));
    
    console.log('Gemini response format:');
    console.log(JSON.stringify(geminiResult?.response, null, 2));
    
    // Both methods return a similar structure that includes:
    // - status (IN_QUEUE)
    // - request_id
    // - URLs for checking status
    
    return {
      falRequestId: falResult?.response.request_id,
      geminiRequestId: geminiResult?.response.request_id
    };
  } catch (error) {
    console.error('Error in comparison:', error);
    throw error;
  }
}

// Example of modifying processUserImageRequest.ts to use Gemini instead of FAL
// In a real implementation, you would update the actual file
// This is just a demonstration of the change needed
async function sampleUsageInUserRequest(userId: string, userIp: string, imagePrompt: string) {
  console.log('Processing user image request with Gemini');
  
  // Original code uses:
  // imageResult = (await callImageApi('none', imagePrompt)) as any;
  
  // Modified to use Gemini:
  const imageResult = (await callGeminiImageApi('none', imagePrompt)) as any;
  
  if (imageResult) {
    console.log(imageResult);
    if (imageResult.webhook) {
      const webhook = imageResult.webhook;
      console.log('Webhook: ', webhook);
      const requestId = imageResult.response.request_id;
      
      // Continue with the rest of the processing
      // The remaining code would be identical to the FAL implementation
      // since the response format is compatible
    }
  }
  
  console.log('Request processed successfully');
}

// Export example functions
export {
  generateImageWithGemini,
  compareImageGenerationMethods,
  sampleUsageInUserRequest
};