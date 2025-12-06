/**
 * Geographic utility functions
 */

/**
 * Calculate the haversine distance between two points on Earth
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance from a point to multiple points and sort by distance
 */
export function calculateDistancesAndSort<T extends { lat: number; lon: number }>(
  originLat: number,
  originLon: number,
  points: T[]
): (T & { distanceKm: number })[] {
  return points
    .map((point) => ({
      ...point,
      distanceKm: haversineDistance(originLat, originLon, point.lat, point.lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

