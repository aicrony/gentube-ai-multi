import { NextResponse } from 'next/server';

/**
 * Server-side API error handler
 * @param error The error object
 * @param defaultMessage Default error message
 * @returns NextResponse with error details
 */
export function apiErrorHandler(
  error: unknown,
  defaultMessage: string = 'An error occurred'
) {
  console.error('API Error:', error);

  // Determine error message
  let errorMessage = defaultMessage;
  let status = 500;

  if (error instanceof Error) {
    errorMessage = error.message || defaultMessage;

    // Check for specific error types
    if ('status' in error && typeof (error as any).status === 'number') {
      status = (error as any).status;
    }
  }

  // Return standardized error response
  return NextResponse.json(
    {
      success: false,
      error: errorMessage
    },
    { status }
  );
}
