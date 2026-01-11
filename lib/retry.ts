/**
 * Retry utility with exponential backoff
 * Used for API calls that may fail due to network issues
 * 
 * This is a pure utility with no process.env access to avoid build-time issues
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryable?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryable: () => true, // Retry all errors by default
};

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry (should return a Promise)
 * @param options - Retry configuration
 * @returns Promise that resolves with the function result or rejects after all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!config.retryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable (network errors, timeouts, 5xx errors)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Timeout errors
  if (error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT') {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (error?.status >= 500 && error?.status < 600) {
    return true;
  }

  // HTTP 429 (rate limit) - retryable
  if (error?.status === 429) {
    return true;
  }

  // HTTP 408 (request timeout) - retryable
  if (error?.status === 408) {
    return true;
  }

  return false;
}
