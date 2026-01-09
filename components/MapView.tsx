"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import type { Recommendation } from "@/lib/types";

type MapViewProps = {
  userLocation: { lat: number; lon: number } | null;
  recommendations: Recommendation[];
};

export default function MapView({ userLocation, recommendations }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

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
  const defaultUKView = {
    longitude: -2.0,
    latitude: 54.0,
    zoom: 5.5,
  };

  // Track if map has loaded
  const [mapLoaded, setMapLoaded] = useState(false);

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
    
    // If all locations are very close together (within ~1km), use a fixed zoom level
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    const isVeryClose = latRange < 0.01 && lonRange < 0.01; // ~1km
    
    if (isVeryClose && allLocations.length > 0) {
      // Use the first location as center and set a reasonable zoom
      const center = allLocations[0];
      map.flyTo({
        center: [center.lon, center.lat],
        zoom: 12,
        duration: 1000,
      });
    } else {
      // Calculate bounds with padding
      // Add padding to bounds (10% on each side, minimum 0.01 degrees)
      const latPadding = Math.max((maxLat - minLat) * 0.1, 0.01);
      const lonPadding = Math.max((maxLon - minLon) * 0.1, 0.01);
      
      map.fitBounds(
        [
          [minLon - lonPadding, minLat - latPadding],
          [maxLon + lonPadding, maxLat + latPadding],
        ],
        {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000, // Smooth animation
          maxZoom: 15, // Don't zoom in too much
        }
      );
    }
  }, [allLocations, mapLoaded]);

  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Mapbox access token not configured</p>
        <p className="text-xs text-gray-400 mt-2">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file</p>
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

      <div className="relative w-full h-full z-10">
        <Map
          ref={mapRef}
          mapboxAccessToken={apiKey}
          initialViewState={defaultUKView}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onLoad={() => setMapLoaded(true)}
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
