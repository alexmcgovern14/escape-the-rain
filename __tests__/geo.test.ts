import { describe, it, expect } from "vitest";
import { haversineDistance, calculateDistancesAndSort } from "@/lib/geo";

describe("haversineDistance", () => {
  it("should calculate distance between two points correctly", () => {
    // Distance between New York and Los Angeles (approximately 3944 km)
    const nyLat = 40.7128;
    const nyLon = -74.006;
    const laLat = 34.0522;
    const laLon = -118.2437;

    const distance = haversineDistance(nyLat, nyLon, laLat, laLon);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  it("should return 0 for same point", () => {
    const lat = 40.7128;
    const lon = -74.006;
    const distance = haversineDistance(lat, lon, lat, lon);
    expect(distance).toBe(0);
  });

  it("should calculate short distances accurately", () => {
    // Distance between two close points (approximately 1 km)
    const lat1 = 40.7128;
    const lon1 = -74.006;
    const lat2 = 40.7218; // ~1km north
    const lon2 = -74.006;

    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(0.9);
    expect(distance).toBeLessThan(1.1);
  });
});

describe("calculateDistancesAndSort", () => {
  it("should calculate distances and sort by distance", () => {
    const originLat = 40.7128;
    const originLon = -74.006;

    const points = [
      { id: "1", lat: 40.7228, lon: -74.006, name: "Close" }, // ~1km
      { id: "2", lat: 40.8128, lon: -74.006, name: "Far" }, // ~11km
      { id: "3", lat: 40.7328, lon: -74.006, name: "Medium" }, // ~2km
    ];

    const result = calculateDistancesAndSort(originLat, originLon, points);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Close");
    expect(result[1].name).toBe("Medium");
    expect(result[2].name).toBe("Far");
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm);
    expect(result[1].distanceKm).toBeLessThan(result[2].distanceKm);
  });

  it("should handle empty array", () => {
    const result = calculateDistancesAndSort(40.7128, -74.006, []);
    expect(result).toHaveLength(0);
  });
});

