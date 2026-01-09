/**
 * General utility functions
 */

/**
 * Format distance in kilometers to a readable string
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
 */
export function getGoogleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

/**
 * Sleep/delay utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

