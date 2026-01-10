"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Edit2, CloudRain, Sun } from "lucide-react";
import { clientLogger } from "@/lib/logger";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { GeocodeResult } from "@/lib/types";
import type { UserWeatherStatus } from "@/lib/weather";
import { SEARCH_CONFIG } from "@/lib/constants";

interface LocationSelectorProps {
  onLocationSelect: (lat: number, lon: number, source: "geolocation" | "manual", locationName?: string) => void;
  selectedLocation?: string; // Display name
  collapsed?: boolean; // For results state
  disabled?: boolean;
  userWeather?: UserWeatherStatus;
}

export default function LocationSelector({ 
  onLocationSelect, 
  selectedLocation, 
  collapsed = false, 
  disabled,
  userWeather
}: LocationSelectorProps) {
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      const results = data.results || [];
      setSearchResults(results);
      setShowResults(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      clientLogger.error("Geocoding error:", error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Debounced auto-search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, SEARCH_CONFIG.DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideSearch = searchContainerRef.current?.contains(target);
      const isInsideResults = resultsRef.current?.contains(target);
      
      // Only close if click is outside both the search container and results dropdown
      if (!isInsideSearch && !isInsideResults) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    // Use click instead of mousedown to allow dropdown clicks to fire first
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSelectResult = (result: GeocodeResult) => {
    const displayName = `${result.name}${result.admin1 ? `, ${result.admin1}` : ""}${result.country ? `, ${result.country}` : ""}`;
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    setIsEditing(false);
    // Pass just the place name (not the full display name with admin areas)
    onLocationSelect(result.lat, result.lon, "manual", result.name);
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectResult(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelectResult(searchResults[0]);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setShowResults(true);
        setSelectedIndex((prev) => {
          // If no item is selected, start at 0, otherwise move down
          if (prev < 0) return 0;
          return prev < searchResults.length - 1 ? prev + 1 : prev;
        });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setShowResults(true);
        setSelectedIndex((prev) => {
          // If at -1 or 0, go to -1 (no selection), otherwise move up
          if (prev <= 0) return -1;
          return prev - 1;
        });
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  // Scroll selected item into view when navigating with arrow keys
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  // Get weather display info based on status
  const getWeatherDisplay = () => {
    if (!userWeather) return null;

    switch (userWeather.status) {
      case 'rain-hours':
        return {
          icon: <CloudRain className="size-4 text-blue-600" />,
          text: `Rain for next ${userWeather.hours} hours`,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'dry-until':
        return {
          icon: <CloudRain className="size-4 text-blue-600" />,
          text: `Rain at ${userWeather.time}`,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'rain-all-day':
        return {
          icon: <CloudRain className="size-4 text-blue-600" />,
          text: 'Rain all day',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'dry-all-day':
        return {
          icon: <Sun className="size-4 text-yellow-600" />,
          text: 'Dry all day',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700'
        };
      default:
        return null;
    }
  };

  // Collapsed view for when location is already selected
  if (collapsed && selectedLocation && !isEditing) {
    const weatherDisplay = getWeatherDisplay();
    
    return (
      <div className="flex items-center justify-center gap-3 py-2 transition-all duration-300 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Location:</span>
          <span className="text-sm font-medium">{selectedLocation}</span>
          <button
            onClick={() => {
              setIsEditing(true);
              // Reset search state when editing
              setSearchQuery("");
              setSearchResults([]);
            }}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit location"
          >
            <Edit2 className="size-3.5" />
          </button>
        </div>
        {weatherDisplay && (
          <div className={`flex items-center gap-1.5 px-3 py-1 ${weatherDisplay.bgColor} rounded-full`}>
            {weatherDisplay.icon}
            <span className="text-sm font-medium text-foreground">{weatherDisplay.text}</span>
          </div>
        )}
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
          className="text-base px-8 h-12 lg:h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] lg:text-[16px]"
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
      <div className="flex gap-2" ref={searchContainerRef}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter any location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onKeyDown={handleKeyPress}
            disabled={disabled || isSearching}
            className="pl-10 bg-input-background border-border h-10 lg:h-12 text-base lg:text-base"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
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

      {/* Search Results - Auto-complete dropdown */}
      {showResults && searchResults.length > 0 && (
        <div 
          ref={resultsRef}
          className="border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto z-50 relative mt-1"
          onClick={(e) => {
            // Prevent clicks inside dropdown from bubbling up
            e.stopPropagation();
          }}
        >
          {searchResults.map((result, index) => (
            <button
              key={`${result.name}-${result.lat}-${result.lon}`}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clientLogger.debug("Selecting result:", result.name);
                handleSelectResult(result);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0 transition-colors cursor-pointer ${
                index === selectedIndex ? "bg-accent text-accent-foreground" : ""
              }`}
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

