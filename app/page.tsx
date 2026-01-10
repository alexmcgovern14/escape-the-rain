"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LocationSelector from "@/components/LocationSelector";
import EmptyState from "@/components/EmptyState";
import DestinationCard from "@/components/DestinationCard";
import Footer from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { RecommendationResponse } from "@/lib/types";
import { getUserWeatherStatus, type UserWeatherStatus } from "@/lib/weather";
import { clientLogger, poiLogger } from "@/lib/logger";

// Dynamically import MapView to avoid SSR issues with Mapbox
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] lg:h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isExiting, setIsExiting] = useState(false);
  const [status, setStatus] = useState<"loading" | "error" | "not-raining" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [strictHours, setStrictHours] = useState<number>(4); // Default: 4 hours
  const [searchDistance, setSearchDistance] = useState<string>("auto"); // Default: "auto"
  const [showSettings, setShowSettings] = useState(false);
  const [poiLoading, setPoiLoading] = useState(false);
  const [userWeather, setUserWeather] = useState<UserWeatherStatus | undefined>(undefined);

  const handleLocationSelect = async (lat: number, lon: number, source: "geolocation" | "manual", locationName?: string) => {
    // Trigger exit animation
    setIsExiting(true);
    setStatus("loading");
    setStatusMessage("Checking weather and finding dry places...");
    setData(null);
    setUserLocation({ lat, lon });

    // After exit completes, fetch data
    setTimeout(async () => {
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

        // Set selected location display name
        const displayName = locationName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setSelectedLocation(displayName);

        // Fetch user weather status for header display
        try {
          const weatherStatus = await getUserWeatherStatus(lat, lon);
          setUserWeather(weatherStatus);
        } catch (error) {
          clientLogger.error("Failed to fetch user weather status:", error);
          // Don't block the UI if weather fetch fails
        }

        // Determine status based on weather (checked for 12 hours)
        if (!result.localWeather.isRainingNow && !result.localWeather.willRainSoon) {
          setStatus("not-raining");
          setStatusMessage(result.localWeather.summary || "It's dry at your location for the next 12 hours!");
        } else {
          setStatus(null); // Show results (it's raining or will rain soon)
        }

        setIsExiting(false);

        // Fetch POI data asynchronously after initial results are shown
        // Batch all places into a single API call for maximum speed
        if (result.recommendations && result.recommendations.length > 0) {
          setPoiLoading(true);
          poiLogger.log("Starting async POI fetch for", result.recommendations.length, "places...");
          
          // Batch all places into a single API call - much faster than individual calls
          const places = result.recommendations.map((rec) => ({
            lat: rec.place.lat,
            lon: rec.place.lon,
            name: rec.place.name,
          }));

          fetch("/api/poi", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ places }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const errorText = await response.text();
                poiLogger.error("POI API error:", response.status, response.statusText, errorText);
                setPoiLoading(false);
                return;
              }

              const poiResult = await response.json();
              if (poiResult.places && Array.isArray(poiResult.places)) {
                poiLogger.log(`Received POI data for ${poiResult.places.length} places`);
                
                // Update all places at once in a single state update - faster and all pills appear together
                setData((currentData) => {
                  if (!currentData) {
                    return currentData;
                  }
                  
                  // Create a map of POI data by name for fast lookup
                  const poiMap = new Map<string, { nearbyPOIs: string[]; poiSummary: string }>();
                  poiResult.places.forEach((poiInfo: { lat: number; lon: number; name: string; nearbyPOIs: string[]; poiSummary: string }) => {
                    poiMap.set(poiInfo.name, {
                      nearbyPOIs: Array.isArray(poiInfo.nearbyPOIs) && poiInfo.nearbyPOIs.length > 0 
                        ? [...poiInfo.nearbyPOIs] 
                        : [],
                      poiSummary: poiInfo.poiSummary || "",
                    });
                  });
                  
                  // Update all recommendations that have POI data
                  const updatedRecommendations = currentData.recommendations.map((r) => {
                    // Try to find POI data by name first (most reliable)
                    let poiData = poiMap.get(r.place.name);
                    
                    // If no name match, try by coordinates
                    if (!poiData) {
                      poiData = poiResult.places.find(
                        (p: { lat: number; lon: number; name: string }) =>
                          Math.abs(p.lat - r.place.lat) < 0.01 && Math.abs(p.lon - r.place.lon) < 0.01
                      );
                      if (poiData) {
                        poiData = {
                          nearbyPOIs: Array.isArray(poiData.nearbyPOIs) && poiData.nearbyPOIs.length > 0 
                            ? [...poiData.nearbyPOIs] 
                            : [],
                          poiSummary: poiData.poiSummary || "",
                        };
                      }
                    }
                    
                    if (poiData) {
                      poiLogger.debug(`✓ Updating ${r.place.name} with ${poiData.nearbyPOIs.length} POIs`);
                      return {
                        ...r,
                        place: {
                          ...r.place,
                          nearbyPOIs: poiData.nearbyPOIs,
                          poiSummary: poiData.poiSummary,
                        },
                      };
                    }
                    return r;
                  });
                  
                  return {
                    ...currentData,
                    recommendations: updatedRecommendations,
                  };
                });
              }
              setPoiLoading(false);
            })
            .catch((error) => {
              poiLogger.error("Error fetching POI data:", error);
              setPoiLoading(false);
            });
        }
      } catch (error) {
        clientLogger.error("Error fetching recommendations:", error);
        setStatus("error");
        setStatusMessage("Failed to fetch recommendations. Please try again.");
        setData(null);
        setIsExiting(false);
        // Reset to empty state on error
        setSelectedLocation("");
      }
    }, 150); // Match exit animation duration
  };

  const handleEditLocation = () => {
    setSelectedLocation("");
    setData(null);
    setStatus(null);
    setUserLocation(null);
    setPoiLoading(false);
  };


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
      {/* Conditional Rendering: Empty State or Results */}
      {!selectedLocation ? (
        /* Empty State - 4 Components Evenly Distributed */
        <div className={`min-h-screen flex flex-col ${isExiting ? 'animate-fade-out-up' : ''}`}>
          {/* Component 1: Title + Subtitle */}
          <div className="bg-gradient-to-b from-blue-50 to-background px-4 flex items-center justify-center h-full flex-1 pt-[40px] lg:pt-[75px] pr-[28px] pb-[0px] pl-[28px]">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-[34px] lg:text-[48px] font-semibold mb-3">
                Escape the rain
              </h1>
              <p className="text-[14px] lg:text-[16px] text-muted-foreground max-w-2xl mx-auto">
                Too wet go outside? Find the nearest places
                where it&apos;s dry
              </p>
            </div>
          </div>

          {/* Component 2: Location Selector */}
          <div className="px-8 lg:px-[28px] flex items-center justify-center h-full flex-1 py-[0px]">
            <div className="w-full max-w-7xl">
              <LocationSelector 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                disabled={status === "loading"}
              />
              
              {/* Settings - Hidden by default, can be shown if needed */}
              {showSettings && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rain Forecast Window */}
                    <div>
                      <label htmlFor="strictHours" className="block text-sm font-medium text-muted-foreground mb-2">
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
                        <span className="text-sm text-muted-foreground min-w-[80px]">
                          {strictHours}h ahead
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only show destinations that won&apos;t rain in the next {strictHours} hour{strictHours !== 1 ? "s" : ""} (your location is checked for 12 hours)
                      </p>
                    </div>

                    {/* Search Distance */}
                    <div>
                      <label htmlFor="searchDistance" className="block text-sm font-medium text-muted-foreground mb-2">
                        Search distance
                      </label>
                      <select
                        id="searchDistance"
                        value={searchDistance}
                        onChange={(e) => setSearchDistance(e.target.value)}
                        disabled={status === "loading"}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="auto">Auto (anywhere)</option>
                        <option value="10">0-10 km</option>
                        <option value="25">11-25 km</option>
                        <option value="50">26-50 km</option>
                        <option value="100">50-100 km</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {searchDistance === "auto" 
                          ? "Searches 10km first, then 25km, then 50km, then 100km if needed"
                          : `Maximum distance to search for dry places: ${searchDistance}km`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {status === "loading" && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-muted-foreground">{statusMessage || "Checking weather and finding dry places..."}</p>
                </div>
              )}

              {/* Error State */}
              {status === "error" && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-600 mt-1">{statusMessage || "Something went wrong. Please try again."}</p>
                </div>
              )}
            </div>
          </div>

          {/* Component 3: Animation */}
          <div className="px-4 flex items-center justify-center h-full flex-1 mt-[0px] mr-[0px] mb-[20px] lg:mb-[40px] ml-[0px]">
            <EmptyState />
          </div>

          {/* Component 4: Footer - Pinned to Bottom */}
          <footer className="px-4 py-4 border-t border-border text-center text-xs text-muted-foreground bg-background">
            <p className="text-[10px]">
              Weather data from{" "}
              <a 
                href="https://open-meteo.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open-Meteo
              </a>
              {" • "}
              Places from{" "}
              <a 
                href="https://opentripmap.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenTripMap
              </a>
              {" • "}
              Maps by{" "}
              <a 
                href="https://www.openstreetmap.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenStreetMap
              </a>
            </p>
          </footer>
        </div>
      ) : (
        /* Results State */
        <div className="w-full flex flex-col min-h-screen">
          {/* Compact Header */}
          <div className="bg-gradient-to-b from-blue-50 to-background py-4 px-4 border-b border-border animate-slide-down">
            <div className="max-w-7xl mx-auto">
              {/* Collapsed Location Selector */}
              <LocationSelector 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                collapsed={true}
                userWeather={userWeather}
              />
            </div>
          </div>

          {/* Main Content - grows to fill available space */}
          <div className="flex-1">
            <div className="max-w-7xl mx-auto px-4 w-full py-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              {/* Desktop: Two Column Layout | Mobile: Stacked */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Destinations List */}
                <div className="order-2 lg:order-1 flex flex-col lg:overflow-hidden">
                  <h2 className="mb-5 text-2xl lg:text-[20px]">Dry destinations nearby</h2>
                  {data && data.recommendations.length > 0 ? (
                    <div className="flex flex-col gap-4 flex-1 lg:overflow-hidden">
                      {data.recommendations.map((destination, index) => {
                        // Use stable key based on place ID only - don't change when POI data arrives
                        // This prevents re-animation when POI data updates
                        const stableKey = destination.place.id;
                        
                        return (
                          <div 
                            key={stableKey}
                            className="animate-fade-in-up flex-1"
                            style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                          >
                            <DestinationCard 
                              destination={destination}
                              index={index}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : data && data.recommendations.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                      <p className="text-yellow-800">
                        {data.error 
                          ? data.error 
                          : status === "not-raining" 
                            ? "No other dry places found nearby. Your location is the best spot!" 
                            : "No dry places found nearby. Try expanding your search distance or check back later!"}
                      </p>
                    </div>
                  ) : null}
                </div>

              {/* Right Column: Map */}
              <div className="order-1 lg:order-2">
                <h2 className="mb-5 text-2xl lg:text-[20px]">Map</h2>
                <div className="h-[400px] lg:h-[calc(100vh-180px)] lg:sticky lg:top-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {userLocation && data && (
                    <MapView 
                      userLocation={userLocation}
                      recommendations={data.recommendations}
                    />
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Footer - Stuck to bottom */}
          <div
            className="animate-fade-in bg-background pb-6"
            style={{ animationDelay: "1s" }}
          >
            <Footer />
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
