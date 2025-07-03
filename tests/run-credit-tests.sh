#!/bin/bash

# Script to run credit deduction and rate limiting tests

echo "Running rate limit tests..."
npx jest tests/rateLimit.test.ts

echo "Running API route tests..."
npx jest tests/apiRoutes.test.ts

echo "Running credit deduction tests..."
npx jest tests/creditDeduction.test.ts

echo "Running integration tests..."
npx jest tests/integration.test.ts

echo "All tests completed."