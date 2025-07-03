// Automatically mock these modules for all tests
jest.mock('@google-cloud/datastore', () => require('./mocks/google-cloud-datastore'));
jest.mock('@/services/generateFalImage', () => jest.fn().mockResolvedValue({
  webhook: true,
  response: {
    request_id: 'test-image-request-123',
    status: 'PENDING'
  }
}));
jest.mock('@/services/generateFalVideo', () => jest.fn().mockResolvedValue({
  webhook: true,
  response: {
    request_id: 'test-video-request-123',
    status: 'PENDING'
  }
}));
jest.mock('@/services/generateFalImageEdit', () => jest.fn().mockResolvedValue({
  webhook: true,
  response: {
    request_id: 'test-image-edit-request-123',
    status: 'PENDING'
  }
}));
jest.mock('@/utils/gcloud/saveUserActivity', () => ({
  saveUserActivity: jest.fn().mockResolvedValue('activity-id-123')
}));

// Mock the Next.js request/response
jest.mock('next/server', () => {
  return require('./mocks/next-server');
});