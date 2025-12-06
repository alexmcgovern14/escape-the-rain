/**
 * GET /api/geocode
 * Geocoding endpoint using Open-Meteo Geocoding API
 * Query param: q (place name to search)
 */

import { NextRequest, NextResponse } from "next/server";
import type { GeocodeResult } from "@/lib/types";

const GEOCODING_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const url = new URL(GEOCODING_BASE_URL);
    url.searchParams.set("name", query.trim());
    url.searchParams.set("count", "10");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    url.searchParams.set("country_codes", "gb"); // Limit to UK only

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Normalize results and filter to UK only
    const results: GeocodeResult[] = data.results
      .filter((result: any) => {
        // Filter to UK only - check country code or country name
        const country = (result.country_code || result.country || "").toLowerCase();
        return country === "gb" || country === "uk" || country === "united kingdom" || country === "great britain";
      })
      .map((result: any) => ({
        name: result.name,
        lat: result.latitude,
        lon: result.longitude,
        country: result.country,
        admin1: result.admin1, // State/Province
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}

