import { checkRateLimit, cleanupRateLimits } from '@/utils/rateLimit';

describe('Rate Limit Functionality', () => {
  // Save original Date.now
  const originalDateNow = Date.now;
  let mockTime = Date.now();
  
  beforeEach(() => {
    // Reset rate limits state for each test
    cleanupRateLimits();
    
    // Reset mock time
    mockTime = Date.now();
    
    // Mock Date.now to return controlled time
    Date.now = jest.fn(() => mockTime);
  });
  
  afterEach(() => {
    // Restore original Date.now
    Date.now = originalDateNow;
  });

  test('checkRateLimit allows valid initial requests', () => {
    // First request should be allowed
    const result = checkRateLimit('test-user', 'image');
    expect(result.allowed).toBe(true);
  });

  test('checkRateLimit applies cooldown for rapid requests', () => {
    // First request should be allowed
    const firstResult = checkRateLimit('test-user', 'image');
    expect(firstResult.allowed).toBe(true);
    
    // Second immediate request should be rate limited due to cooldown
    const secondResult = checkRateLimit('test-user', 'image');
    expect(secondResult.allowed).toBe(false);
    
    // Advance time by more than cooldown period (2 seconds)
    mockTime += 3000;
    
    // Third request after cooldown should be allowed
    const thirdResult = checkRateLimit('test-user', 'image');
    expect(thirdResult.allowed).toBe(true);
  });

  test('checkRateLimit handles different request types separately', () => {
    // Each request type should be allowed even if they're from the same user
    
    // Image request
    const imageResult = checkRateLimit('test-user', 'image');
    expect(imageResult.allowed).toBe(true);
    
    // Video request (different type, should be allowed without delay)
    const videoResult = checkRateLimit('test-user', 'video');
    expect(videoResult.allowed).toBe(true);
    
    // Image-edit request (different type, should be allowed without delay)
    const editResult = checkRateLimit('test-user', 'image-edit');
    expect(editResult.allowed).toBe(true);
    
    // Verify a repeat request of the same type is rate limited
    const imageResult2 = checkRateLimit('test-user', 'image');
    expect(imageResult2.allowed).toBe(false);
  });
});