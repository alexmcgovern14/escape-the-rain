import React from 'react';

interface FooterProps {
  onViewDesignStates?: () => void;
}

export default function Footer({ onViewDesignStates }: FooterProps) {
  return (
    <footer className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
      <p>
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
        {onViewDesignStates && (
          <>
            {' • '}
            <button 
              onClick={onViewDesignStates}
              className="text-primary hover:underline cursor-pointer"
            >
              Design States
            </button>
          </>
        )}
      </p>
    </footer>
  );
}