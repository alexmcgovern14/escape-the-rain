"use client";

import { useState } from "react";
import { MapPin, Search, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { GeocodeResult } from "@/lib/types";

interface LocationSelectorProps {
  onLocationSelect: (lat: number, lon: number, source: "geolocation" | "manual", locationName?: string) => void;
  selectedLocation?: string; // Display name
  collapsed?: boolean; // For results state
  disabled?: boolean;
}

export default function LocationSelector({ 
  onLocationSelect, 
  selectedLocation, 
  collapsed = false, 
  disabled 
}: LocationSelectorProps) {
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGeolocating(false);
        setIsEditing(false);
        const { latitude, longitude } = position.coords;
        onLocationSelect(latitude, longitude, "geolocation", "Your location");
      },
      (error) => {
        setIsGeolocating(false);
        alert(`Geolocation error: ${error.message}`);
      }
    );
  };

  const handleGeolocationSelect = () => {
    handleGeolocation();
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
    setSearchQuery("");
    setSearchResults([]);
    setIsEditing(false);
    // Pass just the place name (not the full display name with admin areas)
    onLocationSelect(result.lat, result.lon, "manual", result.name);
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Collapsed view for when location is already selected
  if (collapsed && selectedLocation && !isEditing) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 transition-all duration-300">
        <MapPin className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Location:</span>
        <span className="text-sm font-medium">{selectedLocation}</span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setIsEditing(true);
            // Reset search state when editing
            setSearchQuery("");
            setSearchResults([]);
          }}
          className="h-7 px-2 text-xs"
        >
          <Edit2 className="size-3 mr-1" />
          Edit
        </Button>
      </div>
    );
  }

  // Full selector view (for empty state or when editing in results state)
  return (
    <div className="space-y-4 lg:w-1/2 lg:mx-auto transition-all duration-300">
      {/* Primary Action: Use My Location */}
      <div className="flex justify-center">
        <Button 
          onClick={handleGeolocationSelect}
          size="lg"
          disabled={disabled || isGeolocating}
          className="text-base px-8 h-12 lg:h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[16px] lg:text-[18px]"
        >
          <MapPin className="size-5 lg:size-6" />
          {isGeolocating ? "Getting location..." : "Use my location"}
        </Button>
      </div>
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">or search</span>
        </div>
      </div>
      
      {/* Secondary Action: Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter any location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isSearching}
            className="pl-10 bg-input-background border-border h-10 lg:h-12 text-sm lg:text-base"
          />
        </div>
        <Button 
          variant="secondary"
          onClick={handleSearch}
          disabled={disabled || isSearching || !searchQuery.trim()}
          className="shrink-0 h-10 lg:h-12"
        >
          {isSearching ? "..." : "Search"}
        </Button>
      </div>

      {/* Search Results - Keep for backend functionality but style to match */}
      {searchResults.length > 0 && (
        <div className="border border-border rounded-lg bg-card shadow-sm max-h-48 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0 transition-colors"
            >
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-muted-foreground">
                {result.admin1 && `${result.admin1}, `}
                {result.country}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {selectedLocation && !collapsed && (
        <p className="text-sm text-muted-foreground text-center">
          Selected: <span className="text-foreground font-medium">{selectedLocation}</span>
        </p>
      )}
    </div>
  );
}

