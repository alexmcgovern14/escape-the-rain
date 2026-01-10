import React from 'react';

export default function Footer() {
  return (
    <footer className="px-4 py-4 border-t border-border text-center text-xs text-muted-foreground bg-background">
      <p className="text-[10px]">
        Weather data from{' '}
        <a 
          href="https://open-meteo.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Open-Meteo
        </a>
        {' • '}
        Places from{' '}
        <a 
          href="https://opentripmap.io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          OpenTripMap
        </a>
        {' • '}
        Maps by{' '}
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
  );
}

