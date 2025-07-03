// Mock for generateFalImage service
const generateFalImageMock = jest.fn().mockImplementation(() => {
  return {
    webhook: true,
    response: {
      request_id: 'test-image-request-123',
      status: 'PENDING'
    }
  };
});

// Mock for generateFalVideo service
const generateFalVideoMock = jest.fn().mockImplementation(() => {
  return {
    webhook: true,
    response: {
      request_id: 'test-video-request-123',
      status: 'PENDING'
    }
  };
});

// Mock for generateFalImageEdit service
const generateFalImageEditMock = jest.fn().mockImplementation(() => {
  return {
    webhook: true,
    response: {
      request_id: 'test-image-edit-request-123',
      status: 'PENDING'
    }
  };
});

module.exports = {
  generateFalImage: generateFalImageMock,
  generateFalVideo: generateFalVideoMock,
  generateFalImageEdit: generateFalImageEditMock
};