import React from 'react';
import { Card } from './ui/card';
import { MapPin, Sun, Cloud, CloudSun, CloudRain, CloudFog, Wind, Snowflake, CloudDrizzle } from 'lucide-react';
import { Button } from './ui/button';

export interface Destination {
  id: number;
  name: string;
  distance: string;
  weatherStatus: string;
  thingsToDo: string[];
  weatherIcon?: 'sun' | 'cloud' | 'cloud-sun' | 'cloud-rain' | 'cloud-fog' | 'wind' | 'snowflake' | 'cloud-drizzle';
}

interface DestinationCardProps {
  destination: Destination;
  index?: number;
}

export default function DestinationCard({
  destination,
  index,
}: DestinationCardProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

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
    // Create a Google Maps search URL
    const searchQuery = encodeURIComponent(destination.name);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    window.open(mapsUrl, "_blank");
  };

  // Get the weather icon component
  const getWeatherIcon = () => {
    const iconClass = "h-[1em] w-[1em]";
    switch (destination.weatherIcon) {
      case 'sun':
        return <Sun className={`${iconClass} text-yellow-500`} />;
      case 'cloud':
        return <Cloud className={`${iconClass} text-gray-500`} />;
      case 'cloud-sun':
        return <CloudSun className={`${iconClass} text-gray-500`} />;
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
        return null;
    }
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow h-full flex flex-col gap-3">
      {/* Section 1: Name and Maps Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-[10px] min-w-0 flex-1">
          <h3 className="font-medium text-lg text-[20px] truncate min-w-0">
            <span className="font-light text-[rgb(59,59,59)]">{typeof index === 'number' && `${index}. `}</span>{destination.name}
          </h3>
          <div className="shrink-0 text-[20px] self-center">
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
          <span className="text-sm text-[14px]">{destination.distance} away</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[14px]">{destination.weatherStatus}</span>
        </div>
      </div>
      
      {/* Section 3: Things to Do Pills */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none mt-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {destination.thingsToDo.map((thing, index) => (
          <span 
            key={index}
            className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-[11px] whitespace-nowrap flex-shrink-0"
          >
            {thing}
          </span>
        ))}
      </div>
    </Card>
  );
}