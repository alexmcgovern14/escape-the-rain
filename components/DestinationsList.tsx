"use client";

import type { Recommendation } from "@/lib/types";
import { formatDistance, getGoogleMapsUrl } from "@/lib/utils";

type DestinationsListProps = {
  recommendations: Recommendation[];
};

export default function DestinationsList({ recommendations }: DestinationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">
          No dry places found nearby. Try expanding your search radius or check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold mb-4">Dry destinations nearby</h2>
      {recommendations.map((rec, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D, E
        return (
          <div
            key={rec.place.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold text-gray-900">
                    {letter}. {rec.place.name}
                  </span>
                </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📍 {formatDistance(rec.place.distanceKm)} away</div>
                <div>🌤️ {rec.rainSummary}</div>
                {rec.place.poiSummary && (
                  <div className="text-sm text-blue-700 mt-1 font-medium">
                    ✨ {rec.place.poiSummary}
                  </div>
                )}
                {!rec.place.poiSummary && rec.place.kinds && rec.place.kinds.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {rec.place.kinds.slice(0, 3).join(", ")}
                  </div>
                )}
              </div>
            </div>
            <a
              href={getGoogleMapsUrl(rec.place.lat, rec.place.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Open in Maps
            </a>
          </div>
        </div>
        );
      })}
    </div>
  );
}

