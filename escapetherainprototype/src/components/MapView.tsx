import React from 'react';

interface MapViewProps {
  destinations: Array<{
    id: number;
    name: string;
    distance: string;
  }>;
}

export default function MapView({ destinations }: MapViewProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-border relative overflow-hidden">
      {/* Mock map background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Map markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-4/5 h-4/5">
          {/* Current location marker */}
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
            </div>
          </div>
          
          {/* Destination markers */}
          {destinations.slice(0, 3).map((dest, index) => {
            const positions = [
              { top: '20%', left: '30%' },
              { top: '15%', right: '25%' },
              { top: '40%', right: '20%' },
            ];
            
            return (
              <div 
                key={dest.id}
                className="absolute z-10"
                style={positions[index]}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="mt-1 text-xs bg-white px-2 py-0.5 rounded shadow text-center font-medium max-w-[100px] truncate">
                    {dest.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-white/80 px-2 py-1 rounded">
        Maps © OpenStreetMap
      </div>
    </div>
  );
}
