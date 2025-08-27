# Gemini Image Generation Integration

This document describes the integration of Google's Gemini API for image generation in the Gentube AI platform as an alternative to the FAL image generation service.

## Overview

The Gentube AI platform uses FAL.ai for image generation. This integration adds support for Google's Gemini AI as an alternative image generation service, maintaining the same interface and functionality.

## Implementation

### Files Created

- `services/generateGeminiImage.ts` - Main implementation that mirrors the functionality of `generateFalImage.ts`
- `tests/generateGeminiImage.test.ts` - Unit tests for the new implementation
- `examples/useGeminiImage.ts` - Example usage and integration guide

### Configuration

The following environment variables are used:

```
GEMINI_API_KEY=your_gemini_api_key
GEMINI_IMAGE_MODEL=models/gemini-2.5-flash-image-preview
```

### Usage

The `generateGeminiImage` function has the same signature and behavior as `generateFalImage`, allowing it to be used as a drop-in replacement:

```typescript
import callGeminiImageApi from '@/services/generateGeminiImage';

// Generate an image with Gemini
const result = await callGeminiImageApi('none', 'A prompt describing the image');

// The result has the same structure as the FAL.ai response
const requestId = result.response.request_id;
```

### Integration Process

To use Gemini instead of FAL for image generation:

1. Install the Google Generative AI package:
   ```
   npm install --save @google/genai
   ```

2. Update the code that calls `generateFalImage` to call `generateGeminiImage` instead:
   ```typescript
   // Replace this:
   import callImageApi from '@/services/generateFalImage';
   
   // With this:
   import callImageApi from '@/services/generateGeminiImage';
   ```

   No other changes are needed, as the function signature and response format are compatible.

### Webhook Support

Like the FAL implementation, the Gemini implementation supports webhooks for asynchronous processing. The function returns immediately with a request ID, and the actual image URL will be sent to the webhook URL when processing is complete.

The webhook receives a payload with the following structure:

```json
{
  "request_id": "gemini-1234567890",
  "output": {
    "image": "https://storage.googleapis.com/gen-image-storage/gemini-1234567890.png"
  },
  "status": "COMPLETED"
}
```

In case of an error:

```json
{
  "request_id": "gemini-1234567890",
  "error": "Error message",
  "status": "FAILED"
}
```

## Test Mode

When `FAL_IMAGE_TEST_MODE=true` is set in the environment, the function returns a mock response without actually calling the Gemini API, similar to the FAL implementation.

## Differences from FAL Implementation

While the interface is the same, there are some implementation differences:

1. Gemini doesn't support all the same parameters as FAL (such as aspect ratio and safety tolerance)
2. The actual image generation process is different
3. The generated images will have different styles and characteristics

## Future Improvements

Potential future improvements to the implementation:

1. Add support for more Gemini-specific parameters
2. Implement a proper background job queue for processing
3. Add better error handling and retry logic
4. Support batch generation of multiple images