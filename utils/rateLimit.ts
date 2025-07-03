// In-memory store for rate limiting and request tracking
// This is a simple solution that works for a single instance
// For production with multiple instances, use Redis or similar
interface RateLimitEntry {
  timestamp: number;
  count: number;
  lastRequestTime: number;
  inProgressRequests: Set<string>; // Track in-progress requests by their unique identifier
}

// Map to store rate limits by user ID
const userRateLimits = new Map<string, RateLimitEntry>();

// Cooldown period between requests in milliseconds (2 seconds)
const COOLDOWN_MS = 2000;

// Maximum requests per minute
const MAX_REQUESTS_PER_MINUTE = 10;

// Time window for rate limiting (1 minute)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Generate a unique request ID for tracking
export function generateRequestId(userId: string, prompt: string): string {
  // Create a deterministic ID from the user and prompt
  // This will help us identify duplicate requests
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${userId}-${timestamp}-${random}`;
}

// Check if a request is a duplicate or if user is rate limited
export function checkRateLimit(
  userId: string, 
  requestType: 'image' | 'video' | 'image-edit'
): { 
  allowed: boolean; 
  reason?: string;
  requestId?: string;
} {
  if (!userId || userId === 'none') {
    return { allowed: true }; // Skip rate limiting for anonymous users (they'll be rejected later anyway)
  }

  const now = Date.now();
  const key = `${userId}:${requestType}`;
  
  // Get or create rate limit entry
  if (!userRateLimits.has(key)) {
    userRateLimits.set(key, {
      timestamp: now,
      count: 0,
      lastRequestTime: 0,
      inProgressRequests: new Set()
    });
  }
  
  const entry = userRateLimits.get(key)!;
  
  // Reset counter if window has passed
  if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
    entry.timestamp = now;
    entry.count = 0;
  }
  
  // Check if user is sending too many requests
  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return { 
      allowed: false, 
      reason: `Too many requests. Maximum ${MAX_REQUESTS_PER_MINUTE} requests per minute allowed.` 
    };
  }
  
  // Check if request is too soon after previous request
  if (now - entry.lastRequestTime < COOLDOWN_MS) {
    return { 
      allowed: false, 
      reason: `Please wait a moment before submitting another request.` 
    };
  }
  
  // Update rate limit entry
  entry.count++;
  entry.lastRequestTime = now;
  
  // Generate a unique request ID
  const requestId = generateRequestId(userId, requestType);
  
  // Return success
  return { allowed: true, requestId };
}

// Mark a request as completed and remove it from tracking
export function completeRequest(userId: string, requestType: 'image' | 'video' | 'image-edit', requestId: string): void {
  const key = `${userId}:${requestType}`;
  const entry = userRateLimits.get(key);
  
  if (entry && entry.inProgressRequests.has(requestId)) {
    entry.inProgressRequests.delete(requestId);
  }
}

// Clean up old entries to prevent memory leaks
// Call this periodically from a background task
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  for (const [key, entry] of userRateLimits.entries()) {
    // Remove entries older than 10 minutes
    if (now - entry.timestamp > 10 * 60 * 1000) {
      userRateLimits.delete(key);
    }
  }
}

// Periodically clean up every 5 minutes
// Call .unref() to allow the Node process to exit even if this timer is still running
setInterval(cleanupRateLimits, 5 * 60 * 1000).unref();