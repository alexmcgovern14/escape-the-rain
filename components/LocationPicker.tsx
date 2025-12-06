"use client";

import { useState } from "react";
import type { GeocodeResult } from "@/lib/types";

type LocationPickerProps = {
  onLocationSelect: (lat: number, lon: number, source: "geolocation" | "manual", locationName?: string) => void;
  disabled?: boolean;
};

export default function LocationPicker({ onLocationSelect, disabled }: LocationPickerProps) {
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lon: number } | null>(null);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGeolocating(false);
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ name: "Your location", lat: latitude, lon: longitude });
        onLocationSelect(latitude, longitude, "geolocation", "Your location");
      },
      (error) => {
        setIsGeolocating(false);
        alert(`Geolocation error: ${error.message}`);
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Failed to search for location");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: GeocodeResult) => {
    const displayName = `${result.name}${result.admin1 ? `, ${result.admin1}` : ""}${result.country ? `, ${result.country}` : ""}`;
    setSelectedLocation({ name: displayName, lat: result.lat, lon: result.lon });
    setSearchQuery("");
    setSearchResults([]);
    // Pass just the place name (not the full display name with admin areas)
    onLocationSelect(result.lat, result.lon, "manual", result.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGeolocation}
          disabled={disabled || isGeolocating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGeolocating ? "Getting location..." : "Use my current location"}
        </button>

        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Or search for a city..."
            disabled={disabled || isSearching}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSearch}
            disabled={disabled || isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm max-h-48 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-gray-600">
                {result.admin1 && `${result.admin1}, `}
                {result.country}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLocation && (
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedLocation.name}</span>
        </div>
      )}
    </div>
  );
}

