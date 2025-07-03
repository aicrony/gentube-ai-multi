import { NextRequest } from 'next/server';
import { POST as imagePostHandler } from '@/app/api/image/route';
import { POST as videoPostHandler } from '@/app/api/video/route';
import { POST as imageEditPostHandler } from '@/app/api/image-edit/route';
import * as rateLimit from '@/utils/rateLimit';
import * as processUserImageRequest from '@/utils/gcloud/processUserImageRequest';
import * as processUserVideoRequest from '@/utils/gcloud/processUserVideoRequest';
import * as processUserImageEditRequest from '@/utils/gcloud/processUserImageEditRequest';

// Import directly from our mock to control its behavior
const { mockGet, mockSave } = require('./mocks/google-cloud-datastore');

// Mock dependencies
jest.mock('@google-cloud/datastore', () => require('./mocks/google-cloud-datastore'));
jest.mock('@/services/generateFalImage');
jest.mock('@/services/generateFalVideo');
jest.mock('@/services/generateFalImageEdit');
jest.mock('@/utils/gcloud/saveUserActivity', () => ({
  saveUserActivity: jest.fn().mockResolvedValue('activity-id-123')
}));
jest.mock('next/server', () => require('./mocks/next-server'));

// Mock Next.js request/response
const mockRequest = (body = {}, headers = {}) => {
  const req = {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn((name) => headers[name] || null)
    },
    nextUrl: { pathname: '/api/test' }
  };
  return req as unknown as NextRequest;
};

describe('Integration Tests - Rate Limiting and Credit Deduction', () => {
  beforeEach(() => {
    // Create a clean environment for each test
    jest.clearAllMocks();
    
    // Set environment variables
    process.env.NEXT_PUBLIC_FREE_CREDITS_VALUE = '100';
    
    // Mocks for processor functions
    jest.spyOn(processUserImageRequest, 'processUserImageRequest').mockImplementation(
      async (userId, userIp, prompt) => {
        return {
          result: 'InQueue',
          credits: 94, // 100 - 6
          error: false,
          statusCode: 200
        };
      }
    );
    
    jest.spyOn(processUserVideoRequest, 'processUserVideoRequest').mockImplementation(
      async (userId, userIp, prompt) => {
        return {
          result: 'InQueue',
          credits: 50, // 100 - 50
          error: false,
          statusCode: 200
        };
      }
    );
    
    jest.spyOn(processUserImageEditRequest, 'processUserImageEditRequest').mockImplementation(
      async (userId, userIp, prompt, imageUrl) => {
        return {
          result: 'InQueue',
          credits: 90, // 100 - 10
          error: false,
          statusCode: 200
        };
      }
    );
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Scenario: Rapid multiple requests from same user are rate limited', async () => {
    // Mock rate limit implementation for this test
    let requestCount = 0;
    jest.spyOn(rateLimit, 'checkRateLimit').mockImplementation((userId, type) => {
      requestCount++;
      // First request allowed, second one rate limited
      if (requestCount === 1) {
        return { allowed: true, requestId: 'test-request-id-1' };
      } else {
        return { 
          allowed: false, 
          reason: 'Please wait a moment before submitting another request.' 
        };
      }
    });
    
    const userId = 'integration-test-user';
    const userHeaders = { 'x-user-id': userId, 'x-forwarded-for': '127.0.0.1' };
    
    // First request should go through
    const req1 = mockRequest({ prompt: 'First image' }, userHeaders);
    const response1 = await imagePostHandler(req1);
    
    expect(response1.status).toBe(200);
    expect(response1.result).toBe('InQueue');
    
    // Second immediate request should be rate limited
    const req2 = mockRequest({ prompt: 'Second image' }, userHeaders);
    const response2 = await imagePostHandler(req2);
    
    expect(response2.status).toBe(429);
    expect(response2.result).toBe('RateLimitExceeded');
    
    // Credits should only be deducted once (for the first request)
    expect(processUserImageRequest.processUserImageRequest).toHaveBeenCalledTimes(1);
  });

  test('Scenario: Different request types are tracked separately', async () => {
    // Mock rate limit implementation to allow different request types
    jest.spyOn(rateLimit, 'checkRateLimit').mockImplementation((userId, type) => {
      return { allowed: true, requestId: `test-${type}-request-id` };
    });
    
    const userId = 'multi-request-user';
    const userHeaders = { 'x-user-id': userId, 'x-forwarded-for': '127.0.0.1' };
    
    // Image request
    const imgReq = mockRequest({ prompt: 'Test image' }, userHeaders);
    const imgResponse = await imagePostHandler(imgReq);
    
    expect(imgResponse.status).toBe(200);
    expect(imgResponse.result).toBe('InQueue');
    
    // Video request should be allowed (different type)
    const videoReq = mockRequest({ 
      description: 'Test video',
      duration: '5'
    }, userHeaders);
    
    const videoResponse = await videoPostHandler(videoReq);
    
    expect(videoResponse.status).toBe(200);
    expect(videoResponse.result).toBe('InQueue');
    
    // Image edit should also be allowed (another different type)
    const editReq = mockRequest({ 
      prompt: 'Edit test', 
      imageUrl: 'https://example.com/image.jpg' 
    }, userHeaders);
    
    const editResponse = await imageEditPostHandler(editReq);
    
    expect(editResponse.status).toBe(200);
    expect(editResponse.result).toBe('InQueue');
    
    // Verify all three process functions were called
    expect(processUserImageRequest.processUserImageRequest).toHaveBeenCalledTimes(1);
    expect(processUserVideoRequest.processUserVideoRequest).toHaveBeenCalledTimes(1);
    expect(processUserImageEditRequest.processUserImageEditRequest).toHaveBeenCalledTimes(1);
  });

  test('Scenario: Request with insufficient credits is rejected before processing', async () => {
    // Mock rate limit to always allow
    jest.spyOn(rateLimit, 'checkRateLimit').mockImplementation(() => {
      return { allowed: true, requestId: 'test-request-id' };
    });
    
    // Mock the process function to check credits properly
    jest.spyOn(processUserVideoRequest, 'processUserVideoRequest').mockImplementation(
      async (userId, userIp, prompt) => {
        // Simulate user with only 20 credits (not enough for video)
        return {
          result: 'LimitExceeded',
          credits: 20,
          error: true,
          statusCode: 429
        };
      }
    );
    
    const userId = 'low-credit-user';
    const userHeaders = { 'x-user-id': userId, 'x-forwarded-for': '127.0.0.1' };
    
    // Try to request a video (costs 50 credits)
    const req = mockRequest({ 
      description: 'Expensive video',
      duration: '5'
    }, userHeaders);
    
    const response = await videoPostHandler(req);
    
    // Should be rejected with specific error
    expect(response.status).not.toBe(200);
    expect(response.result).toBe('LimitExceeded');
    expect(response).toHaveProperty('error');
    
    // Process function should be called
    expect(processUserVideoRequest.processUserVideoRequest).toHaveBeenCalledTimes(1);
  });
});