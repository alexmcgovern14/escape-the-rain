import React from 'react';
import { CloudRain, Sun, Cloud, MapPin, Edit2 } from 'lucide-react';
import { Button } from './components/ui/button';

interface DesignStatesProps {
  onBack: () => void;
}

export default function DesignStates({ onBack }: DesignStatesProps) {
  // All possible weather states
  const weatherStates = [
    {
      status: 'rain-hours' as const,
      hours: 3,
      display: {
        icon: <CloudRain className="size-4 text-blue-600" />,
        text: 'Rain for next 3 hours',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      }
    },
    {
      status: 'rain-hours' as const,
      hours: 5,
      display: {
        icon: <CloudRain className="size-4 text-blue-600" />,
        text: 'Rain for next 5 hours',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      }
    },
    {
      status: 'dry-until' as const,
      time: '2:00 PM',
      display: {
        icon: <CloudRain className="size-4 text-blue-600" />,
        text: 'Rain at 2:00 PM',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      }
    },
    {
      status: 'dry-until' as const,
      time: '5:30 PM',
      display: {
        icon: <CloudRain className="size-4 text-blue-600" />,
        text: 'Rain at 5:30 PM',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      }
    },
    {
      status: 'rain-all-day' as const,
      display: {
        icon: <CloudRain className="size-4 text-blue-600" />,
        text: 'Rain all day',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      }
    },
    {
      status: 'dry-all-day' as const,
      display: {
        icon: <Sun className="size-4 text-yellow-600" />,
        text: 'Dry all day',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Weather State Design Showcase</h1>
            <p className="text-muted-foreground">All possible header states for the user's location weather report</p>
          </div>
          <Button onClick={onBack} variant="outline">
            Back to App
          </Button>
        </div>

        <div className="space-y-6">
          {weatherStates.map((state, index) => (
            <div key={index} className="border border-border rounded-lg p-6 bg-card">
              <div className="mb-3">
                <h3 className="font-medium mb-1">State: {state.status}</h3>
                {state.status === 'rain-hours' && (
                  <p className="text-sm text-muted-foreground">Hours: {state.hours}</p>
                )}
                {state.status === 'dry-until' && (
                  <p className="text-sm text-muted-foreground">Time: {state.time}</p>
                )}
              </div>

              {/* Header Preview */}
              <div className="bg-gradient-to-b from-blue-50 to-background py-4 px-4 border border-border rounded-md">
                <div className="flex items-center justify-center gap-3 py-2 transition-all duration-300 flex-wrap">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <span className="text-sm font-medium">Braintree, England, United Kingdom</span>
                    <button
                      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Edit location"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                  </div>
                  {state.display && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 ${state.display.bgColor} rounded-full`}>
                      {state.display.icon}
                      <span className="text-sm font-medium text-foreground">
                        {state.display.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}