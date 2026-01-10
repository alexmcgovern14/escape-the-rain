/**
 * GET /api/geocode
 * Geocoding endpoint using Open-Meteo Geocoding API
 * Query param: q (place name to search)
 */

import { NextRequest, NextResponse } from "next/server";
import type { GeocodeResult } from "@/lib/types";
import { apiLogger } from "@/lib/logger";

// Force dynamic rendering - API routes should never be statically generated
export const dynamic = 'force-dynamic';

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
    // Try Open-Meteo first (primary source)
    const url = new URL(GEOCODING_BASE_URL);
    url.searchParams.set("name", query.trim());
    url.searchParams.set("count", "30"); // Increased from 10 to 30
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    url.searchParams.set("country_codes", "gb"); // Limit to UK only

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    let results: GeocodeResult[] = [];

    // Process Open-Meteo results
    if (data.results && data.results.length > 0) {
      results = data.results
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
    }

    // If we have fewer than 10 results, try Nominatim as fallback
    if (results.length < 10) {
      try {
        const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
        nominatimUrl.searchParams.set("q", `${query.trim()}, UK`);
        nominatimUrl.searchParams.set("format", "json");
        nominatimUrl.searchParams.set("limit", "20");
        nominatimUrl.searchParams.set("countrycodes", "gb");
        nominatimUrl.searchParams.set("addressdetails", "1");

        const nominatimResponse = await fetch(nominatimUrl.toString(), {
          headers: {
            "User-Agent": "EscapeTheRain/1.0",
          },
        });

        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          const nominatimResults: GeocodeResult[] = (nominatimData || [])
            .filter((result: any) => {
              // Filter to UK only
              const country = (result.address?.country_code || "").toLowerCase();
              return country === "gb" || country === "uk";
            })
            .map((result: any) => ({
              name: result.display_name.split(",")[0], // Get primary name
              lat: parseFloat(result.lat),
              lon: parseFloat(result.lon),
              country: result.address?.country || "United Kingdom",
              admin1: result.address?.state || result.address?.county,
            }));

          // Merge and deduplicate results
          const existingNames = new Set(results.map((r) => r.name.toLowerCase()));
          const newResults = nominatimResults.filter(
            (r) => !existingNames.has(r.name.toLowerCase())
          );
          results = [...results, ...newResults].slice(0, 30); // Limit to 30 total
        }
      } catch (nominatimError) {
        apiLogger.error("Nominatim fallback error:", nominatimError);
        // Continue with Open-Meteo results only
      }
    }

    // Deduplicate by name and coordinates
    const seen = new Set<string>();
    const deduplicatedResults = results.filter((result) => {
      const key = `${result.name.toLowerCase()}-${result.lat.toFixed(2)}-${result.lon.toFixed(2)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return NextResponse.json({ results: deduplicatedResults.slice(0, 30) });
  } catch (error) {
    apiLogger.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}

