/**
 * GET /api/weather
 * Weather check endpoint for a single location
 * Query params: lat, lon
 */

import { NextRequest, NextResponse } from "next/server";
import { checkWeatherAtLocation } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Query parameters 'lat' and 'lon' are required" },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: "Invalid latitude or longitude" },
      { status: 400 }
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: "Latitude must be between -90 and 90, longitude between -180 and 180" },
      { status: 400 }
    );
  }

  try {
    const weather = await checkWeatherAtLocation(latitude, longitude);
    return NextResponse.json(weather);
  } catch (error) {
    console.error("Weather check error:", error);
    return NextResponse.json(
      { error: "Failed to check weather" },
      { status: 500 }
    );
  }
}

