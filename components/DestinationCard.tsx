"use client";

import { useMemo, useRef, useState } from "react";
import { MapPin, Sun, Cloud, CloudSun, CloudRain, CloudFog, Wind, Snowflake, CloudDrizzle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import type { Recommendation } from "@/lib/types";
import { formatDistance, getGoogleMapsUrl } from "@/lib/utils";
import { POI_FILTERS, SEARCH_CONFIG } from "@/lib/constants";
import { getWeatherIconFromCode } from "@/lib/weather";

interface DestinationCardProps {
  destination: Recommendation;
  index: number; // 0-based index for numbering (1 = closest)
}

export default function DestinationCard({ destination, index }: DestinationCardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleOpenInMaps = () => {
    const url = getGoogleMapsUrl(destination.place.lat, destination.place.lon);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Use rainSummary as-is (already formatted by weather API)
  const weatherStatus = destination.rainSummary;

  // Get weather icon based on actual weather code from API
  const getWeatherIcon = () => {
    const iconClass = "h-[1em] w-[1em]";
    const iconType = getWeatherIconFromCode(destination.weatherCode);
    
    switch (iconType) {
      case 'sun':
        return <Sun className={`${iconClass} text-yellow-500`} />;
      case 'cloud-sun':
        return <CloudSun className={`${iconClass} text-gray-500`} />;
      case 'cloud':
        return <Cloud className={`${iconClass} text-gray-500`} />;
      case 'cloud-rain':
        return <CloudRain className={`${iconClass} text-blue-500`} />;
      case 'cloud-fog':
        return <CloudFog className={`${iconClass} text-gray-500`} />;
      case 'wind':
        return <Wind className={`${iconClass} text-gray-500`} />;
      case 'snowflake':
        return <Snowflake className={`${iconClass} text-blue-500`} />;
      case 'cloud-drizzle':
        return <CloudDrizzle className={`${iconClass} text-gray-500`} />;
      default:
        return <CloudSun className={`${iconClass} text-gray-500`} />;
    }
  };

  // Check if POI enrichment has completed (nearbyPOIs is defined, even if empty)
  const poiEnrichmentCompleted = destination.place.nearbyPOIs !== undefined;
  
  // Get "Things to do" from nearbyPOIs - calculate directly without delays
  // This recalculates immediately when destination.place.nearbyPOIs changes
  const thingsToDo = useMemo(() => {
    const result: string[] = [];
    
    // Priority 1: Use nearbyPOIs array if available (these are actual POI categories)
    const currentPOIs = destination.place.nearbyPOIs;
    const currentHasPOIData = currentPOIs && currentPOIs.length > 0;
    
    if (currentHasPOIData && currentPOIs && currentPOIs.length > 0) {
      const filteredPOIs = currentPOIs.filter(
        poi => poi && !POI_FILTERS.EXCLUDED_KEYWORDS.includes(poi.toLowerCase())
      );
      const limited = filteredPOIs.slice(0, SEARCH_CONFIG.POI_LIMIT);
      result.push(...limited);
    } 
    // Priority 2: Extract from poiSummary string
    else if (destination.place.poiSummary) {
      const summary = destination.place.poiSummary.toLowerCase();
      const cleaned = summary
        .replace(/\bnearby\b/g, "")
        .replace(/\band\b/g, ",")
        .replace(/\s+/g, " ")
        .trim();
      const keywords = cleaned
        .split(",")
        .map(word => word.trim())
        .filter(word => 
          word.length >= POI_FILTERS.MIN_KEYWORD_LENGTH && 
          word.length <= POI_FILTERS.MAX_KEYWORD_LENGTH
        )
        .filter(word => !POI_FILTERS.EXCLUDED_KEYWORDS.includes(word.toLowerCase()))
        .slice(0, SEARCH_CONFIG.POI_LIMIT);
      result.push(...keywords);
    }
    // Priority 3: Filter kinds to only include POI-related categories, not administrative ones
    else if (destination.place.kinds && destination.place.kinds.length > 0) {
      const poiKinds = destination.place.kinds.filter(kind => {
        const lowerKind = kind.toLowerCase();
        const isAdministrative = POI_FILTERS.ADMINISTRATIVE_KEYWORDS.some(keyword => 
          lowerKind.includes(keyword)
        );
        const isPOICategory = POI_FILTERS.INCLUDED_CATEGORIES.some(category => 
          lowerKind.includes(category)
        );
        return !isAdministrative && isPOICategory;
      });
      
      if (poiKinds.length > 0) {
        const formattedKinds = poiKinds.map(kind => {
          const parts = kind.split('.');
          const lastPart = parts[parts.length - 1] || kind;
          const pluralized = lastPart.endsWith('y') ? lastPart.slice(0, -1) + 'ies' :
                            lastPart.endsWith('s') ? lastPart : lastPart + 's';
          return pluralized;
        });
        const filteredKinds = formattedKinds.filter(
          kind => !POI_FILTERS.EXCLUDED_KEYWORDS.includes(kind.toLowerCase())
        );
        result.push(...filteredKinds.slice(0, SEARCH_CONFIG.POI_LIMIT));
      }
    }

    return result;
  }, [destination.place.nearbyPOIs, destination.place.poiSummary, destination.place.kinds, destination.place.name]);

  // Don't show generic fallback - just leave empty space until POI data arrives

  return (
    <Card className="p-5 hover:shadow-md transition-shadow h-full flex flex-col gap-3 overflow-visible">
      {/* Section 1: Name and Weather Icon with Maps Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-[10px] min-w-0 flex-1">
          <h3 className="font-medium text-lg text-[20px] lg:text-[22px] truncate min-w-0">
            <span className="font-light text-[rgb(59,59,59)]">{index + 1}. </span>{destination.place.name}
          </h3>
          <div className="shrink-0 text-[20px] lg:text-[22px] self-center">
            {getWeatherIcon()}
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={handleOpenInMaps}
          className="shrink-0 bg-[rgb(255,240,146)] hover:bg-[#f4d03f] text-[rgb(0,0,0)]"
        >
          Open map
        </Button>
      </div>
      
      {/* Section 2: Weather Status and Distance */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5" />
          <span className="text-sm text-[14px] lg:text-[16px]">{formatDistance(destination.place.distanceKm)} away</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[14px] lg:text-[16px]">{weatherStatus}</span>
        </div>
      </div>
      
      {/* Section 3: Things to Do Pills - Horizontal scrollable with drag support */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none mt-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {thingsToDo.length > 0 ? (
          thingsToDo.map((thing, pillIndex) => (
            <span 
              key={`${destination.place.id}-poi-${thing}-${destination.place.nearbyPOIs?.length || 0}`}
              className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-[11px] lg:text-[13px] whitespace-nowrap flex-shrink-0"
            >
              {thing}
            </span>
          ))
        ) : poiEnrichmentCompleted ? (
          <span className="text-sm lg:text-base text-muted-foreground italic">No places of interest found</span>
        ) : (
          <span className="text-sm lg:text-base text-muted-foreground italic flex items-center gap-2">
            <Sun className="size-4 text-gray-400 shrink-0 animate-[spin_3s_linear_infinite]" />
            Finding things to do...
          </span>
        )}
      </div>
    </Card>
  );
}

