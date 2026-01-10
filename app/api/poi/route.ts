import { NextRequest, NextResponse } from "next/server";
import { enrichPlaceWithPOIs } from "@/lib/places";
import { poiLogger } from "@/lib/logger";
import { env } from "@/lib/env";

// Force dynamic rendering - API routes should never be statically generated
export const dynamic = 'force-dynamic';

/**
 * API endpoint to enrich places with POI data
 * Called asynchronously after initial recommendations are returned
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { places } = body;

    if (!Array.isArray(places)) {
      return NextResponse.json(
        { error: "Invalid request: places must be an array" },
        { status: 400 }
      );
    }

    const geoapifyApiKey = env.geoapifyApiKey;

    // Enrich all places with POI data in parallel
    const enrichedPlaces = await Promise.all(
      places.map(async (place: { lat: number; lon: number; name: string }) => {
        try {
          const poiData = await enrichPlaceWithPOIs(
            place.lat,
            place.lon,
            place.name,
            geoapifyApiKey
          );
          return {
            lat: place.lat,
            lon: place.lon,
            name: place.name,
            nearbyPOIs: poiData.nearbyPOIs,
            poiSummary: poiData.poiSummary,
          };
        } catch (error) {
          poiLogger.error(`Error enriching ${place.name}:`, error);
          return {
            lat: place.lat,
            lon: place.lon,
            name: place.name,
            nearbyPOIs: [],
            poiSummary: "",
          };
        }
      })
    );

    return NextResponse.json({ places: enrichedPlaces });
  } catch (error) {
    poiLogger.error("Error in POI enrichment endpoint:", error);
    return NextResponse.json(
      { error: "Failed to enrich places with POI data" },
      { status: 500 }
    );
  }
}

