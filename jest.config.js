/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}]
  },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  setupFiles: ['<rootDir>/tests/setup.js', '<rootDir>/tests/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  // Force using mocks instead of real services
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Create a group for credit system tests
  testMatch: [
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  
  // Configure code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'utils/rateLimit.ts',
    'utils/gcloud/processUser*Request.ts',
    'app/api/image/route.ts',
    'app/api/video/route.ts',
    'app/api/image-edit/route.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ]
};
