/**
 * Pre-build test runner
 * 
 * This script conditionally runs tests before the build process.
 * In production environments, it can be configured to skip tests or run only safe tests.
 */

const { execSync } = require('child_process');

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';
const skipTestsInProduction = process.env.SKIP_TESTS_IN_PRODUCTION === 'true';

// Skip tests in production if the flag is set
if (isProduction && skipTestsInProduction) {
  console.log('⚠️ Skipping tests in production as SKIP_TESTS_IN_PRODUCTION is set to true');
  process.exit(0); // Exit with success code
}

try {
  console.log('Running pre-build tests...');
  
  // Force test environment to ensure no real services are used
  process.env.NODE_ENV = 'test';
  
  // Run the tests
  execSync('npx jest .', { stdio: 'inherit' });
  
  console.log('✅ All tests passed! Proceeding with build...');
} catch (error) {
  console.error('❌ Tests failed! Build process will not proceed.');
  console.error(error.message);
  process.exit(1); // Exit with error code to stop the build
}