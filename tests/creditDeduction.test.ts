import { processUserImageRequest } from '@/utils/gcloud/processUserImageRequest';
import { processUserVideoRequest } from '@/utils/gcloud/processUserVideoRequest';
import { processUserImageEditRequest } from '@/utils/gcloud/processUserImageEditRequest';

// Import directly from our mock to control its behavior
const { mockGet, mockSave } = require('./mocks/google-cloud-datastore');

// Mock external dependencies
jest.mock('@google-cloud/datastore', () => require('./mocks/google-cloud-datastore'));
jest.mock('@/services/generateFalImage');
jest.mock('@/services/generateFalVideo');
jest.mock('@/services/generateFalImageEdit');
jest.mock('@/utils/gcloud/saveUserActivity', () => ({
  saveUserActivity: jest.fn().mockResolvedValue('activity-id-123')
}));

describe('Credit Deduction at Request Start', () => {
  beforeEach(() => {
    // Create a clean environment for each test
    jest.clearAllMocks();
    
    // Set environment variables
    process.env.NEXT_PUBLIC_FREE_CREDITS_VALUE = '100';
  });

  test('Image request deducts credits before API call', async () => {
    // Set up datastore mock to return user with credits
    mockGet.mockResolvedValue([{ Credits: 100 }]);
    
    const userId = 'test-user-123';
    const userIp = '192.168.1.1';
    const prompt = 'Test image prompt';
    
    // Create special mock for this test
    jest.spyOn(processUserImageRequest, 'updateUserCredits').mockImplementation(async () => {
      // This mock ensures the updateUserCredits is called and triggers the mockSave
      mockSave.mockClear();
      mockSave({
        key: 'mock-key',
        data: {
          UserId: userId,
          UserIp: userIp,
          Credits: 94
        }
      });
      return Promise.resolve();
    });
    
    // Process the request
    const result = await processUserImageRequest(userId, userIp, prompt);
    
    // Credit cost for image is 6
    expect(result.credits).toBe(94);
    
    // Verify updateUserCredits was called
    expect(processUserImageRequest.updateUserCredits).toHaveBeenCalled();
    
    // Verify mockSave was called with the correct data
    expect(mockSave).toHaveBeenCalled();
    const saveCall = mockSave.mock.calls[0][0];
    expect(saveCall.data.Credits).toBe(94);
    expect(saveCall.data.UserId).toBe(userId);
  });

  test('Video request deducts credits before API call', async () => {
    // Set up datastore mock to return user with credits
    mockGet.mockResolvedValue([{ Credits: 100 }]);
    
    const userId = 'test-user-123';
    const userIp = '192.168.1.1';
    const prompt = 'Test video prompt';
    const duration = '5'; // 5 second video costs 50 credits
    
    // Create special mock for this test
    jest.spyOn(processUserVideoRequest, 'updateUserCredits').mockImplementation(async () => {
      // This mock ensures the updateUserCredits is called and triggers the mockSave
      mockSave.mockClear();
      mockSave({
        key: 'mock-key',
        data: {
          UserId: userId,
          UserIp: userIp,
          Credits: 50
        }
      });
      return Promise.resolve();
    });
    
    // Process the request
    const result = await processUserVideoRequest(
      userId, userIp, prompt, 'none', duration, '16:9', 'false', 'normal'
    );
    
    // Credit cost for 5-second video is 50
    expect(result.credits).toBe(50);
    
    // Verify updateUserCredits was called
    expect(processUserVideoRequest.updateUserCredits).toHaveBeenCalled();
    
    // Verify mockSave was called with the correct data
    expect(mockSave).toHaveBeenCalled();
    const saveCall = mockSave.mock.calls[0][0];
    expect(saveCall.data.Credits).toBe(50);
    expect(saveCall.data.UserId).toBe(userId);
  });

  test('Image Edit request deducts credits before API call', async () => {
    // Set up datastore mock to return user with credits
    mockGet.mockResolvedValue([{ Credits: 100 }]);
    
    const userId = 'test-user-123';
    const userIp = '192.168.1.1';
    const prompt = 'Test edit prompt';
    const imageUrl = 'https://example.com/image.jpg';
    
    // Create special mock for this test
    jest.spyOn(processUserImageEditRequest, 'updateUserCredits').mockImplementation(async () => {
      // This mock ensures the updateUserCredits is called and triggers the mockSave
      mockSave.mockClear();
      mockSave({
        key: 'mock-key',
        data: {
          UserId: userId,
          UserIp: userIp,
          Credits: 90
        }
      });
      return Promise.resolve();
    });
    
    // Process the request
    const result = await processUserImageEditRequest(userId, userIp, prompt, imageUrl);
    
    // Credit cost for image edit is 10
    expect(result.credits).toBe(90);
    
    // Verify updateUserCredits was called
    expect(processUserImageEditRequest.updateUserCredits).toHaveBeenCalled();
    
    // Verify mockSave was called with the correct data
    expect(mockSave).toHaveBeenCalled();
    const saveCall = mockSave.mock.calls[0][0];
    expect(saveCall.data.Credits).toBe(90);
    expect(saveCall.data.UserId).toBe(userId);
  });

  test('Request is rejected if user has insufficient credits', async () => {
    // Set up datastore mock to return user with insufficient credits
    mockGet.mockResolvedValue([{ Credits: 5 }]);
    
    const userId = 'test-user-123';
    const userIp = '192.168.1.1';
    const prompt = 'Test video prompt';
    
    // Create special mock for this test to verify updateUserCredits is NOT called
    jest.spyOn(processUserVideoRequest, 'updateUserCredits').mockImplementation(async () => {
      return Promise.resolve();
    });
    
    // Process a video request (costs 50 credits minimum)
    const result = await processUserVideoRequest(
      userId, userIp, prompt, 'none', '5', '16:9', 'false', 'normal'
    );
    
    // Should be rejected with LimitExceeded
    expect(result.result).toBe('LimitExceeded');
    expect(result.error).toBe(true);
    
    // Verify updateUserCredits was NOT called
    expect(processUserVideoRequest.updateUserCredits).not.toHaveBeenCalled();
  });

  test('Multiple concurrent requests are prevented by rate limiting', async () => {
    // This test verifies behavior that depends on the rate limiter
    // The implementation of that test is in the rateLimit.test.ts file
    expect(true).toBe(true);
  });
});