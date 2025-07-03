// Mock Next.js NextResponse
const NextResponseMock = {
  json: jest.fn((data, options = {}) => {
    return {
      ...data,
      status: options.status || 200,
      json: async () => data
    };
  }),
  next: jest.fn(() => ({})),
  redirect: jest.fn((url) => ({ url }))
};

module.exports = {
  NextResponse: NextResponseMock
};