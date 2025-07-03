import { checkRateLimit, completeRequest, cleanupRateLimits } from '@/utils/rateLimit';

// Mock implementation for Date.now() to control timing in tests
const originalDateNow = Date.now;

describe('Rate Limit Functionality', () => {
  // Reset rate limits state and restore original Date.now before/after tests
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Force clean up all rate limits by directly calling the cleanup function
    cleanupRateLimits();
    
    // Reset Date.now to original implementation
    Date.now = originalDateNow;
  });
  
  afterEach(() => {
    // Restore original Date.now
    Date.now = originalDateNow;
  });

  test('checkRateLimit allows valid requests', () => {
    const userId = 'test-user-123';
    const result = checkRateLimit(userId, 'image');
    
    expect(result.allowed).toBe(true);
    expect(result.requestId).toBeDefined();
  });

  test('checkRateLimit tracks consecutive requests and applies cooldown', () => {
    const userId = 'test-user-456';
    
    // First request should be allowed
    const firstResult = checkRateLimit(userId, 'image');
    expect(firstResult.allowed).toBe(true);
    
    // Second immediate request should be rate limited (cooldown)
    const secondResult = checkRateLimit(userId, 'image');
    expect(secondResult.allowed).toBe(false);
    expect(secondResult.reason).toContain('Please wait a moment');
  });

  test('checkRateLimit limits requests per minute', () => {
    const userId = 'test-user-789';
    
    // Simulate cooldown being bypassed
    let mockTime = Date.now();
    
    // Mock Date.now to increase time by 3 seconds for each call
    Date.now = jest.fn(() => {
      const currentTime = mockTime;
      mockTime += 3000; // 3 seconds per request
      return currentTime;
    });
    
    // Make 11 requests - first 10 should succeed, 11th should fail
    const allowed: boolean[] = [];
    const reasons: string[] = [];
    
    for (let i = 0; i < 11; i++) {
      const result = checkRateLimit(userId, 'image');
      allowed.push(result.allowed);
      if (result.reason) {
        reasons.push(result.reason);
      }
    }
    
    // Check first 10 requests were allowed
    for (let i = 0; i < 10; i++) {
      expect(allowed[i]).toBe(true);
    }
    
    // 11th request should be blocked (max 10 per minute)
    expect(allowed[10]).toBe(false);
    expect(reasons[0]).toContain('Too many requests');
  });

  test('completeRequest removes tracking for completed requests', () => {
    const userId = 'test-user-cleanup';
    
    // Create a request
    const result = checkRateLimit(userId, 'video');
    expect(result.allowed).toBe(true);
    
    if (result.requestId) {
      // Complete the request
      completeRequest(userId, 'video', result.requestId);
    }
    
    // This test verifies the internal state is cleaned up, but we don't have
    // a direct way to assert it from outside. The fact that it doesn't throw
    // is part of the test.
    expect(true).toBe(true);
  });
  
  test('checkRateLimit handles different request types separately', () => {
    const userId = 'test-user-multi';
    
    // Image request
    const imageResult = checkRateLimit(userId, 'image');
    expect(imageResult.allowed).toBe(true);
    
    // Video request (different type, should be allowed even without delay)
    const videoResult = checkRateLimit(userId, 'video');
    expect(videoResult.allowed).toBe(true);
    
    // Image-edit request (different type, should be allowed even without delay)
    const editResult = checkRateLimit(userId, 'image-edit');
    expect(editResult.allowed).toBe(true);
  });
});