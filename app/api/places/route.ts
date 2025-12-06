/**
 * GET /api/places
 * Fetch nearby interesting places using OpenTripMap
 * Query params: lat, lon, radiusKm (optional, default 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyPlaces } from "@/lib/places";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radiusKm = searchParams.get("radiusKm");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Query parameters 'lat' and 'lon' are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENTRIPMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenTripMap API key not configured" },
      { status: 500 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const radius = radiusKm ? parseFloat(radiusKm) : 50;

  if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
    return NextResponse.json(
      { error: "Invalid latitude, longitude, or radius" },
      { status: 400 }
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: "Latitude must be between -90 and 90, longitude between -180 and 180" },
      { status: 400 }
    );
  }

  if (radius <= 0 || radius > 200) {
    return NextResponse.json(
      { error: "Radius must be between 1 and 200 km" },
      { status: 400 }
    );
  }

  try {
    const places = await fetchNearbyPlaces(latitude, longitude, radius, apiKey);
    return NextResponse.json({ places });
  } catch (error) {
    console.error("Places fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

