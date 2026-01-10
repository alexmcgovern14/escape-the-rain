import React from 'react';
import { Cloud, Sun, MapPin } from 'lucide-react';

// Custom rain cloud with independently animated rain lines
function AnimatedRainCloud({ className, size }: { className?: string; size: number }) {
  return (
    <div className={`relative ${className}`} style={{ width: `${size}px`, height: `${size * 1.4}px` }}>
      {/* Cloud icon from lucide */}
      <Cloud className="absolute top-0 left-0" style={{ width: `${size}px`, height: `${size}px` }} />
      
      {/* Custom rain lines positioned below the cloud */}
      <svg
        className="absolute"
        style={{ top: `${size * 0.85}px`, left: 0, width: `${size}px`, height: `${size * 0.6}px` }}
        viewBox="0 0 100 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left rain line - pulses first */}
        <line
          x1="25"
          y1="0"
          x2="25"
          y2="20"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="rain-line-1"
        />
        {/* Right rain line - pulses second */}
        <line
          x1="75"
          y1="0"
          x2="75"
          y2="20"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="rain-line-2"
        />
        {/* Center rain line - pulses third */}
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="25"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="rain-line-3"
        />
      </svg>
    </div>
  );
}

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 text-center">
      {/* Animated weather icons */}
      <div className="relative w-64 h-64">
        {/* Rain cloud */}
        <div className="absolute top-0 left-0 opacity-40">
          <AnimatedRainCloud className="text-blue-400" size={85} />
        </div>
        
        {/* Main sun icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Sun className="size-32 text-yellow-500 animate-spin opacity-100" style={{ animationDuration: '20s' }} />
        </div>
        
        {/* Rain clouds */}
        <div className="absolute top-8 opacity-30" style={{ right: '-25px' }}>
          <AnimatedRainCloud className="text-blue-400" size={106} />
        </div>
        
        <div className="absolute bottom-4 left-4 animate-pulse opacity-20" style={{ animationDelay: '2s' }}>
          <Cloud className="size-20 text-gray-400" />
        </div>
      </div>
    </div>
  );
}