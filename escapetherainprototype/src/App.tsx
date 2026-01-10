import React, { useState } from "react";
import LocationSelector from "./components/LocationSelector";
import DestinationCard, {
  Destination,
} from "./components/DestinationCard";
import MapView from "./components/MapView";
import Footer from "./components/Footer";
import EmptyState from "./components/EmptyState";
import DesignStates from "./design-states";

// Mock data for dry destinations
const MOCK_DESTINATIONS: Destination[] = [
  {
    id: 1,
    name: "Whittlesford",
    distance: "38.2km",
    weatherStatus: "Dry all day",
    weatherIcon: "sun",
    thingsToDo: [
      "attractions",
      "cafes",
      "forests",
      "museums",
      "nature reserves",
    ],
  },
  {
    id: 2,
    name: "Cambridge",
    distance: "42.1km",
    weatherStatus: "Dry all day",
    weatherIcon: "cloud-sun",
    thingsToDo: [
      "museums",
      "universities",
      "punting",
      "shopping",
      "dining",
    ],
  },
  {
    id: 3,
    name: "Saffron Walden",
    distance: "45.8km",
    weatherStatus: "Dry all day",
    weatherIcon: "cloud-fog",
    thingsToDo: [
      "gardens",
      "historic sites",
      "markets",
      "cafes",
      "walks",
    ],
  },
  {
    id: 4,
    name: "Colchester",
    distance: "52.3km",
    weatherStatus: "Dry all day",
    weatherIcon: "wind",
    thingsToDo: [
      "castle",
      "zoo",
      "museums",
      "parks",
      "restaurants",
    ],
  },
  {
    id: 5,
    name: "Bury St Edmunds",
    distance: "58.7km",
    weatherStatus: "Dry all day",
    weatherIcon: "cloud",
    thingsToDo: [
      "abbey",
      "gardens",
      "theatre",
      "shopping",
      "pubs",
    ],
  },
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [showDesignStates, setShowDesignStates] = useState(false);

  // Mock user's current location weather - Change this to test different states
  const userWeather = {
    status: "rain-hours" as const,
    hours: 3,
    // For 'dry-until' status, use:
    // status: 'dry-until' as const,
    // time: '2:00 PM',
    // For 'rain-all-day' status, use:
    // status: 'rain-all-day' as const,
    // For 'dry-all-day' status, use:
    // status: 'dry-all-day' as const,
  };

  const handleLocationSelect = (location: string) => {
    // Trigger exit animation
    setIsExiting(true);

    // After exit animation completes, switch to results
    setTimeout(() => {
      setSelectedLocation(location);
      setIsExiting(false);
    }, 150); // Match fadeOut animation duration
  };

  // If showing design states, render that instead
  if (showDesignStates) {
    return <DesignStates onBack={() => setShowDesignStates(false)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Conditional Rendering: Empty State or Results */}
      {!selectedLocation ? (
        /* Empty State - 4 Components Evenly Distributed */
        <div
          className={`min-h-screen flex flex-col ${isExiting ? "animate-fade-out-up" : ""}`}
        >
          {/* Component 1: Title + Subtitle */}
          <div className="bg-gradient-to-b from-blue-50 to-background px-4 flex items-center justify-center h-full flex-1 pt-[75px] pr-[28px] pb-[0px] pl-[28px]">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-semibold mb-3 text-[36px] md:text-[40px]">
                Escape the rain
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-[16px]">
                Too wet go outside? Find the nearest places
                where it's dry
              </p>
            </div>
          </div>

          {/* Component 2: Location Selector */}
          <div className="px-[28px] flex items-center justify-center h-full flex-1 py-[0px]">
            <div className="w-full max-w-7xl">
              <LocationSelector
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* Component 3: Animation */}
          <div className="px-4 flex items-center justify-center h-full flex-1 mt-[0px] mr-[0px] mb-[40px] ml-[0px]">
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
        <div className="w-full flex flex-col flex-1 overflow-hidden">
          {/* Compact Header */}
          <div className="bg-gradient-to-b from-blue-50 to-background py-4 px-4 border-b border-border animate-slide-down">
            <div className="max-w-7xl mx-auto">
              {/* Collapsed Location Selector */}
              <LocationSelector
                onLocationSelect={setSelectedLocation}
                selectedLocation={selectedLocation}
                collapsed={true}
                userWeather={userWeather}
              />
            </div>
          </div>

          {/* Main Content */}
          <div
            className="max-w-7xl mx-auto px-4 w-full flex-1 flex flex-col animate-slide-up overflow-hidden py-6"
            style={{ animationDelay: "0.15s" }}
          >
            {/* Desktop: Two Column Layout | Mobile: Stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 lg:overflow-hidden">
              {/* Left Column: Destinations List */}
              <div className="order-2 lg:order-1 flex flex-col lg:overflow-hidden">
                <h2 className="mb-5">
                  Dry destinations nearby
                </h2>
                <div className="flex flex-col gap-4 flex-1 lg:overflow-hidden">
                  {MOCK_DESTINATIONS.map(
                    (destination, index) => (
                      <div
                        key={destination.id}
                        className="animate-fade-in-up flex-1"
                        style={{
                          animationDelay: `${0.4 + index * 0.1}s`,
                        }}
                      >
                        <DestinationCard
                          destination={destination}
                          index={index + 1}
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Right Column: Map */}
              <div className="order-1 lg:order-2 flex flex-col lg:overflow-hidden">
                <h2 className="mb-5">Map</h2>
                <div
                  className="h-[400px] lg:h-full flex-1 animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <MapView destinations={MOCK_DESTINATIONS} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="animate-fade-in pt-6"
              style={{ animationDelay: "1s" }}
            >
              <Footer onViewDesignStates={() => setShowDesignStates(true)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Temporarily show design states - comment out to see main app
// export default DesignStates;