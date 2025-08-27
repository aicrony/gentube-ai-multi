// In app/api/creditsync/route.test.ts
import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { aggregateUserCredits } from '@/utils/gcloud/processUserImageRequest';

// Mock dependencies
jest.mock('@/utils/gcloud/processUserImageRequest', () => ({
  aggregateUserCredits: jest.fn()
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => {
      return {
        json: jest.fn().mockResolvedValue(data),
        status: init?.status || 200
      };
    })
  }
}));

describe('creditsync API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle aggregateUserCredits failures', async () => {
    // Setup mock to throw an error
    (aggregateUserCredits as jest.Mock).mockRejectedValueOnce(
      new Error('Test error')
    );

    // Create a proper mock request with a json method
    const req = {
      json: jest.fn().mockResolvedValue({
        record: {
          user_id: 'test-user',
          credits_purchased: 10
        }
      })
    } as unknown as NextRequest;

    // Execute the POST handler
    await POST(req);

    // Verify NextResponse.json was called with the right arguments
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Sync Webhook handler failed.' },
      { status: 500 }
    );
  });
});
