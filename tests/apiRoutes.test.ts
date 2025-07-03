import { NextRequest } from 'next/server';
import { POST as imagePostHandler } from '@/app/api/image/route';
import { POST as videoPostHandler } from '@/app/api/video/route';
import { POST as imageEditPostHandler } from '@/app/api/image-edit/route';
import * as rateLimit from '@/utils/rateLimit';
import * as processUserImageRequest from '@/utils/gcloud/processUserImageRequest';
import * as processUserVideoRequest from '@/utils/gcloud/processUserVideoRequest';
import * as processUserImageEditRequest from '@/utils/gcloud/processUserImageEditRequest';

// Mock dependencies
jest.mock('@/utils/rateLimit');
jest.mock('@/utils/gcloud/processUserImageRequest');
jest.mock('@/utils/gcloud/processUserVideoRequest');
jest.mock('@/utils/gcloud/processUserImageEditRequest');

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

// Helper to read JSON response
const getJsonFromResponse = (response: any) => {
  return response;
};

describe('API Route Rate Limiting', () => {
  // Mock dependencies
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Next.js Response
    jest.mock('next/server', () => {
      return {
        NextResponse: {
          json: jest.fn((data, options = {}) => {
            return {
              ...data,
              status: options.status || 200
            };
          }),
          next: jest.fn(() => ({})),
          redirect: jest.fn((url) => ({ url }))
        }
      };
    });
    
    // Mock rate limit checks
    jest.spyOn(rateLimit, 'checkRateLimit').mockImplementation((userId, type) => ({
      allowed: true,
      requestId: 'test-request-id'
    }));
    
    // Mock process handlers to avoid actual processing
    jest.spyOn(processUserImageRequest, 'processUserImageRequest').mockResolvedValue({
      result: 'InQueue',
      credits: 94
    } as any);
    
    jest.spyOn(processUserVideoRequest, 'processUserVideoRequest').mockResolvedValue({
      result: 'InQueue',
      credits: 50,
      error: false,
      statusCode: 200
    } as any);
    
    jest.spyOn(processUserImageEditRequest, 'processUserImageEditRequest').mockResolvedValue({
      result: 'InQueue',
      credits: 90,
      error: false,
      statusCode: 200
    } as any);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Image API route handles rate limiting', async () => {
    // Mock rate limit check to fail
    jest.spyOn(rateLimit, 'checkRateLimit').mockReturnValue({
      allowed: false,
      reason: 'Too many requests test'
    });
    
    const req = mockRequest(
      { prompt: 'Test image' },
      { 'x-user-id': 'user123', 'x-forwarded-for': '127.0.0.1' }
    );
    
    const response = await imagePostHandler(req);
    const jsonResponse = getJsonFromResponse(response);
    
    expect(jsonResponse.status).toBe(429);
    expect(jsonResponse).toHaveProperty('error', 'Too many requests test');
    expect(jsonResponse).toHaveProperty('result', 'RateLimitExceeded');
    
    // Verify process function was not called (credits not deducted)
    expect(processUserImageRequest.processUserImageRequest).not.toHaveBeenCalled();
  });

  test('Video API route handles rate limiting', async () => {
    // Mock rate limit check to fail
    jest.spyOn(rateLimit, 'checkRateLimit').mockReturnValue({
      allowed: false,
      reason: 'Too many requests test'
    });
    
    const req = mockRequest(
      { description: 'Test video', duration: '5' },
      { 'x-user-id': 'user123', 'x-forwarded-for': '127.0.0.1' }
    );
    
    const response = await videoPostHandler(req);
    const jsonResponse = getJsonFromResponse(response);
    
    expect(jsonResponse.status).toBe(429);
    expect(jsonResponse).toHaveProperty('error', 'Too many requests test');
    expect(jsonResponse).toHaveProperty('result', 'RateLimitExceeded');
    
    // Verify process function was not called (credits not deducted)
    expect(processUserVideoRequest.processUserVideoRequest).not.toHaveBeenCalled();
  });

  test('Image Edit API route handles rate limiting', async () => {
    // Mock rate limit check to fail
    jest.spyOn(rateLimit, 'checkRateLimit').mockReturnValue({
      allowed: false,
      reason: 'Too many requests test'
    });
    
    const req = mockRequest(
      { prompt: 'Edit test', imageUrl: 'https://example.com/image.jpg' },
      { 'x-user-id': 'user123', 'x-forwarded-for': '127.0.0.1' }
    );
    
    const response = await imageEditPostHandler(req);
    const jsonResponse = getJsonFromResponse(response);
    
    expect(jsonResponse.status).toBe(429);
    expect(jsonResponse).toHaveProperty('error', 'Too many requests test');
    expect(jsonResponse).toHaveProperty('result', 'RateLimitExceeded');
    
    // Verify process function was not called (credits not deducted)
    expect(processUserImageEditRequest.processUserImageEditRequest).not.toHaveBeenCalled();
  });

  test('Image API route successfully processes with valid rate limit', async () => {
    // Mock rate limit check to succeed
    jest.spyOn(rateLimit, 'checkRateLimit').mockReturnValue({
      allowed: true,
      requestId: 'test-request-id'
    });
    
    // Mock the image processor to return success
    jest.spyOn(processUserImageRequest, 'processUserImageRequest').mockResolvedValue({
      result: 'InQueue',
      credits: 94
    });
    
    const req = mockRequest(
      { prompt: 'Test image' },
      { 'x-user-id': 'user123', 'x-forwarded-for': '127.0.0.1' }
    );
    
    const response = await imagePostHandler(req);
    const jsonResponse = getJsonFromResponse(response);
    
    expect(jsonResponse.status).toBe(200);
    expect(jsonResponse).toHaveProperty('result', 'InQueue');
    expect(jsonResponse).toHaveProperty('credits', 94);
    
    // Verify process function was called (credits deducted)
    expect(processUserImageRequest.processUserImageRequest).toHaveBeenCalledWith(
      'user123', 
      '127.0.0.1', 
      'Test image'
    );
  });
});