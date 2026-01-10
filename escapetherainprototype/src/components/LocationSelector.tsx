import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Search, Edit2, CloudRain, Sun, Cloud } from 'lucide-react';

interface LocationSelectorProps {
  onLocationSelect: (location: string) => void;
  selectedLocation: string;
  collapsed?: boolean;
  userWeather?: {
    status: 'rain-hours' | 'dry-until' | 'rain-all-day' | 'dry-all-day';
    hours?: number;
    time?: string;
  };
}

export default function LocationSelector({ onLocationSelect, selectedLocation, collapsed = false, userWeather }: LocationSelectorProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleUseMyLocation = () => {
    // Mock location detection
    onLocationSelect('Braintree, England, United Kingdom');
    setIsEditing(false);
  };

  const handleSearch = () => {
    if (searchValue.trim()) {
      onLocationSelect(searchValue);
      setSearchValue('');
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
            onClick={() => setIsEditing(true)}
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

  return (
    <div className="space-y-4 lg:w-1/2 lg:mx-auto transition-all duration-300">
      {/* Primary Action: Use My Location */}
      <div className="flex justify-center">
        <Button 
          onClick={handleUseMyLocation}
          size="lg"
          className="text-base px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[16px]"
        >
          <MapPin className="size-5" />
          Use my location
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
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 bg-input-background border-border h-10 text-sm"
          />
        </div>
        <Button 
          variant="secondary"
          onClick={handleSearch}
          className="shrink-0 h-10"
        >
          Search
        </Button>
      </div>
      
      {selectedLocation && !collapsed && (
        <p className="text-sm text-muted-foreground text-center">
          Selected: <span className="text-foreground font-medium">{selectedLocation}</span>
        </p>
      )}
    </div>
  );
}