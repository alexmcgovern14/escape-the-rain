"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LocationPicker from "@/components/LocationPicker";
import StatusCard from "@/components/StatusCard";
import DestinationsList from "@/components/DestinationsList";
import type { RecommendationResponse } from "@/lib/types";

// Dynamically import MapView to avoid SSR issues with Mapbox
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [status, setStatus] = useState<"loading" | "error" | "not-raining" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [strictHours, setStrictHours] = useState<number>(4); // Default: 4 hours
  const [searchDistance, setSearchDistance] = useState<string>("auto"); // Default: "auto" (uses 50km -> 100km logic)

  const handleLocationSelect = async (lat: number, lon: number, source: "geolocation" | "manual", locationName?: string) => {
    setUserLocation({ lat, lon });
    setStatus("loading");
    setStatusMessage("Checking weather and finding dry places...");
    setData(null);

    try {
      const locationNameParam = locationName ? `&locationName=${encodeURIComponent(locationName)}` : "";
      const response = await fetch(
        `/api/recommendations?lat=${lat}&lon=${lon}&source=${source}&strictHours=${strictHours}&searchDistance=${searchDistance === "auto" ? "auto" : searchDistance}${locationNameParam}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result: RecommendationResponse = await response.json();
      setData(result);

      // Determine status based on weather (checked for 12 hours)
      // If dry for 12 hours, show "not-raining" status but still display recommendations
      if (!result.localWeather.isRainingNow && !result.localWeather.willRainSoon) {
        setStatus("not-raining");
        setStatusMessage(result.localWeather.summary || "It's dry at your location for the next 12 hours!");
      } else {
        setStatus(null); // Show results (it's raining or will rain soon)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setStatus("error");
      setStatusMessage("Failed to fetch recommendations. Please try again.");
      setData(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rain Escape</h1>
          <p className="text-gray-600">
            Find the closest dry destinations when it&apos;s raining at your location
          </p>
        </div>

        {/* Location Picker */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Choose your location</h2>
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            disabled={status === "loading"}
          />
          
          {/* Search Settings */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rain Forecast Window */}
              <div>
                <label htmlFor="strictHours" className="block text-sm font-medium text-gray-700 mb-2">
                  Rain forecast window for destinations: {strictHours} hour{strictHours !== 1 ? "s" : ""}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="strictHours"
                    min="1"
                    max="12"
                    value={strictHours}
                    onChange={(e) => setStrictHours(parseInt(e.target.value, 10))}
                    disabled={status === "loading"}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm text-gray-600 min-w-[80px]">
                    {strictHours}h ahead
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only show destinations that won&apos;t rain in the next {strictHours} hour{strictHours !== 1 ? "s" : ""} (your location is checked for 12 hours)
                </p>
              </div>

              {/* Search Distance */}
              <div>
                <label htmlFor="searchDistance" className="block text-sm font-medium text-gray-700 mb-2">
                  Search distance
                </label>
                <select
                  id="searchDistance"
                  value={searchDistance}
                  onChange={(e) => setSearchDistance(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="auto">Auto (anywhere)</option>
                  <option value="10">0-10 km</option>
                  <option value="25">11-25 km</option>
                  <option value="50">26-50 km</option>
                  <option value="100">50-100 km</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {searchDistance === "auto" 
                    ? "Searches 25km first, then 50km, then 100km if needed"
                    : `Maximum distance to search for dry places: ${searchDistance}km`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="mb-6">
          <StatusCard
            status={status}
            message={statusMessage}
            localWeatherSummary={data?.localWeather.summary}
          />
        </div>

        {/* Results - Always show recommendations if available, even when location is dry */}
        {data && data.recommendations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Destinations List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                {status === "not-raining" 
                  ? "Nearby places that are also dry" 
                  : "Dry destinations nearby"}
              </h2>
              <DestinationsList recommendations={data.recommendations} />
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Map</h2>
              <MapView
                userLocation={userLocation}
                recommendations={data.recommendations}
              />
            </div>
          </div>
        )}

        {/* Show message if no recommendations found */}
        {data && data.recommendations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600">
              {status === "not-raining" 
                ? "No other dry places found nearby. Your location is the best spot!" 
                : "No dry places found nearby. Try expanding your search distance or check back later!"}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Weather data from{" "}
            <a href="https://open-meteo.com" className="text-blue-600 hover:underline">
              Open-Meteo
            </a>
            {" • "}
            Places from{" "}
            <a href="https://opentripmap.io" className="text-blue-600 hover:underline">
              OpenTripMap
            </a>
            {" • "}
            Maps by{" "}
            <a href="https://www.openstreetmap.org" className="text-blue-600 hover:underline">
              OpenStreetMap
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

