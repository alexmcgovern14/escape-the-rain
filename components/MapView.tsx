"use client";

import { useMemo, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Recommendation } from "@/lib/types";

type MapViewProps = {
  userLocation: { lat: number; lon: number } | null;
  recommendations: Recommendation[];
};

export default function MapView({ userLocation, recommendations }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

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

  const center = useMemo(() => {
    if (allLocations.length === 0) {
      return { lat: 51.5074, lng: -0.1278 }; // Default to London
    }
    const lats = allLocations.map((loc) => loc.lat);
    const lons = allLocations.map((loc) => loc.lon);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  }, [allLocations]);

  if (allLocations.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No locations to display</p>
      </div>
    );
  }

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
        mapboxAccessToken={apiKey}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: userLocation ? 10 : 8,
        }}
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
        {recommendations.map((rec) => (
          <Marker
            key={rec.place.id}
            longitude={rec.place.lon}
            latitude={rec.place.lat}
            anchor="bottom"
            onClick={() => setSelectedPlace(rec.place.id)}
          >
            <div className="cursor-pointer">
              <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">📍</span>
              </div>
            </div>
          </Marker>
        ))}
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
