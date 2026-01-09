/**
 * Core type definitions for Rain Escape app
 */

export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  kinds?: string[];
  description?: string | null;
  nearbyPOIs?: string[]; // e.g., ["shops", "restaurants", "museums", "parks"]
  poiSummary?: string; // e.g., "Shops, restaurants, and parks nearby"
};

export type WeatherStatus = {
  isRainingNow: boolean;
  willRainSoon: boolean;
  summary?: string;
};

export type UserLocation = {
  lat: number;
  lon: number;
  source: "geolocation" | "manual";
};

export type Recommendation = {
  place: Place;
  isDryToday: boolean;
  rainSummary: string;
};

export type RecommendationResponse = {
  userLocation: UserLocation;
  localWeather: WeatherStatus;
  recommendations: Recommendation[];
  error?: string; // Optional error message (e.g., "No dry places within Xkm!")
};

export type GeocodeResult = {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  admin1?: string; // State/Province
};

