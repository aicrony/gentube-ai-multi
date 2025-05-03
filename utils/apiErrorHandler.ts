'use client';

interface ApiErrorOptions {
  setErrorMessage?: (message: string | null) => void;
  redirectDelay?: number;
  redirectPath?: string;
  onErrorCallback?: (status: number, message: string) => void;
}

/**
 * Handle API errors with standardized responses
 * @param response The fetch response object
 * @param options Configuration options for error handling
 * @returns A boolean indicating if an error was handled (true) or not (false)
 */
export async function handleApiError(
  response: Response,
  options: ApiErrorOptions = {}
): Promise<boolean> {
  if (response.ok) return false;

  const {
    setErrorMessage,
    redirectDelay = 1500,
    redirectPath = '/signin',
    onErrorCallback
  } = options;

  let errorMessage = 'An error occurred.';
  
  try {
    // Only try to parse JSON if the content type is application/json
    if (response.headers.get('content-type')?.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.result || errorMessage;
    }
  } catch (e) {
    console.error('Error parsing error response:', e);
  }

  // Handle specific status codes
  switch (response.status) {
    case 430: // Custom status code for auth required
      if (setErrorMessage) {
        setErrorMessage(errorMessage || 'Please sign in for free credits.');
      }
      
      // Redirect to sign in page after a short delay with new user prompt
      setTimeout(() => {
        window.location.href = `${redirectPath}?new_user_prompt=true`;
      }, redirectDelay);
      break;
      
    case 429: // Rate limiting
      if (setErrorMessage) {
        setErrorMessage(errorMessage || 'Request limit exceeded. Please try again later.');
      }
      break;
      
    case 401: // Unauthorized
      if (setErrorMessage) {
        setErrorMessage(errorMessage || 'Authentication required.');
      }
      
      // Only redirect if it's a general 401, not our custom 430
      setTimeout(() => {
        window.location.href = `${redirectPath}?new_user_prompt=true`;
      }, redirectDelay);
      break;
      
    default:
      if (setErrorMessage) {
        setErrorMessage(
          errorMessage || 'Request failed. Please try again.'
        );
      }
      break;
  }

  // Call optional callback with status and message
  if (onErrorCallback) {
    onErrorCallback(response.status, errorMessage);
  }

  return true;
}

/**
 * Handle the specific case of authentication required
 * @param setErrorMessage Function to set error message
 */
export function showSignInRequiredError(
  setErrorMessage?: (message: string | null) => void
): void {
  if (setErrorMessage) {
    setErrorMessage('Please sign in for free credits.');
  }
  
  setTimeout(() => {
    window.location.href = '/signin?new_user_prompt=true';
  }, 1500);
}