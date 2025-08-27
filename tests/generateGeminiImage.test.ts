import generateGeminiImage, { GeminiImageResponse } from '../services/generateGeminiImage';

describe('generateGeminiImage', () => {
  // Set the test mode environment variable
  beforeAll(() => {
    process.env.FAL_IMAGE_TEST_MODE = 'true';
  });

  // Reset the test mode environment variable after tests
  afterAll(() => {
    process.env.FAL_IMAGE_TEST_MODE = 'false';
  });

  it('should return a callback object with webhook and response properties', async () => {
    const result = await generateGeminiImage('none', 'A test prompt');
    
    // Check that the result matches the expected structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty('webhook');
    expect(result).toHaveProperty('response');
    
    // Check the response object structure
    if (result && result.response) {
      const response = result.response as GeminiImageResponse;
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('request_id');
      expect(response).toHaveProperty('response_url');
      expect(response.status).toBe('IN_QUEUE');
    } else {
      fail('Response should be defined');
    }
  });

  it('should handle undefined image prompt', async () => {
    const result = await generateGeminiImage('none', undefined);
    
    // Even with undefined prompt, the function should not throw
    // and still return a properly structured response in test mode
    expect(result).toBeDefined();
    expect(result).toHaveProperty('webhook');
    expect(result).toHaveProperty('response');
  });
});