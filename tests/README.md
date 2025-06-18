# Test Safety and Build Integration

## Overview

Tests are automatically run before each build via the `prebuild` script in package.json. This ensures code quality and prevents breaking changes from being deployed.

## Safety Measures

The following measures ensure tests never impact live data or services:

1. **Environment Isolation**: Tests run with `NODE_ENV=test`
2. **Mock Services**: All external services (Stripe, Supabase) are mocked
3. **Fake Credentials**: Test environment uses fake API keys
4. **No Database Connections**: Tests never connect to real databases
5. **Conditional Execution**: Tests can be skipped in production if needed

## Configuration

### Skipping Tests in Production

If necessary, tests can be skipped in production environments by setting:

```
SKIP_TESTS_IN_PRODUCTION=true
```

### Test Setup

All tests use the setup file at `tests/setup.js` which:
- Sets test environment variables
- Configures mocks for external services
- Prevents real API calls

## Best Practices

1. Always use mocks in tests instead of real services
2. Never use production credentials in tests
3. Keep tests fast and focused on unit behavior
4. Use the `jest.mock()` syntax to mock dependencies
5. Make sure tests are idempotent (can be run multiple times with the same result)

## Troubleshooting

If tests are failing in the build process:

1. Run `npm run test` locally to identify issues
2. Check if any tests are attempting to connect to real services
3. Ensure all external dependencies are properly mocked