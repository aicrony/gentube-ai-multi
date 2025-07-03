#!/bin/bash

# Script to run simple tests for rate limiting and credit deduction

echo "Running simple rate limit tests..."
npx jest tests/simple-ratelimit.test.ts

echo "Running simple credit deduction tests..."
npx jest tests/simple-credit.test.ts

echo "All tests completed."