"use client";

import { MapPin, Sun } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import type { Recommendation } from "@/lib/types";
import { formatDistance, getGoogleMapsUrl } from "@/lib/utils";

interface DestinationCardProps {
  destination: Recommendation;
  index: number; // 0-based index for numbering (1 = closest)
}

export default function DestinationCard({ destination, index }: DestinationCardProps) {
  const handleOpenInMaps = () => {
    const url = getGoogleMapsUrl(destination.place.lat, destination.place.lon);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Use rainSummary as-is (already formatted by weather API)
  const weatherStatus = destination.rainSummary;

  // Get "Things to do" from nearbyPOIs (POI categories), not from kinds (administrative categories)
  const thingsToDo: string[] = [];
  
  // Check if POI enrichment has completed (nearbyPOIs is defined, even if empty)
  // Initially, nearbyPOIs is undefined, then becomes [] after enrichment completes
  const poiEnrichmentCompleted = destination.place.nearbyPOIs !== undefined;
  const hasPOIData = destination.place.nearbyPOIs && destination.place.nearbyPOIs.length > 0;
  
  // Priority 1: Use nearbyPOIs array if available (these are actual POI categories)
  if (hasPOIData && destination.place.nearbyPOIs) {
    // Filter out "attractions" as it's too vague and appears on every location
    const filteredPOIs = destination.place.nearbyPOIs.filter(poi => poi.toLowerCase() !== "attractions");
    thingsToDo.push(...filteredPOIs.slice(0, 5));
  } 
  // Priority 2: Extract from poiSummary string
  else if (destination.place.poiSummary) {
    // Extract keywords from poiSummary (e.g., "Shops, restaurants, and parks nearby" -> ["shops", "restaurants", "parks"])
    const summary = destination.place.poiSummary.toLowerCase();
    // Remove common words and split by commas/and
    const cleaned = summary
      .replace(/\bnearby\b/g, "")
      .replace(/\band\b/g, ",")
      .replace(/\s+/g, " ")
      .trim();
    const keywords = cleaned
      .split(",")
      .map(word => word.trim())
      .filter(word => word.length > 2 && word.length < 20)
      .filter(word => word.toLowerCase() !== "attractions") // Filter out "attractions"
      .slice(0, 5);
    thingsToDo.push(...keywords);
  }
  // Priority 3: Filter kinds to only include POI-related categories, not administrative ones
  else if (destination.place.kinds && destination.place.kinds.length > 0) {
    // Filter out administrative categories like "administrative", "district_level", "populated_place"
    const poiKinds = destination.place.kinds.filter(kind => {
      const lowerKind = kind.toLowerCase();
      // Exclude administrative and place type categories
      return !lowerKind.includes('administrative') && 
             !lowerKind.includes('populated_place') &&
             !lowerKind.includes('district') &&
             !lowerKind.includes('county') &&
             !lowerKind.includes('municipality') &&
             // Include POI categories
             (lowerKind.includes('tourism') ||
              lowerKind.includes('amenity') ||
              lowerKind.includes('leisure') ||
              lowerKind.includes('sport') ||
              lowerKind.includes('entertainment') ||
              lowerKind.includes('catering') ||
              lowerKind.includes('commercial') ||
              lowerKind.includes('natural'));
    });
    
    if (poiKinds.length > 0) {
      // Format POI kinds nicely
      const formattedKinds = poiKinds.map(kind => {
        // Convert "tourism.museum" -> "museums", "amenity.cafe" -> "cafes"
        const parts = kind.split('.');
        const lastPart = parts[parts.length - 1] || kind;
        // Pluralize common terms
        const pluralized = lastPart.endsWith('y') ? lastPart.slice(0, -1) + 'ies' :
                          lastPart.endsWith('s') ? lastPart : lastPart + 's';
        return pluralized;
      });
      // Filter out "attractions" as it's too vague
      const filteredKinds = formattedKinds.filter(kind => kind.toLowerCase() !== "attractions");
      thingsToDo.push(...filteredKinds.slice(0, 5));
    }
  }

  // Don't show generic fallback - just leave empty space until POI data arrives

  return (
    <Card className="p-5 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-between">
        {/* Section 1: Name and Button */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-xl">{index + 1}. {destination.place.name}</h3>
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleOpenInMaps}
            className="bg-gray-200 hover:bg-gray-300 border-0"
          >
            Open in Maps
          </Button>
        </div>
        
        {/* Section 2: Distance and Weather */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5" />
            <span className="text-base">{formatDistance(destination.place.distanceKm)} away</span>
          </div>
          <div className="flex items-center gap-2 text-base">
            <Sun className="size-5 text-yellow-500" />
            <span className="font-medium">{weatherStatus}</span>
          </div>
        </div>
        
        {/* Section 3: Pills */}
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {thingsToDo.map((thing, pillIndex) => (
            <span 
              key={pillIndex}
              className="text-sm px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full"
              style={{ 
                animation: `fadeInLeft 0.4s ease-out ${pillIndex * 0.1}s both`,
              }}
            >
              {thing}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

