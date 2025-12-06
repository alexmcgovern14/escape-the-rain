"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
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

  // Calculate bounds and zoom to fit all locations
  useEffect(() => {
    if (mapRef.current && allLocations.length > 0) {
      const lats = allLocations.map((loc) => loc.lat);
      const lons = allLocations.map((loc) => loc.lon);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      
      // Add padding to bounds (10% on each side)
      const latPadding = (maxLat - minLat) * 0.1;
      const lonPadding = (maxLon - minLon) * 0.1;
      
      mapRef.current.fitBounds(
        [
          [minLon - lonPadding, minLat - latPadding],
          [maxLon + lonPadding, maxLat + latPadding],
        ],
        {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000, // Smooth animation
        }
      );
    }
  }, [allLocations]);

  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Mapbox access token not configured</p>
        <p className="text-xs text-gray-400 mt-2">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <Map
        ref={mapRef}
        mapboxAccessToken={apiKey}
        initialViewState={defaultUKView}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {userLocation && (
          <Marker
            longitude={userLocation.lon}
            latitude={userLocation.lat}
            anchor="center"
            onClick={() => setSelectedPlace("user")}
          >
            <div className="cursor-pointer">
              <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">You</span>
              </div>
            </div>
          </Marker>
        )}
        {recommendations.map((rec, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D, E
          return (
            <Marker
              key={rec.place.id}
              longitude={rec.place.lon}
              latitude={rec.place.lat}
              anchor="center"
              onClick={() => setSelectedPlace(rec.place.id)}
            >
              <div className="cursor-pointer">
                <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{letter}</span>
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
        {recommendations.map((rec) => (
          selectedPlace === rec.place.id && (
            <Popup
              key={rec.place.id}
              longitude={rec.place.lon}
              latitude={rec.place.lat}
              anchor="bottom"
              onClose={() => setSelectedPlace(null)}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="p-2">
                <div className="font-semibold">{rec.place.name}</div>
                <div className="text-sm text-gray-600 mt-1">{rec.rainSummary}</div>
                {rec.place.poiSummary && (
                  <div className="text-sm text-blue-700 mt-1">✨ {rec.place.poiSummary}</div>
                )}
              </div>
            </Popup>
          )
        ))}
      </Map>
    </div>
  );
}
