"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import type { Recommendation } from "@/lib/types";
import { MAP_CONFIG, ANIMATION_DURATIONS } from "@/lib/constants";

type MapViewProps = {
  userLocation: { lat: number; lon: number } | null;
  recommendations: Recommendation[];
};

export default function MapView({ userLocation, recommendations }: MapViewProps) {
  const apiKey = env.mapboxAccessToken;
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);
  
  // Log API key status on mount
  useEffect(() => {
    clientLogger.debug("[Map] Component mounted, API key present:", !!apiKey);
    if (!apiKey) {
      clientLogger.error("[Map] Mapbox access token is missing! Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local");
    }
  }, [apiKey]);

  // Calculate center and bounds
  const allLocations = useMemo(() => {
    const locations: Array<{ lat: number; lon: number }> = [];
    if (userLocation) {
      locations.push(userLocation);
    }
    recommendations.forEach((rec) => {
      locations.push({ lat: rec.place.lat, lon: rec.place.lon });
    });
    return locations;
  }, [userLocation, recommendations]);

  // Default UK view (centered on UK, zoomed out to show whole country)
  const defaultUKView = MAP_CONFIG.DEFAULT_VIEW;

  // Track if map has loaded
  const [mapLoaded, setMapLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if Mapbox library is loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if mapbox-gl is available
      try {
        // @ts-ignore - mapboxgl might not be in types
        if (window.mapboxgl) {
          clientLogger.debug("[Map] Mapbox GL library is loaded");
        } else {
          clientLogger.warn("[Map] Mapbox GL library not found in window object");
        }
      } catch (e) {
        clientLogger.warn("[Map] Error checking Mapbox library:", e);
      }
      
      // Check if react-map-gl is available
      try {
        const mapboxGl = require('mapbox-gl');
        clientLogger.debug("[Map] mapbox-gl module loaded:", !!mapboxGl);
      } catch (e) {
        clientLogger.error("[Map] Failed to load mapbox-gl module:", e);
      }
    }
  }, []);

  // Fallback: Check if map instance exists after a delay (in case onLoad doesn't fire)
  useEffect(() => {
    if (!mapLoaded && !mapError && apiKey && mapRef.current) {
      const checkInterval = setInterval(() => {
        try {
          const map = mapRef.current?.getMap();
          if (map && map.loaded()) {
            clientLogger.debug("[Map] Map instance detected as loaded (fallback check)");
            setMapLoaded(true);
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (fallbackTimeoutRef.current) {
              clearTimeout(fallbackTimeoutRef.current);
              fallbackTimeoutRef.current = null;
            }
            clearInterval(checkInterval);
          }
        } catch (e) {
          // Map not ready yet
        }
      }, 500); // Check every 500ms
      
      return () => clearInterval(checkInterval);
    }
  }, [mapLoaded, mapError, apiKey]);

  // Fallback: Show map after 3 seconds even if onLoad doesn't fire (sometimes map loads but callback doesn't)
  useEffect(() => {
    if (!mapLoaded && !mapError && apiKey) {
      fallbackTimeoutRef.current = setTimeout(() => {
        clientLogger.debug("[Map] Fallback: Showing map after 3 seconds (onLoad may not have fired)");
        // Check if map instance exists
        try {
          const map = mapRef.current?.getMap();
          if (map) {
            clientLogger.debug("[Map] Map instance exists, showing map");
            setMapLoaded(true);
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        } catch (e) {
          clientLogger.warn("[Map] Map instance not available yet");
        }
      }, 3000);
      
      return () => {
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
      };
    }
  }, [mapLoaded, mapError, apiKey]);

  // Timeout fallback - if map doesn't load in 10 seconds, show error
  useEffect(() => {
    if (!mapLoaded && !mapError && apiKey) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        clientLogger.warn("[Map] Map load timeout - map didn't load within 10 seconds");
        // Check one more time if map is actually loaded
        try {
          const map = mapRef.current?.getMap();
          if (map && map.loaded()) {
            clientLogger.debug("[Map] Map was actually loaded, just onLoad didn't fire");
            setMapLoaded(true);
            return;
          }
        } catch (e) {
          // Map not loaded
        }
        setMapError("Map failed to load. Please check your Mapbox token and try refreshing.");
      }, 10000);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [mapLoaded, mapError, apiKey]);

  // Calculate bounds and zoom to fit all locations
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    // If no locations, reset to default UK view
    if (allLocations.length === 0) {
      map.flyTo({
        center: [defaultUKView.longitude, defaultUKView.latitude],
        zoom: defaultUKView.zoom,
        duration: 1000,
      });
      return;
    }

    const lats = allLocations.map((loc) => loc.lat);
    const lons = allLocations.map((loc) => loc.lon);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    // If all locations are very close together (within threshold), use a fixed zoom level
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    const isVeryClose = latRange < MAP_CONFIG.CLOSE_THRESHOLD && lonRange < MAP_CONFIG.CLOSE_THRESHOLD;
    
    if (isVeryClose && allLocations.length > 0) {
      const center = allLocations[0];
      map.flyTo({
        center: [center.lon, center.lat],
        zoom: MAP_CONFIG.CLOSE_ZOOM,
        duration: ANIMATION_DURATIONS.MAP_FLY_TO,
      });
    } else {
      // Calculate bounds with padding
      const latPadding = Math.max(
        (maxLat - minLat) * MAP_CONFIG.BOUNDS_PADDING_PERCENT,
        MAP_CONFIG.MIN_BOUNDS_PADDING
      );
      const lonPadding = Math.max(
        (maxLon - minLon) * MAP_CONFIG.BOUNDS_PADDING_PERCENT,
        MAP_CONFIG.MIN_BOUNDS_PADDING
      );
      
      map.fitBounds(
        [
          [minLon - lonPadding, minLat - latPadding],
          [maxLon + lonPadding, maxLat + latPadding],
        ],
        {
          padding: MAP_CONFIG.PADDING,
          duration: ANIMATION_DURATIONS.MAP_FLY_TO,
          maxZoom: MAP_CONFIG.MAX_ZOOM,
        }
      );
    }
  }, [allLocations, mapLoaded]);

  // Log API key status (without exposing the key)
  useEffect(() => {
    if (!apiKey) {
      clientLogger.error("[Map] Mapbox access token is missing! Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local");
    } else {
      clientLogger.debug("[Map] Mapbox token is present, initializing map...");
    }
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 text-center">Mapbox access token not configured</p>
        <p className="text-xs text-gray-400 mt-2 text-center">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file</p>
        <p className="text-xs text-gray-400 mt-1 text-center">Then restart your dev server</p>
      </div>
    );
  }

  const handleRetry = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMapError(null);
    setMapLoaded(false);
    // Force re-render by resetting state
    setTimeout(() => {
      console.log("[Map] Retrying map initialization...");
    }, 100);
  };

  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 text-center">Error loading map</p>
        <p className="text-xs text-gray-400 mt-2 text-center">{mapError}</p>
        <button 
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl lg:rounded-3xl border border-border relative overflow-hidden">
      {/* Grid pattern background overlay */}
      <div className="absolute inset-0 opacity-20 z-0 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div 
        className="relative w-full h-full z-10" 
        style={{ minHeight: '400px', minWidth: '100%' }}
        ref={(el) => {
          if (el) {
            const rect = el.getBoundingClientRect();
            console.log("[Map] Container dimensions:", { width: rect.width, height: rect.height });
            if (rect.width === 0 || rect.height === 0) {
              console.warn("[Map] Container has zero dimensions - map may not initialize");
            }
          }
        }}
      >
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        )}
        <Map
          ref={mapRef}
          mapboxAccessToken={apiKey}
          initialViewState={defaultUKView}
          style={{ width: "100%", height: "100%", minHeight: '400px', opacity: mapLoaded ? 1 : 0 }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onLoad={(e) => {
            console.log("[Map] Map loaded successfully", e);
            // Clear timeouts on successful load
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (fallbackTimeoutRef.current) {
              clearTimeout(fallbackTimeoutRef.current);
              fallbackTimeoutRef.current = null;
            }
            setMapLoaded(true);
            setMapError(null);
          }}
          onError={(e) => {
            console.error("[Map] Map error:", e);
            // Clear timeout on error
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            const errorMessage = e.error?.message || (e.error ? String(e.error) : String(e)) || "Failed to load map";
            console.error("[Map] Error details:", {
              error: e,
              errorMessage,
              apiKeyPresent: !!apiKey,
              apiKeyLength: apiKey?.length || 0
            });
            setMapError(errorMessage);
            setMapLoaded(false);
          }}
          onMoveStart={() => {
            // If map is moving, it's definitely loaded
            if (!mapLoaded) {
              console.log("[Map] Map is interactive (onMoveStart fired) - marking as loaded");
              setMapLoaded(true);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
                fallbackTimeoutRef.current = null;
              }
            }
          }}
        >
          {userLocation && (
            <Marker
              longitude={userLocation.lon}
              latitude={userLocation.lat}
              anchor="center"
              onClick={() => setSelectedPlace("user")}
            >
              <div className="relative cursor-pointer z-20">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                <div className="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
              </div>
            </Marker>
          )}
          {recommendations.map((rec, index) => {
            const number = index + 1; // 1, 2, 3, 4, 5 (1 = closest)
            return (
              <Marker
                key={rec.place.id}
                longitude={rec.place.lon}
                latitude={rec.place.lat}
                anchor="bottom"
                onClick={() => setSelectedPlace(rec.place.id)}
              >
                <div className="relative cursor-pointer z-10">
                  <MapPin className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-lg" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-bold -mt-1.5">{number}</span>
                  </div>
                </div>
              </Marker>
            );
          })}
        {selectedPlace === "user" && userLocation && (
          <Popup
            longitude={userLocation.lon}
            latitude={userLocation.lat}
            anchor="bottom"
            onClose={() => setSelectedPlace(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <div className="font-semibold">Your location</div>
            </div>
          </Popup>
        )}
        {recommendations.map((rec) => {
          // Get POIs from nearbyPOIs array, filtering out "attractions"
          const getPOIs = (): string[] => {
            if (rec.place.nearbyPOIs && rec.place.nearbyPOIs.length > 0) {
              return rec.place.nearbyPOIs
                .filter(poi => poi.toLowerCase() !== "attractions")
                .slice(0, 5);
            }
            return [];
          };
          
          const pois = getPOIs();
          
          return selectedPlace === rec.place.id && (
            <Popup
              key={rec.place.id}
              longitude={rec.place.lon}
              latitude={rec.place.lat}
              anchor="bottom"
              onClose={() => setSelectedPlace(null)}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="p-4 w-fit min-w-[200px]">
                <div className="font-medium text-xl text-foreground mb-2 pr-8">{rec.place.name}</div>
                <div className="text-base text-muted-foreground mb-2">{rec.rainSummary}</div>
                {pois.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {pois.join(", ")}
                  </div>
                )}
              </div>
            </Popup>
          );
        })}
        </Map>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-white/80 px-2 py-1 rounded z-20">
        Maps © OpenStreetMap
      </div>
    </div>
  );
}
