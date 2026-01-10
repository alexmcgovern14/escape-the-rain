/**
 * General utility functions for the application
 */

/**
 * Format distance in kilometers to a readable string
 * @param km - Distance in kilometers
 * @returns Formatted string (e.g., "38.2km" or "500m")
 * @example
 * formatDistance(38.2) // "38.2km"
 * formatDistance(0.5) // "500m"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  // Return format like "38.2km" (no space, one decimal place)
  return `${km.toFixed(1)}km`;
}

/**
 * Generate Google Maps URL for a location
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @returns Google Maps URL string
 * @example
 * getGoogleMapsUrl(51.5074, -0.1276) // "https://www.google.com/maps?q=51.5074,-0.1276"
 */
export function getGoogleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

/**
 * Sleep/delay utility for rate limiting and async operations
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified delay
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

