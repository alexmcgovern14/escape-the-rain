/**
 * OpenTripMap API client for finding interesting places
 * Documentation: https://opentripmap.io/docs
 */

import type { Place } from "./types";
import { haversineDistance } from "./geo";
import { POI_BASELINES } from "./constants";

const OPENTRIPMAP_BASE_URL = "https://api.opentripmap.com/0.1/en/places";

type OpenTripMapPlace = {
  xid: string;
  name: string;
  point: {
    lon: number;
    lat: number;
  };
  kinds?: string;
  dist?: number;
  osm?: string;
  rate?: string;
  info?: {
    descr?: string;
  };
};

/**
 * Interesting place categories to filter for
 * Optimized for UK locations - includes cities, towns, villages, and common UK attractions
 */
const INTERESTING_KINDS = [
  // Settlements
  "city",
  "town",
  "village",
  "municipality",
  "borough",
  "hamlet",
  // Cultural & Historic (very common in UK)
  "attractions",
  "cultural",
  "historic",
  "architecture",
  "museums",
  "theatres_and_entertainments",
  "castles",
  "palaces",
  "monuments",
  "churches",
  "cathedrals",
  "abbeys",
  // Natural & Outdoor (popular in UK)
  "natural",
  "parks",
  "viewpoints",
  "beaches",
  "coast",
  "lakes",
  "rivers",
  "hills",
  "mountains",
  // Shopping & Markets (UK has many markets)
  "shopping",
  "markets",
  "shops",
  // Pubs & Restaurants (very UK-specific)
  "pubs",
  "restaurants",
  "cafes",
  // Gardens (UK is famous for gardens)
  "gardens",
  "botanical_gardens",
  // Sports & Recreation
  "sports",
  "stadiums",
  "golf",
  "cricket",
  // Transport & Heritage
  "railway_stations",
  "bridges",
  "lighthouses",
  "windmills",
];

/**
 * Result from fetchNearbyPlaces including API source information
 */
export type PlacesResult = {
  places: Place[];
  apiSources: Array<"geoapify" | "nominatim" | "opentripmap" | "fallback">;
  primarySource: "geoapify" | "nominatim" | "opentripmap" | "fallback" | "merged";
  geoapifyCount: number;
  nominatimCount: number;
  opentripmapCount: number;
  fallbackUsed: boolean;
};

/**
 * Enrich a place with nearby POI information from Geoapify
 * Searches for nearby shops, restaurants, museums, parks, etc. within 2-5km
 */
export async function enrichPlaceWithPOIs(
  lat: number,
  lon: number,
  placeName: string,
  apiKey: string
): Promise<{ nearbyPOIs: string[]; poiSummary: string }> {
  if (!apiKey) {
    console.log(`[POI] No API key provided for ${placeName}`);
    return { nearbyPOIs: [], poiSummary: "" };
  }

  const radiusMeters = 3000; // Search within 3km for nearby POIs
  
  // Use broader category groups that Geoapify supports
  // Query multiple category groups to get comprehensive POI data
  const categoryGroups = [
    "commercial",
    "entertainment",
    "catering",
    "natural",
    "tourism",
    "sport",
    "leisure",
  ];

  // Map Geoapify category strings to user-friendly names
  // Geoapify returns categories as strings like "commercial.shopping_mall", "catering.restaurant", etc.
  const categoryMap: Record<string, string> = {
    // Commercial
    "commercial.shopping_mall": "shopping",
    "commercial.supermarket": "shops",
    "commercial.shop": "shops",
    "commercial.marketplace": "markets",
    // Entertainment
    "entertainment.museum": "museums",
    "entertainment.cinema": "cinema",
    "entertainment.theatre": "theatre",
    "entertainment.arts_centre": "arts",
    // Catering
    "catering.restaurant": "restaurants",
    "catering.cafe": "cafes",
    "catering.pub": "pubs",
    "catering.fast_food": "restaurants",
    // Natural
    "natural.nature_reserve": "nature reserves",
    "natural.park": "parks",
    "natural.beach": "beaches",
    "natural.forest": "forests",
    // Tourism
    "tourism.attraction": "attractions",
    "tourism.sights": "sights",
    "tourism.museum": "museums",
    // Sport
    "sport.sport": "sports",
    "sport.stadium": "stadiums",
    // Leisure
    "leisure.park": "parks",
    "leisure.playground": "playgrounds",
    "leisure.golf_course": "golf",
  };

  try {
    const url = new URL("https://api.geoapify.com/v2/places");
    // Query all POI categories at once
    url.searchParams.set("categories", categoryGroups.join(","));
    url.searchParams.set("filter", `circle:${lon},${lat},${radiusMeters}`);
    url.searchParams.set("limit", "50");
    url.searchParams.set("apiKey", apiKey);

    console.log(`[POI] Fetching POIs for ${placeName} at ${lat},${lon}`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[POI] Geoapify POI API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { nearbyPOIs: [], poiSummary: "" };
    }

    const data = await response.json();
    const features = data.features || [];
    console.log(`[POI] Found ${features.length} POI features for ${placeName}`);

    // Collect POI types with counts (volume/strength)
    const poiTypeCounts = new Map<string, number>();
    for (const feature of features) {
      const properties = feature.properties || {};
      
      // Geoapify can return categories in different formats:
      // 1. As an array: ["commercial.shop", "catering.restaurant"]
      // 2. As a comma-separated string: "commercial.shop,catering.restaurant"
      // 3. As a single string: "commercial.shop"
      let categories: string[] = [];
      
      if (properties.categories) {
        if (Array.isArray(properties.categories)) {
          categories = properties.categories;
        } else if (typeof properties.categories === 'string') {
          // Handle comma-separated string
          categories = properties.categories.split(',').map((c: string) => c.trim());
        }
      }
      
      // Also check for category field (alternative property name)
      if (categories.length === 0 && properties.category) {
        if (Array.isArray(properties.category)) {
          categories = properties.category;
        } else if (typeof properties.category === 'string') {
          categories = properties.category.split(',').map((c: string) => c.trim());
        }
      }
      
      // Log first feature for debugging
      if (features.indexOf(feature) === 0) {
        console.log(`[POI] Sample feature for ${placeName}:`, {
          name: properties.name,
          categories: categories,
          allProperties: Object.keys(properties)
        });
      }
      
      // Track which POI types this feature contributes to (to avoid double-counting)
      const featurePoiTypes = new Set<string>();
      
      for (const category of categories) {
        let mappedType: string | null = null;
        
        // Check exact match first
        if (categoryMap[category]) {
          mappedType = categoryMap[category];
        } else {
          // Check if category starts with any of our category groups
          for (const [key, value] of Object.entries(categoryMap)) {
            if (category.startsWith(key.split('.')[0] + '.')) {
              // Use the mapped value if it's a subcategory we recognize
              mappedType = value;
              break;
            }
          }
        }
        
        // Only count each POI type once per feature (a feature can have multiple categories)
        if (mappedType && !featurePoiTypes.has(mappedType)) {
          featurePoiTypes.add(mappedType);
          poiTypeCounts.set(mappedType, (poiTypeCounts.get(mappedType) || 0) + 1);
        }
      }
    }

    // Prioritize POI types that "overindex" (are more notable than baseline average)
    // Calculate overindexing score for each POI type
    // Score = (has POI ? 1 : 0) / baseline_frequency
    // Higher score = more notable/rare POI type
    const poiScores = Array.from(poiTypeCounts.entries()).map(([type, count]) => {
      const baseline = POI_BASELINES[type] || 0.5; // Default to 0.5 if unknown
      // If baseline is 0, avoid division by zero (use count as score)
      const overindexScore = baseline > 0 ? (1 / baseline) : count;
      return { type, count, baseline, overindexScore };
    });

    // Sort by overindexing score (descending) - prioritize rare/notable POI types
    // Then by count (descending) - if same rarity, prefer more abundant
    // Then alphabetically for final tie-breaker
    const nearbyPOIs = poiScores
      .sort((a, b) => {
        // First sort by overindexing score (descending)
        if (Math.abs(b.overindexScore - a.overindexScore) > 0.01) {
          return b.overindexScore - a.overindexScore;
        }
        // Then by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Finally alphabetically
        return a.type.localeCompare(b.type);
      })
      .map(({ type }) => type);
    console.log(`[POI] Mapped POI types for ${placeName}:`, nearbyPOIs);
    
    // Generate a user-friendly summary
    let poiSummary = "";
    if (nearbyPOIs.length === 0) {
      poiSummary = "";
    } else if (nearbyPOIs.length === 1) {
      poiSummary = `${nearbyPOIs[0]}`;
    } else if (nearbyPOIs.length === 2) {
      poiSummary = `${nearbyPOIs[0]} and ${nearbyPOIs[1]}`;
    } else if (nearbyPOIs.length <= 5) {
      const last = nearbyPOIs[nearbyPOIs.length - 1];
      const rest = nearbyPOIs.slice(0, -1);
      poiSummary = `${rest.join(", ")}, and ${last}`;
    } else {
      // Show top 5 most common
      const top5 = nearbyPOIs.slice(0, 5);
      poiSummary = `${top5.join(", ")}, and more`;
    }

    console.log(`[POI] Final summary for ${placeName}: "${poiSummary}"`);
    return { nearbyPOIs, poiSummary };
  } catch (error) {
    console.error(`[POI] Error fetching POIs for ${placeName}:`, error);
    return { nearbyPOIs: [], poiSummary: "" };
  }
}

/**
 * Fetch interesting places within a radius of a location
 * Uses Geoapify as primary source, falls back to Nominatim, OpenTripMap, and hardcoded list
 * Returns both places and API source information for logging
 */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusKm: number = 50,
  apiKey: string
): Promise<Place[]> {
  const result = await fetchNearbyPlacesWithSources(lat, lon, radiusKm, apiKey);
  return result.places;
}

export async function fetchNearbyPlacesWithSources(
  lat: number,
  lon: number,
  radiusKm: number,
  apiKey: string,
  failedApis?: Set<"nominatim" | "opentripmap">
): Promise<PlacesResult> {
  // Track failed APIs to avoid retrying in same request
  const failedApisSet = failedApis || new Set<"nominatim" | "opentripmap">();
  
  const apiSources: Array<"geoapify" | "nominatim" | "opentripmap" | "fallback"> = [];
  let geoapifyPlaces: Place[] = [];
  let nominatimPlaces: Place[] = [];
  let opentripmapPlaces: Place[] = [];
  let fallbackPlaces: Place[] = [];
  let primarySource: "geoapify" | "nominatim" | "opentripmap" | "fallback" | "merged" = "merged";
  
  // Try Geoapify API first (fast, reliable, good UK coverage)
  const geoapifyApiKey = process.env.GEOAPIFY_API_KEY;
  let geoapifySuccess = false;
  try {
    console.log(`[API] Attempting Geoapify API (key: ${geoapifyApiKey ? 'SET' : 'NOT SET'})`);
    geoapifyPlaces = await fetchPlacesFromGeoapify(lat, lon, radiusKm, geoapifyApiKey || '');
    if (geoapifyPlaces.length >= 5) {
      console.log(`[API SUCCESS] Geoapify returned ${geoapifyPlaces.length} places`);
      geoapifySuccess = true;
      apiSources.push("geoapify");
      return {
        places: geoapifyPlaces,
        apiSources: ["geoapify"],
        primarySource: "geoapify",
        geoapifyCount: geoapifyPlaces.length,
        nominatimCount: 0,
        opentripmapCount: 0,
        fallbackUsed: false,
      };
    } else if (geoapifyPlaces.length > 0) {
      console.log(`[API PARTIAL] Geoapify returned ${geoapifyPlaces.length} places (need 5+), supplementing with other sources`);
      geoapifySuccess = true;
      apiSources.push("geoapify");
      // Continue to try other sources and merge
    } else {
      console.log(`[API FAIL] Geoapify returned 0 places`);
    }
  } catch (error) {
    console.log(`[API FAIL] Geoapify error:`, error);
  }

  // Try Nominatim API as fallback (free, reliable, good UK coverage for settlements)
  // Skip if already failed in this request
  let nominatimSuccess = false;
  if (failedApisSet.has("nominatim")) {
    console.log(`[API] Skipping Nominatim - already failed in this request`);
  } else {
    try {
      console.log(`[API] Attempting Nominatim API`);
      const nominatimPromise = fetchPlacesFromNominatim(lat, lon, radiusKm, failedApisSet);
      const timeoutPromise = new Promise<Place[]>((resolve) => 
        setTimeout(() => resolve([]), 8000) // 8 second timeout
      );
      nominatimPlaces = await Promise.race([nominatimPromise, timeoutPromise]);
    
    if (nominatimPlaces.length >= 5 && geoapifyPlaces.length === 0) {
      console.log(`[API SUCCESS] Nominatim returned ${nominatimPlaces.length} places`);
      nominatimSuccess = true;
      apiSources.push("nominatim");
      return {
        places: nominatimPlaces,
        apiSources: ["nominatim"],
        primarySource: "nominatim",
        geoapifyCount: 0,
        nominatimCount: nominatimPlaces.length,
        opentripmapCount: 0,
        fallbackUsed: false,
      };
    } else if (nominatimPlaces.length > 0) {
      console.log(`[API PARTIAL] Nominatim returned ${nominatimPlaces.length} places, will supplement with OpenTripMap/fallback`);
      nominatimSuccess = true;
      apiSources.push("nominatim");
    } else {
      console.log(`[API FAIL] Nominatim returned 0 places (may have timed out)`);
    }
    } catch (error: any) {
      console.log(`[API FAIL] Nominatim error:`, error);
      // Check if it's a 403 error and mark as failed
      if (error?.status === 403 || error?.message?.includes('403') || error?.response?.status === 403) {
        failedApisSet.add("nominatim");
        console.log(`[API] Marking Nominatim as failed (403 Forbidden) - will skip in future calls`);
      }
    }
  }

  // Fallback to OpenTripMap
  // Skip if already failed in this request
  let data: any = null;
  if (failedApisSet.has("opentripmap")) {
    console.log(`[API] Skipping OpenTripMap - already failed in this request`);
    data = null;
  } else if (!apiKey) {
    console.error(`[API FAIL] OpenTripMap: API key not provided`);
    console.error(`[API ERROR DETAILS] Error Type: Missing API Key | Location: ${lat},${lon} | Radius: ${radiusKm}km`);
    data = null;
  } else {
    // Calculate bounding box for the radius
    // Approximate: 1 degree latitude ≈ 111 km
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;

    // Try bbox endpoint first (more reliable than radius)
    const bboxUrl = new URL(`${OPENTRIPMAP_BASE_URL}/bbox`);
    bboxUrl.searchParams.set("lon_min", minLon.toString());
    bboxUrl.searchParams.set("lon_max", maxLon.toString());
    bboxUrl.searchParams.set("lat_min", minLat.toString());
    bboxUrl.searchParams.set("lat_max", maxLat.toString());
    bboxUrl.searchParams.set("apikey", apiKey);
    bboxUrl.searchParams.set("limit", "100");
    // Note: bbox endpoint may not support kinds parameter reliably
    // We'll filter client-side instead to include all settlements

    let response: Response;
    let requestUrl = bboxUrl.toString();
  
    try {
      response = await fetch(requestUrl);
    } catch (fetchError: any) {
      const errorType = fetchError.name || "Unknown";
      const errorMessage = fetchError.message || "No error message";
      const errorCode = fetchError.code || "N/A";
      console.error(`[API FAIL] OpenTripMap: Network/Request Error (bbox endpoint)`);
      console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Error Code: ${errorCode} | Message: ${errorMessage}`);
      console.error(`[API ERROR DETAILS] Request URL: ${requestUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
      console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
      if (errorCode === "ECONNREFUSED") {
        console.error(`[API ERROR DETAILS] Likely Cause: Connection refused - OpenTripMap server may be down`);
      }
      // Fall through to try radius endpoint
      data = null;
      response = { ok: false, status: 0 } as Response;
    }

    if (response.ok) {
      try {
        const responseText = await response.text();
        // Try to parse JSON
        try {
          data = JSON.parse(responseText);
          // Check if response contains an error even with 200 status
          if (data && typeof data === 'object' && data.error) {
            console.error(`[API FAIL] OpenTripMap: Error in response body (bbox endpoint, status 200)`);
            console.error(`[API ERROR DETAILS] Error: ${data.error} | Message: ${data.message || "No message"}`);
          }
        } catch (parseError: any) {
          console.error(`[API FAIL] OpenTripMap: JSON Parse Error (bbox endpoint)`);
          console.error(`[API ERROR DETAILS] Error Type: ${parseError.name || "JSONParseError"} | Message: ${parseError.message || "Invalid JSON"}`);
          console.error(`[API ERROR DETAILS] Response Text (first 500 chars): ${responseText.substring(0, 500)}`);
          data = null;
        }
      } catch (readError: any) {
        console.error(`[API FAIL] OpenTripMap: Error reading response (bbox endpoint)`);
        console.error(`[API ERROR DETAILS] Error Type: ${readError.name || "ReadError"} | Message: ${readError.message || "Could not read response"}`);
        data = null;
      }
    } else {
      // Fallback to radius endpoint
      console.log(`[API] OpenTripMap bbox endpoint failed (${response.status}), trying radius endpoint`);
      const radiusUrl = new URL(`${OPENTRIPMAP_BASE_URL}/radius`);
      radiusUrl.searchParams.set("radius", (radiusKm * 1000).toString());
      radiusUrl.searchParams.set("lon", lon.toString());
      radiusUrl.searchParams.set("lat", lat.toString());
      radiusUrl.searchParams.set("apikey", apiKey);
      radiusUrl.searchParams.set("limit", "100");
      // Don't filter by kinds in API - get all places and filter client-side
      // This ensures we get small villages that might not have attraction tags
      
      requestUrl = radiusUrl.toString();
      try {
        response = await fetch(requestUrl);
      } catch (fetchError: any) {
        const errorType = fetchError.name || "Unknown";
        const errorMessage = fetchError.message || "No error message";
        const errorCode = fetchError.code || "N/A";
        console.error(`[API FAIL] OpenTripMap: Network/Request Error (radius endpoint)`);
        console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Error Code: ${errorCode} | Message: ${errorMessage}`);
        console.error(`[API ERROR DETAILS] Request URL: ${requestUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
        console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
        data = {};
      }
      
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch {
          errorText = "Could not read error response";
        }
        console.error(`[API FAIL] OpenTripMap: HTTP Error ${response.status} ${response.statusText} (radius endpoint)`);
        console.error(`[API ERROR DETAILS] Status Code: ${response.status} | Status Text: ${response.statusText}`);
        console.error(`[API ERROR DETAILS] Response: ${errorText.substring(0, 500)}`);
        console.error(`[API ERROR DETAILS] Request URL: ${requestUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
        console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
        if (response.status === 401) {
          console.error(`[API ERROR DETAILS] Likely Cause: Invalid or missing API key. Check OPENTRIPMAP_API_KEY in .env`);
        } else if (response.status === 429) {
          console.error(`[API ERROR DETAILS] Likely Cause: Rate limit exceeded`);
        } else if (response.status === 400) {
          console.error(`[API ERROR DETAILS] Likely Cause: Invalid request parameters`);
        }
        // Don't throw - fall through to use Nominatim or fallback
        data = {};
      } else {
        try {
          const responseText = await response.text();
          // Try to parse JSON
          try {
            data = JSON.parse(responseText);
            // Check if response contains an error even with 200 status
            if (data && typeof data === 'object' && data.error) {
              console.error(`[API FAIL] OpenTripMap: Error in response body (radius endpoint, status 200)`);
              console.error(`[API ERROR DETAILS] Error: ${data.error} | Message: ${data.message || "No message"}`);
            }
          } catch (parseError: any) {
            console.error(`[API FAIL] OpenTripMap: JSON Parse Error (radius endpoint)`);
            console.error(`[API ERROR DETAILS] Error Type: ${parseError.name || "JSONParseError"} | Message: ${parseError.message || "Invalid JSON"}`);
            console.error(`[API ERROR DETAILS] Response Text (first 500 chars): ${responseText.substring(0, 500)}`);
            data = {};
          }
        } catch (readError: any) {
          console.error(`[API FAIL] OpenTripMap: Error reading response (radius endpoint)`);
          console.error(`[API ERROR DETAILS] Error Type: ${readError.name || "ReadError"} | Message: ${readError.message || "Could not read response"}`);
          data = {};
        }
      }
    }
  } // End of else block for OpenTripMap API key check

  // Check for error responses from OpenTripMap (process data if we have it)
  if (data && typeof data === 'object' && data.error) {
    const errorMsg = data.error === "null" ? "null error" : data.error;
    const errorMessage = data.message || data.error_message || "";
    console.error(`[API FAIL] OpenTripMap: API Error Response`);
    console.error(`[API ERROR DETAILS] Error: ${errorMsg} | Message: ${errorMessage || "No message"}`);
    console.error(`[API ERROR DETAILS] Full Response: ${JSON.stringify(data).substring(0, 500)}`);
    if (errorMsg === "null" || errorMsg === null) {
      console.error(`[API ERROR DETAILS] Likely Cause: Invalid API key or request parameters. Check OPENTRIPMAP_API_KEY in .env`);
    }
    // Mark as failed and skip in future calls
    failedApisSet.add("opentripmap");
    console.log(`[API] Marking OpenTripMap as failed - will skip in future calls`);
    // Don't return here - let it fall through to check if we have other sources
    data = null;
  }

  // OpenTripMap returns GeoJSON format with features array
  // But it might also return a different format, so let's handle both
  let features: Array<{ properties: OpenTripMapPlace }> = [];
  
  if (data && data.features && Array.isArray(data.features)) {
    features = data.features;
  } else if (data && Array.isArray(data)) {
    // Sometimes it might return an array directly
    features = data.map((item: any) => ({ properties: item }));
  } else if (data && data.type === "FeatureCollection" && data.features) {
    features = data.features;
  } else if (data && typeof data === 'object' && Object.keys(data).length === 0) {
    // Empty object response - API might not have results or endpoint doesn't work
    console.log(`[API FAIL] OpenTripMap returned empty object`);
    // Don't return here - let it fall through to check if we have other sources
  } else if (!data) {
    // Data is null/undefined - already logged error above
  }
  
  if (features.length === 0) {
    if (data) {
      console.log(`[API FAIL] OpenTripMap returned no features:`, JSON.stringify(data).substring(0, 200));
    } else {
      console.log(`[API FAIL] OpenTripMap returned no features (data is null/undefined)`);
    }
    // Don't return here - let it fall through to check if we have other sources
  } else {
    console.log(`[API SUCCESS] OpenTripMap returned ${features.length} features`);
  }

  // Filter and normalize places
  const places: Place[] = [];

  for (const feature of features) {
    const place = feature.properties;
    if (!place.name || !place.point) continue;

    // Filter for interesting kinds
    const kinds = place.kinds?.split(",") || [];
    const hasInterestingKind = kinds.some((kind) =>
      INTERESTING_KINDS.some((interesting) => kind.includes(interesting))
    );

    // Prioritize cities, towns, villages - these are what we want most
    // Check if it's a settlement by kinds or by name pattern
    const isSettlement =
      kinds.some((k) => 
        k.includes("city") || 
        k.includes("town") || 
        k.includes("village") || 
        k.includes("municipality") ||
        k.includes("borough") ||
        k.includes("hamlet")
      ) ||
      place.name.match(/\b(city|town|village|borough|hamlet)\b/i);

    // Include ALL settlements (cities, towns, villages) - these are our primary targets
    // Also include interesting attractions for variety
    // Prioritize settlements - they're more useful for "escape" destinations
    if (isSettlement || hasInterestingKind) {
      places.push({
        id: place.xid,
        name: place.name,
        lat: place.point.lat,
        lon: place.point.lon,
        distanceKm: (place.dist || 0) / 1000, // Convert meters to km
        kinds: kinds,
        description: place.info?.descr || null,
      });
    }
  }

  // Sort by distance
  places.sort((a, b) => a.distanceKm - b.distanceKm);

  opentripmapPlaces = places;

  // If filtering resulted in no places, use fallback
  if (places.length === 0) {
    console.log(`[API FAIL] OpenTripMap filtering resulted in 0 places`);
    if (!geoapifySuccess && !nominatimSuccess) {
      console.log(`[FALLBACK] All APIs failed, using hardcoded list`);
      fallbackPlaces = generateFallbackPlaces(lat, lon, radiusKm);
      apiSources.push("fallback");
      primarySource = "fallback";
      return {
        places: fallbackPlaces,
        apiSources: ["fallback"],
        primarySource: "fallback",
        geoapifyCount: 0,
        nominatimCount: 0,
        opentripmapCount: 0,
        fallbackUsed: true,
      };
    }
  } else {
    console.log(`[API SUCCESS] OpenTripMap filtering resulted in ${places.length} places`);
    if (!apiSources.includes("opentripmap")) {
      apiSources.push("opentripmap");
    }
  }

  // Merge with Geoapify and Nominatim results if we have any
  const allPlaces = [...opentripmapPlaces];
  if (geoapifyPlaces.length > 0) {
    allPlaces.push(...geoapifyPlaces);
  }
  if (nominatimPlaces.length > 0) {
    allPlaces.push(...nominatimPlaces);
  }

  if (allPlaces.length > opentripmapPlaces.length) {
    console.log(`[MERGE] Combining results: OpenTripMap(${opentripmapPlaces.length}) + Geoapify(${geoapifyPlaces.length}) + Nominatim(${nominatimPlaces.length}) = ${allPlaces.length} total`);
    // Remove duplicates by name (keep closest)
    const uniquePlaces = new Map<string, Place>();
    for (const place of allPlaces) {
      const nameKey = place.name.toLowerCase().trim();
      if (!uniquePlaces.has(nameKey) || uniquePlaces.get(nameKey)!.distanceKm > place.distanceKm) {
        uniquePlaces.set(nameKey, place);
      }
    }
    const merged = Array.from(uniquePlaces.values()).sort((a, b) => a.distanceKm - b.distanceKm);
    console.log(`[MERGE] After deduplication: ${merged.length} unique places`);
    
    // Determine primary source
    if (geoapifyPlaces.length >= nominatimPlaces.length && geoapifyPlaces.length >= opentripmapPlaces.length) {
      primarySource = "geoapify";
    } else if (nominatimPlaces.length >= opentripmapPlaces.length) {
      primarySource = "nominatim";
    } else {
      primarySource = "opentripmap";
    }
    
    return {
      places: merged,
      apiSources: apiSources.length > 0 ? apiSources : ["opentripmap"],
      primarySource: apiSources.length > 1 ? "merged" : primarySource,
      geoapifyCount: geoapifyPlaces.length,
      nominatimCount: nominatimPlaces.length,
      opentripmapCount: opentripmapPlaces.length,
      fallbackUsed: false,
    };
  }

  // Single source result
  if (opentripmapPlaces.length > 0) {
    primarySource = "opentripmap";
  }
  
  return {
    places: opentripmapPlaces,
    apiSources: apiSources.length > 0 ? apiSources : ["opentripmap"],
    primarySource,
    geoapifyCount: geoapifyPlaces.length,
    nominatimCount: nominatimPlaces.length,
    opentripmapCount: opentripmapPlaces.length,
    fallbackUsed: false,
  };
}

/**
 * Fetch places using OpenStreetMap Nominatim API
 * Uses search and reverse geocoding to find settlements dynamically
 */
async function fetchPlacesFromNominatim(
  lat: number,
  lon: number,
  radiusKm: number,
  failedApis?: Set<"nominatim" | "opentripmap">
): Promise<Place[]> {
  const places: Place[] = [];
  const seenIds = new Set<string>();
  
  // Skip if already marked as failed
  if (failedApis?.has("nominatim")) {
    console.log(`[API] Skipping Nominatim - already failed`);
    return [];
  }
  
  // Calculate bounding box
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const bbox = `${(lon - lonDelta)},${(lat - latDelta)},${(lon + lonDelta)},${(lat + latDelta)}`;
  
  // Strategy 1: Search for settlements by type in bounding box
  // Use a combined search to reduce API calls
  const settlementTypes = ["town", "village"]; // Focus on most common types first
  
  for (const settlementType of settlementTypes) {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", settlementType);
      url.searchParams.set("bounded", "1");
      url.searchParams.set("viewbox", bbox);
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "50");
      url.searchParams.set("countrycodes", "gb");
      url.searchParams.set("dedupe", "1"); // Deduplicate results
      
      const requestUrl = url.toString();
      let response: Response;
      
      try {
        response = await fetch(requestUrl, {
          headers: {
            "User-Agent": "RainEscapeApp/1.0 (contact@example.com)",
          },
        });
      } catch (fetchError: any) {
        const errorType = fetchError.name || "Unknown";
        const errorMessage = fetchError.message || "No error message";
        const errorCode = fetchError.code || "N/A";
        console.error(`[API FAIL] Nominatim: Network/Request Error (search for ${settlementType})`);
        console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Error Code: ${errorCode} | Message: ${errorMessage}`);
        console.error(`[API ERROR DETAILS] Request URL: ${requestUrl}`);
        console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km | Settlement Type: ${settlementType}`);
        if (fetchError.stack) {
          console.error(`[API ERROR DETAILS] Stack (first 500 chars): ${fetchError.stack.substring(0, 500)}`);
        }
        if (errorCode === "ECONNREFUSED") {
          console.error(`[API ERROR DETAILS] Likely Cause: Connection refused - Nominatim server may be down or unreachable`);
        } else if (errorCode === "ETIMEDOUT") {
          console.error(`[API ERROR DETAILS] Likely Cause: Request timeout - Nominatim server is slow or overloaded`);
        }
        continue;
      }
      
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch {
          errorText = "Could not read error response";
        }
        console.error(`[API FAIL] Nominatim: HTTP Error ${response.status} ${response.statusText} (search for ${settlementType})`);
        console.error(`[API ERROR DETAILS] Status Code: ${response.status} | Status Text: ${response.statusText}`);
        console.error(`[API ERROR DETAILS] Response: ${errorText.substring(0, 500)}`);
        console.error(`[API ERROR DETAILS] Request URL: ${requestUrl}`);
        console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
        if (response.status === 429) {
          console.error(`[API ERROR DETAILS] Likely Cause: Rate limit exceeded. Nominatim requires 1 request per second.`);
        } else if (response.status === 403) {
          console.error(`[API ERROR DETAILS] Likely Cause: Forbidden - User-Agent may be blocked or invalid`);
          // Mark as failed and return early - no point trying more calls
          if (failedApis) {
            failedApis.add("nominatim");
            console.log(`[API] Marking Nominatim as failed (403 Forbidden) - will skip in future calls`);
          }
          return [];
        }
        continue;
      }
      
      const results = await response.json();
      
      if (Array.isArray(results)) {
        for (const result of results) {
          if (!result.lat || !result.lon) continue;
          
          const placeLat = parseFloat(result.lat);
          const placeLon = parseFloat(result.lon);
          const distance = haversineDistance(lat, lon, placeLat, placeLon);
          
          if (distance > radiusKm || distance <= 1) continue;
          
          // Extract name from address or display_name
          const name = 
            result.address?.town ||
            result.address?.village ||
            result.address?.city ||
            result.address?.hamlet ||
            result.address?.municipality ||
            result.name ||
            result.display_name?.split(",")[0]?.trim();
          
          if (!name) continue;
          
          const nameLower = name.toLowerCase();
          // Filter out administrative areas - be more strict
          const isAdministrativeArea = 
            nameLower.includes("greater") ||
            nameLower.includes("county") ||
            nameLower.includes("council") ||
            nameLower.includes("region") ||
            nameLower.includes("administrative") ||
            nameLower.includes("local authority") ||
            // Exclude districts unless they're known towns
            (nameLower.includes("district") && !nameLower.match(/\b(town|city|village|hamlet)\b/i)) ||
            // Exclude boroughs unless they're known towns
            (nameLower.includes("borough") && !nameLower.match(/\b(town|city|village|hamlet)\b/i)) ||
            // Exclude directional prefixes unless it's a known settlement
            (/^(east|west|north|south)\s+(.*)$/i.test(name) && !nameLower.match(/\b(town|city|village|hamlet)\b/i));
          
          if (isAdministrativeArea) {
            continue;
          }
          
          // Only accept if it's actually a settlement type (town, village, city, hamlet)
          // Check the result type/class from Nominatim
          const resultType = result.type?.toLowerCase() || "";
          const resultClass = result.class?.toLowerCase() || "";
          const isSettlement = 
            resultType.includes("town") ||
            resultType.includes("village") ||
            resultType.includes("city") ||
            resultType.includes("hamlet") ||
            resultType.includes("suburb") ||
            resultClass.includes("place");
          
          // If it's not a settlement type, skip it
          if (!isSettlement) {
            continue;
          }
          
          const id = `nominatim-${name.toLowerCase().replace(/\s+/g, '-')}-${placeLat.toFixed(3)}-${placeLon.toFixed(3)}`;
          
          if (!seenIds.has(id)) {
            seenIds.add(id);
            places.push({
              id,
              name: name.trim(),
              lat: placeLat,
              lon: placeLon,
              distanceKm: distance,
              kinds: [settlementType],
              description: null,
            });
          }
        }
      }
      
      // Rate limiting - Nominatim requires 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1100));
    } catch (error: any) {
      const errorType = error?.name || "UnknownError";
      const errorMessage = error?.message || "No error message";
      const errorStack = error?.stack || "No stack trace";
      
      console.error(`[API FAIL] Nominatim: Unexpected Exception (search for ${settlementType})`);
      console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Message: ${errorMessage}`);
      console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
      console.error(`[API ERROR DETAILS] Stack (first 500 chars): ${errorStack.substring(0, 500)}`);
      continue;
    }
  }
  
  // Strategy 2: Reverse geocode grid points to find additional settlements
  // Only do this if we have few results from search (to save time)
  if (places.length < 15) {
    const gridSize = Math.min(Math.ceil(radiusKm / 20), 3); // Smaller grid, max 3x3
    const gridPoints: Array<{ lat: number; lon: number }> = [];
    
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (i === 0 && j === 0) continue; // Skip center
        const gridLat = lat + (i * radiusKm / (gridSize * 111));
        const gridLon = lon + (j * radiusKm / (gridSize * 111 * Math.cos((lat * Math.PI) / 180)));
        const distance = haversineDistance(lat, lon, gridLat, gridLon);
        if (distance <= radiusKm) {
          gridPoints.push({ lat: gridLat, lon: gridLon });
        }
      }
    }
    
    // Limit grid points to avoid too many requests (max 10)
    // Skip reverse geocoding if Nominatim already failed
    if (failedApis?.has("nominatim")) {
      console.log(`[API] Skipping Nominatim reverse geocoding - already failed`);
      return places;
    }
    
    const pointsToCheck = gridPoints.slice(0, 5); // Reduced from 10 to 5 for performance
  
  for (const point of pointsToCheck) {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("lat", point.lat.toString());
      url.searchParams.set("lon", point.lon.toString());
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("zoom", "14"); // Town/city level
      
      const requestUrl = url.toString();
      let response: Response;
      
      try {
        response = await fetch(requestUrl, {
          headers: {
            "User-Agent": "RainEscapeApp/1.0 (contact@example.com)",
          },
        });
      } catch (fetchError: any) {
        const errorType = fetchError.name || "Unknown";
        const errorMessage = fetchError.message || "No error message";
        const errorCode = fetchError.code || "N/A";
        console.error(`[API FAIL] Nominatim: Network/Request Error (reverse geocode for ${point.lat},${point.lon})`);
        console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Error Code: ${errorCode} | Message: ${errorMessage}`);
        console.error(`[API ERROR DETAILS] Request URL: ${requestUrl}`);
        if (errorCode === "ECONNREFUSED") {
          console.error(`[API ERROR DETAILS] Likely Cause: Connection refused - Nominatim server may be down or unreachable`);
        } else if (errorCode === "ETIMEDOUT") {
          console.error(`[API ERROR DETAILS] Likely Cause: Request timeout - Nominatim server is slow or overloaded`);
        }
        continue;
      }
      
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch {
          errorText = "Could not read error response";
        }
        console.error(`[API FAIL] Nominatim: HTTP Error ${response.status} ${response.statusText} (reverse geocode for ${point.lat},${point.lon})`);
        console.error(`[API ERROR DETAILS] Status Code: ${response.status} | Status Text: ${response.statusText}`);
        console.error(`[API ERROR DETAILS] Response: ${errorText.substring(0, 200)}`);
        if (response.status === 429) {
          console.error(`[API ERROR DETAILS] Likely Cause: Rate limit exceeded. Nominatim requires 1 request per second.`);
        } else if (response.status === 403) {
          console.error(`[API ERROR DETAILS] Likely Cause: Forbidden - User-Agent may be blocked or invalid`);
          // Mark as failed and break out of loop
          if (failedApis) {
            failedApis.add("nominatim");
            console.log(`[API] Marking Nominatim as failed (403 Forbidden) - will skip in future calls`);
          }
          break; // Exit the reverse geocoding loop
        }
        continue;
      }
      
      const result = await response.json();
      
      if (result && result.address) {
        const name = 
          result.address.city ||
          result.address.town ||
          result.address.village ||
          result.address.hamlet ||
          result.address.municipality ||
          result.display_name?.split(",")[0];
        
        if (name && result.lat && result.lon) {
          const placeLat = parseFloat(result.lat);
          const placeLon = parseFloat(result.lon);
          const distance = haversineDistance(lat, lon, placeLat, placeLon);
          
          if (distance > radiusKm || distance <= 1) continue;
          
          // Filter out administrative areas
          const nameLower = name.toLowerCase();
          const isAdministrativeArea = 
            nameLower.includes("county") ||
            nameLower.includes("district") ||
            nameLower.includes("council") ||
            nameLower.includes("region") ||
            nameLower.includes("administrative") ||
            (nameLower.includes("borough") && !nameLower.match(/\b(town|city|village|hamlet)\b/i));
          
          if (isAdministrativeArea) {
            continue;
          }
          
          // Only accept if it's actually a settlement
          const resultType = result.type?.toLowerCase() || "";
          const resultClass = result.class?.toLowerCase() || "";
          const isSettlement = 
            resultType.includes("town") ||
            resultType.includes("village") ||
            resultType.includes("city") ||
            resultType.includes("hamlet") ||
            resultType.includes("suburb") ||
            resultClass.includes("place");
          
          if (!isSettlement) {
            continue;
          }
          
          // Additional name-based filtering (nameLower already defined above at line 767)
          if (
            nameLower.includes("greater") ||
            nameLower.includes("county") ||
            nameLower === "london" && distance < 5
          ) {
            continue;
          }
          
          const id = `nominatim-${name.toLowerCase().replace(/\s+/g, '-')}-${placeLat.toFixed(3)}-${placeLon.toFixed(3)}`;
          
          if (!seenIds.has(id)) {
            seenIds.add(id);
            places.push({
              id,
              name: name.trim(),
              lat: placeLat,
              lon: placeLon,
              distanceKm: distance,
              kinds: ["settlement"],
              description: null,
            });
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1100));
    } catch (error: any) {
      const errorType = error?.name || "UnknownError";
      const errorMessage = error?.message || "No error message";
      console.error(`[API FAIL] Nominatim: Unexpected Exception (reverse geocode for ${point.lat},${point.lon})`);
      console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Message: ${errorMessage}`);
      continue;
    }
  }
  } // End of grid points check
  
  // Remove duplicates by name (keep closest)
  const uniquePlaces = new Map<string, Place>();
  for (const place of places) {
    const nameKey = place.name.toLowerCase().trim();
    if (!uniquePlaces.has(nameKey) || uniquePlaces.get(nameKey)!.distanceKm > place.distanceKm) {
      uniquePlaces.set(nameKey, place);
    }
  }
  
  return Array.from(uniquePlaces.values()).sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Fetch places using Geoapify Places API
 * Fast, reliable API for finding settlements (cities, towns, villages)
 */
async function fetchPlacesFromGeoapify(
  lat: number,
  lon: number,
  radiusKm: number,
  apiKey: string
): Promise<Place[]> {
  if (!apiKey) {
    console.error(`[API FAIL] Geoapify: API key not provided`);
    console.error(`[API ERROR DETAILS] Error Type: Missing API Key | Location: ${lat},${lon} | Radius: ${radiusKm}km`);
    return [];
  }

  const places: Place[] = [];
  const radiusMeters = radiusKm * 1000;

  try {
    const url = new URL("https://api.geoapify.com/v2/places");
    // Combine 'populated_place' and 'administrative' categories for comprehensive coverage
    // populated_place gets settlements (cities, towns, villages, hamlets)
    // administrative gets boroughs/districts that may also be legitimate destinations
    // Geoapify supports populated_place.city, populated_place.town, populated_place.village, populated_place.hamlet
    // We'll filter client-side to exclude counties and high-level administrative areas
    url.searchParams.set("categories", "populated_place,administrative");
    url.searchParams.set("filter", `circle:${lon},${lat},${radiusMeters}`);
    url.searchParams.set("limit", "50");
    url.searchParams.set("apiKey", apiKey);

    const requestUrl = url.toString();
    const sanitizedUrl = requestUrl.replace(apiKey, 'API_KEY_HIDDEN');
    console.log(`[API] Geoapify request: ${sanitizedUrl}`);
    
    let response: Response;
    let responseText: string = "";
    let responseData: any = null;
    
    try {
      response = await fetch(requestUrl);
      responseText = await response.text();
    } catch (fetchError: any) {
      const errorType = fetchError.name || "Unknown";
      const errorMessage = fetchError.message || "No error message";
      const errorCode = fetchError.code || "N/A";
      console.error(`[API FAIL] Geoapify: Network/Request Error`);
      console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Error Code: ${errorCode} | Message: ${errorMessage}`);
      console.error(`[API ERROR DETAILS] Request URL: ${sanitizedUrl}`);
      console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
      if (fetchError.stack) {
        console.error(`[API ERROR DETAILS] Stack: ${fetchError.stack.substring(0, 500)}`);
      }
      return [];
    }

    if (!response.ok) {
      let errorDetails = "";
      try {
        responseData = JSON.parse(responseText);
        errorDetails = JSON.stringify(responseData).substring(0, 500);
      } catch {
        errorDetails = responseText.substring(0, 500);
      }
      
      console.error(`[API FAIL] Geoapify: HTTP Error ${response.status} ${response.statusText}`);
      console.error(`[API ERROR DETAILS] Status Code: ${response.status} | Status Text: ${response.statusText}`);
      console.error(`[API ERROR DETAILS] Response: ${errorDetails}`);
      console.error(`[API ERROR DETAILS] Request URL: ${sanitizedUrl}`);
      console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
      
      // Provide specific guidance based on status code
      if (response.status === 401) {
        console.error(`[API ERROR DETAILS] Likely Cause: Invalid or missing API key. Check GEOAPIFY_API_KEY in .env`);
      } else if (response.status === 429) {
        console.error(`[API ERROR DETAILS] Likely Cause: Rate limit exceeded. Too many requests.`);
      } else if (response.status === 400) {
        console.error(`[API ERROR DETAILS] Likely Cause: Invalid request parameters (categories, filter, etc.)`);
      } else if (response.status >= 500) {
        console.error(`[API ERROR DETAILS] Likely Cause: Geoapify server error. Try again later.`);
      }
      
      return [];
    }

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error(`[API FAIL] Geoapify: JSON Parse Error`);
      console.error(`[API ERROR DETAILS] Error Type: ${parseError.name || "JSONParseError"} | Message: ${parseError.message || "Invalid JSON response"}`);
      console.error(`[API ERROR DETAILS] Response Text (first 500 chars): ${responseText.substring(0, 500)}`);
      console.error(`[API ERROR DETAILS] Status Code: ${response.status}`);
      return [];
    }

    const data = responseData;
    console.log(`[API] Geoapify response: ${data.features?.length || 0} features`);
    
    // Log first few features for debugging
    if (data.features && data.features.length > 0) {
      console.log(`[API] Sample Geoapify feature:`, JSON.stringify(data.features[0].properties, null, 2).substring(0, 500));
    }

    // Initialize counters before the if block so they're always defined
    let filteredCount = 0;
    let administrativeFiltered = 0;
    let settlementFiltered = 0;
    let nameFiltered = 0;
    let noCoordinatesCount = 0;
    let noNameCount = 0;
    let duplicateCount = 0;
    
    // Track filtered places for detailed logging
    const filteredByDistance: Array<{name: string, distance: number, reason: string}> = [];
    const filteredByType: Array<{name: string, reason: string}> = [];
    const passedPlaces: Array<{name: string, distance: number, hasSettlement: boolean}> = [];

    // Geoapify returns GeoJSON format with features array
    if (data.features && Array.isArray(data.features)) {
      console.log(`[FILTER] Processing ${data.features.length} features from Geoapify (radius: ${radiusKm}km)`);
      
      for (const feature of data.features) {
        const properties = feature.properties;
        const geometry = feature.geometry;

        if (!geometry?.coordinates) {
          noCoordinatesCount++;
          continue;
        }

        // Geoapify coordinates are [lon, lat]
        const [placeLon, placeLat] = geometry.coordinates;
        const distance = haversineDistance(lat, lon, placeLat, placeLon);

        // Extract name early for logging
        const name = 
          properties.city ||
          properties.town ||
          properties.village ||
          properties.hamlet ||
          properties.name ||
          properties.formatted?.split(",")[0]?.trim() ||
          "UNNAMED";

        // Filter out places within 1km of user location
        if (distance <= 1) {
          filteredCount++;
          filteredByDistance.push({name, distance, reason: `too close (${distance.toFixed(2)}km <= 1km)`});
          continue;
        }
        
        // For 50km+ searches, allow places slightly beyond radius (up to 10% over) to account for Geoapify's approximation
        // This ensures we don't miss places that are just outside the exact radius
        // For smaller searches (10km, 25km), use exact radius to maintain precision
        const maxAllowedDistance = radiusKm >= 50 ? radiusKm * 1.1 : radiusKm;
        
        if (distance > maxAllowedDistance) {
          filteredCount++;
          filteredByDistance.push({name, distance, reason: `beyond radius (${distance.toFixed(2)}km > ${maxAllowedDistance.toFixed(1)}km)`});
          continue;
        }

        // Check if name was extracted
        if (!name || name === "UNNAMED") {
          noNameCount++;
          continue;
        }

        // Check if this is actually a settlement by looking at the properties
        // Geoapify returns city, town, village, hamlet properties for settlements
        const hasSettlementProperty = !!(properties.city || properties.town || properties.village || properties.hamlet);
        
        // Extract categories
        const categories = properties.categories || [];
        const kinds = Array.isArray(categories) ? categories : [categories];
        
        // Filter out administrative areas that aren't actual settlements
        const nameLower = name.toLowerCase();
        
        // Known UK county names to exclude (these are administrative areas, not settlements)
        const ukCounties = [
          "essex", "kent", "suffolk", "norfolk", "lincolnshire", "yorkshire",
          "lancashire", "cheshire", "derbyshire", "nottinghamshire", "leicestershire",
          "warwickshire", "worcestershire", "gloucestershire", "oxfordshire",
          "buckinghamshire", "berkshire", "hampshire", "wiltshire", "dorset",
          "somerset", "devon", "cornwall", "cumbria", "northumberland", "durham",
          "north yorkshire", "south yorkshire", "west yorkshire", "east yorkshire",
          "east sussex", "west sussex", "surrey", "hertfordshire", "bedfordshire",
          "cambridgeshire", "northamptonshire", "rutland", "staffordshire",
          "shropshire", "herefordshire", "gwynedd", "powys", "carmarthenshire",
          "pembrokeshire", "ceredigion", "anglesey", "conwy", "denbighshire",
          "flintshire", "wrexham", "monmouthshire", "caerphilly", "blaenau gwent",
          "torfaen", "newport", "cardiff", "vale of glamorgan", "rhondda cynon taf",
          "merthyr tydfil", "bridgend", "neath port talbot", "swansea", "carmarthenshire",
          "ceredigion", "pembrokeshire", "anglesey", "gwynedd", "conwy", "denbighshire",
          "flintshire", "wrexham", "aberdeenshire", "angus", "argyll and bute",
          "ayrshire", "banffshire", "berwickshire", "bute", "caithness", "clackmannanshire",
          "dumfriesshire", "dunbartonshire", "east lothian", "fife", "inverness-shire",
          "kincardineshire", "kinross-shire", "kirkcudbrightshire", "lanarkshire",
          "midlothian", "moray", "nairnshire", "orkney", "peeblesshire", "perthshire",
          "renfrewshire", "ross-shire", "roxburghshire", "selkirkshire", "shetland",
          "stirlingshire", "sutherland", "west lothian", "wigtownshire"
        ];
        
        // Known UK administrative districts to exclude (these are local government districts, not settlements)
        // These are district councils that often appear in Geoapify results
        const ukAdministrativeDistricts = [
          "gedling", "rushcliffe", "erewash", "broxtowe", "ashfield", "newark and sherwood",
          "bassettlaw", "mansfield", "south derbyshire", "north west leicestershire",
          "charnwood", "harborough", "oadby and wigston", "blaby", "hinckley and bosworth",
          "north kesteven", "south kesteven", "boston", "east lindsey", "lincoln",
          "west lindsey", "south holland", "south kesteven", "rutland", "melton",
          "cast point", "rochford", "tendring", "colchester", "braintree", "maldon",
          "chelmsford", "uttlesford", "epping forest", "harlow", "east hertfordshire",
          "three rivers", "watford", "hertsmere", "welwyn hatfield", "broxbourne",
          "east cambridgeshire", "south cambridgeshire", "huntingdonshire", "fenland",
          "peterborough", "north norfolk", "south norfolk", "broadland", "great yarmouth",
          "norwich", "breckland", "kings lynn and west norfolk", "north west norfolk",
          "south west norfolk", "babergh", "mid suffolk", "east suffolk", "west suffolk",
          "ipswich", "suffolk coastal", "waveney", "forest heath", "st edmundsbury",
          "northampton", "south northamptonshire", "daventry", "wellingborough", "kettering",
          "corby", "east northamptonshire", "wellingborough", "borough of wokingham",
          "west berkshire", "reading", "slough", "windsor and maidenhead", "bracknell forest",
          "south bucks", "aylesbury vale", "chiltern", "south bucks", "wycombe",
          "milton keynes", "cherwell", "south oxfordshire", "vale of white horse",
          "west oxfordshire", "oxford", "cotswold", "forest of dean", "tewkesbury",
          "cheltenham", "gloucester", "stroud", "south gloucestershire", "bath and north east somerset",
          "north somerset", "mendip", "sedgemoor", "taunton deane", "west somerset",
          "south somerset", "east devon", "exeter", "mid devon", "north devon",
          "south hams", "teignbridge", "torridge", "west devon", "plymouth", "torbay",
          "east dorset", "north dorset", "purbeck", "west dorset", "weymouth and portland",
          "christchurch", "bournemouth", "poole", "eastleigh", "fareham", "gosport",
          "rushmoor", "havant", "winchester", "test valley", "east hampshire", "hart",
          "basingstoke and deane", "rushmoor", "southampton", "portsmouth", "isle of wight",
          "adur", "arun", "chichester", "crawley", "horsham", "mid sussex", "worthing",
          "brighton and hove", "eastbourne", "hastings", "lewes", "rother", "wealden",
          "canterbury", "dartford", "dover", "gravesham", "maidstone", "medway",
          "sevenoaks", "shepway", "swale", "thanet", "tonbridge and malling", "tunbridge wells",
          "elmbridge", "epsom and ewell", "guildford", "mole valley", "reigate and banstead",
          "runnymede", "spelthorne", "surrey heath", "tandridge", "waverley", "woking",
          "bracknell forest", "slough", "windsor and maidenhead", "wokingham", "west berkshire",
          "reading", "basingstoke and deane", "east hampshire", "hart", "rushmoor",
          "test valley", "winchester", "havant", "gosport", "fareham", "eastleigh",
          "new forest", "southampton", "portsmouth", "isle of wight", "adur", "arun",
          "chichester", "crawley", "horsham", "mid sussex", "worthing", "brighton and hove",
          "eastbourne", "hastings", "lewes", "rother", "wealden", "canterbury", "dartford",
          "dover", "gravesham", "maidstone", "medway", "sevenoaks", "shepway", "swale",
          "thanet", "tonbridge and malling", "tunbridge wells", "elmbridge", "epsom and ewell",
          "guildford", "mole valley", "reigate and banstead", "runnymede", "spelthorne",
          "surrey heath", "tandridge", "waverley", "woking", "bracknell forest", "slough",
          "windsor and maidenhead", "wokingham", "west berkshire", "reading", "basingstoke and deane",
          "east hampshire", "hart", "rushmoor", "test valley", "winchester", "havant",
          "gosport", "fareham", "eastleigh", "new forest", "southampton", "portsmouth",
          "isle of wight", "adur", "arun", "chichester", "crawley", "horsham", "mid sussex",
          "worthing", "brighton and hove", "eastbourne", "hastings", "lewes", "rother", "wealden"
        ];
        
        // Exclude obvious administrative areas by name
        // Note: We trust settlement properties (city/town/village/hamlet) as indicators of legitimate destinations
        const isKnownCounty = ukCounties.includes(nameLower);
        const isKnownAdministrativeDistrict = ukAdministrativeDistricts.includes(nameLower);
        
        // Only check for administrative districts if NO settlement property exists
        // If it has settlement properties, trust Geoapify's classification
        const isAdministrativeDistrict = 
          nameLower.match(/\b(district|county|council|region|authority|administrative)\b/i) ||
          // Filter "South/North/East/West X" patterns that are districts (like "South Cambridgeshire")
          (/^(south|north|east|west|mid)\s+[a-z]+\s*(district|county|council)$/i.test(name));
        
        // Check categories - exclude ONLY high-level administrative categories
        // Allow district_level and borough if they have settlement properties
        const isHighLevelAdministrative = kinds.some((k: string) => 
          k.includes("administrative.country") ||
          k.includes("administrative.country_part") ||
          k.includes("administrative.state") ||
          k.includes("administrative.province") ||
          k.includes("administrative.region")
          // REMOVED: administrative.district_level - allow this if it has settlement properties
        );
        
        // Primary filtering logic: Trust settlement properties
        if (hasSettlementProperty) {
          // Has settlement property (city/town/village/hamlet) - this is a legitimate destination
          // Only exclude if it's a known county (too large) or high-level administrative area
          if (isKnownCounty) {
            nameFiltered++;
            filteredByType.push({name, reason: `known county (has settlement property but is county)`});
            continue;
          }
          if (isHighLevelAdministrative) {
            nameFiltered++;
            filteredByType.push({name, reason: `high-level administrative (${kinds.join(", ")})`});
            continue;
          }
          // Allow through - settlement properties indicate it's a real place to visit
          passedPlaces.push({name, distance, hasSettlement: true});
        } else {
          // No settlement property - be more careful
          // Exclude known counties, administrative districts, and high-level administrative areas
          if (isKnownCounty) {
            nameFiltered++;
            filteredByType.push({name, reason: `known county`});
            continue;
          }
          if (isKnownAdministrativeDistrict) {
            nameFiltered++;
            filteredByType.push({name, reason: `known administrative district`});
            continue;
          }
          if (isHighLevelAdministrative) {
            administrativeFiltered++;
            filteredByType.push({name, reason: `high-level administrative (${kinds.join(", ")})`});
            continue;
          }
          
          // Check name patterns for administrative-looking names (only if no settlement property)
          const looksLikeAdministrative = 
            nameLower.includes("county") ||
            nameLower.includes("district") ||
            nameLower.includes("council") ||
            nameLower.includes("region") ||
            nameLower.includes("authority") ||
            nameLower.includes("administrative");
            // REMOVED: nameLower.includes("borough") - allow boroughs if they have settlement properties
          
          if (looksLikeAdministrative) {
            settlementFiltered++;
            filteredByType.push({name, reason: `name pattern looks administrative (no settlement property)`});
            continue;
          }
          
          if (name.length <= 2) {
            settlementFiltered++;
            filteredByType.push({name, reason: `name too short (${name.length} chars)`});
            continue;
          }
          
          // Passed through without settlement property
          passedPlaces.push({name, distance, hasSettlement: false});
        }

        const id = `geoapify-${name.toLowerCase().replace(/\s+/g, '-')}-${placeLat.toFixed(3)}-${placeLon.toFixed(3)}`;

        places.push({
          id,
          name: name.trim(),
          lat: placeLat,
          lon: placeLon,
          distanceKm: distance,
          kinds: kinds,
          description: null,
        });
      }
    }

    // Remove duplicates by name (keep closest)
    const uniquePlaces = new Map<string, Place>();
    const duplicateDetails: Array<{name: string, kept: number, removed: number}> = [];
    
    for (const place of places) {
      const nameKey = place.name.toLowerCase().trim();
      if (!uniquePlaces.has(nameKey)) {
        uniquePlaces.set(nameKey, place);
      } else {
        const existing = uniquePlaces.get(nameKey)!;
        if (place.distanceKm < existing.distanceKm) {
          duplicateDetails.push({
            name: place.name,
            kept: place.distanceKm,
            removed: existing.distanceKm
          });
          uniquePlaces.set(nameKey, place);
        } else {
          duplicateDetails.push({
            name: place.name,
            kept: existing.distanceKm,
            removed: place.distanceKm
          });
          duplicateCount++;
        }
      }
    }

    const result = Array.from(uniquePlaces.values()).sort((a, b) => a.distanceKm - b.distanceKm);
    
    // Detailed logging
    console.log(`[FILTER] Summary: ${result.length} unique places from ${data.features?.length || 0} features`);
    console.log(`[FILTER] Breakdown: ${filteredCount} distance-filtered, ${noCoordinatesCount} no coordinates, ${noNameCount} no name, ${administrativeFiltered} administrative, ${settlementFiltered} non-settlement, ${nameFiltered} name-based, ${duplicateCount} duplicates removed`);
    
    if (filteredByDistance.length > 0) {
      console.log(`[FILTER] Distance-filtered (${filteredByDistance.length}):`);
      filteredByDistance.slice(0, 10).forEach(f => {
        console.log(`  - ${f.name}: ${f.reason}`);
      });
      if (filteredByDistance.length > 10) {
        console.log(`  ... and ${filteredByDistance.length - 10} more`);
      }
    }
    
    if (filteredByType.length > 0) {
      console.log(`[FILTER] Type-filtered (${filteredByType.length}):`);
      filteredByType.forEach(f => {
        console.log(`  - ${f.name}: ${f.reason}`);
      });
    }
    
    if (duplicateDetails.length > 0) {
      console.log(`[FILTER] Duplicates removed (${duplicateDetails.length}):`);
      duplicateDetails.slice(0, 10).forEach(d => {
        console.log(`  - ${d.name}: kept ${d.kept.toFixed(1)}km, removed ${d.removed.toFixed(1)}km`);
      });
      if (duplicateDetails.length > 10) {
        console.log(`  ... and ${duplicateDetails.length - 10} more`);
      }
    }
    
    if (passedPlaces.length > 0) {
      console.log(`[FILTER] Places that passed (${passedPlaces.length}):`);
      passedPlaces.forEach(p => {
        console.log(`  - ${p.name}: ${p.distance.toFixed(1)}km (settlement: ${p.hasSettlement ? "yes" : "no"})`);
      });
    }
    
    console.log(`[API] Geoapify processed ${result.length} unique places after filtering (filtered: ${filteredCount} total, ${administrativeFiltered} administrative, ${settlementFiltered} non-settlement, ${nameFiltered} name-based)`);
    return result;
  } catch (error: any) {
    const errorType = error?.name || "UnknownError";
    const errorMessage = error?.message || "No error message";
    const errorStack = error?.stack || "No stack trace";
    
    console.error(`[API FAIL] Geoapify: Unexpected Exception`);
    console.error(`[API ERROR DETAILS] Error Type: ${errorType} | Message: ${errorMessage}`);
    console.error(`[API ERROR DETAILS] Location: ${lat},${lon} | Radius: ${radiusKm}km`);
    console.error(`[API ERROR DETAILS] Stack (first 1000 chars): ${errorStack.substring(0, 1000)}`);
    
    // Check for specific error types
    if (errorType === "TypeError" && errorMessage.includes("fetch")) {
      console.error(`[API ERROR DETAILS] Likely Cause: Network error or fetch API not available`);
    } else if (errorType === "SyntaxError") {
      console.error(`[API ERROR DETAILS] Likely Cause: Invalid JSON response from API`);
    }
    
    return [];
  }
}

/**
 * Generate fallback places when API fails
 * Uses known major cities in the UK and calculates distances
 */
function generateFallbackPlaces(lat: number, lon: number, radiusKm: number): Place[] {
  // Comprehensive list of UK cities, towns, and villages
  // Includes major cities and many smaller towns/villages for better coverage
  const ukCities = [
    { name: "London", lat: 51.5074, lon: -0.1276 },
    { name: "Manchester", lat: 53.4808, lon: -2.2426 },
    { name: "Birmingham", lat: 52.4862, lon: -1.8904 },
    { name: "Liverpool", lat: 53.4084, lon: -2.9916 },
    { name: "Leeds", lat: 53.8008, lon: -1.5491 },
    { name: "Sheffield", lat: 53.3811, lon: -1.4701 },
    // Towns near Leeds and Yorkshire
    { name: "Wakefield", lat: 53.6833, lon: -1.4977 },
    { name: "Bradford", lat: 53.7950, lon: -1.7594 },
    { name: "Huddersfield", lat: 53.6458, lon: -1.7850 },
    { name: "Halifax", lat: 53.7270, lon: -1.8575 },
    { name: "Dewsbury", lat: 53.6900, lon: -1.6297 },
    { name: "Batley", lat: 53.7167, lon: -1.6333 },
    { name: "Morley", lat: 53.7500, lon: -1.6000 },
    { name: "Pudsey", lat: 53.7958, lon: -1.6614 },
    { name: "Otley", lat: 53.9042, lon: -1.6936 },
    { name: "Ilkley", lat: 53.9247, lon: -1.8236 },
    { name: "Harrogate", lat: 53.9917, lon: -1.5378 },
    { name: "Knaresborough", lat: 54.0083, lon: -1.4681 },
    { name: "Ripon", lat: 54.1350, lon: -1.5219 },
    { name: "Wetherby", lat: 53.9283, lon: -1.3869 },
    { name: "Tadcaster", lat: 53.8833, lon: -1.2667 },
    { name: "Selby", lat: 53.7833, lon: -1.0667 },
    { name: "Pontefract", lat: 53.6917, lon: -1.3125 },
    { name: "Castleford", lat: 53.7250, lon: -1.3542 },
    { name: "Normanton", lat: 53.7000, lon: -1.4167 },
    { name: "Featherstone", lat: 53.6917, lon: -1.3583 },
    { name: "Knottingley", lat: 53.7083, lon: -1.2417 },
    { name: "Goole", lat: 53.7000, lon: -0.8750 },
    { name: "Doncaster", lat: 53.5228, lon: -1.1314 },
    { name: "Rotherham", lat: 53.4300, lon: -1.3570 },
    { name: "Barnsley", lat: 53.5542, lon: -1.4792 },
    { name: "Middlesbrough", lat: 54.5767, lon: -1.2350 },
    { name: "Stockton-on-Tees", lat: 54.5700, lon: -1.3167 },
    { name: "Hartlepool", lat: 54.6900, lon: -1.2100 },
    { name: "Darlington", lat: 54.5242, lon: -1.5500 },
    { name: "Durham", lat: 54.7761, lon: -1.5733 },
    { name: "Sunderland", lat: 54.9044, lon: -1.3814 },
    { name: "Gateshead", lat: 54.9500, lon: -1.6000 },
    { name: "South Shields", lat: 54.9981, lon: -1.4328 },
    { name: "Tynemouth", lat: 55.0167, lon: -1.4167 },
    { name: "Whitley Bay", lat: 55.0417, lon: -1.4458 },
    { name: "Cramlington", lat: 55.0833, lon: -1.5833 },
    { name: "Ashington", lat: 55.1833, lon: -1.5667 },
    { name: "Blyth", lat: 55.1250, lon: -1.5083 },
    { name: "Morpeth", lat: 55.1667, lon: -1.6833 },
    { name: "Alnwick", lat: 55.4125, lon: -1.7056 },
    { name: "Berwick-upon-Tweed", lat: 55.7714, lon: -2.0069 },
    { name: "Bristol", lat: 51.4545, lon: -2.5879 },
    { name: "Edinburgh", lat: 55.9533, lon: -3.1883 },
    { name: "Glasgow", lat: 55.8642, lon: -4.2518 },
    { name: "Cardiff", lat: 51.4816, lon: -3.1791 },
    { name: "Newcastle", lat: 54.9783, lon: -1.6178 },
    { name: "Nottingham", lat: 52.9548, lon: -1.1581 },
    { name: "Leicester", lat: 52.6369, lon: -1.1398 },
    { name: "Coventry", lat: 52.4068, lon: -1.5197 },
    { name: "Belfast", lat: 54.5973, lon: -5.9301 },
    { name: "Brighton", lat: 50.8225, lon: -0.1372 },
    { name: "Oxford", lat: 51.7520, lon: -1.2577 },
    { name: "Cambridge", lat: 52.2053, lon: 0.1218 },
    { name: "York", lat: 53.9600, lon: -1.0873 },
    { name: "Bath", lat: 51.3758, lon: -2.3599 },
    // Cities near Manchester and North England
    { name: "Bolton", lat: 53.5789, lon: -2.4299 },
    { name: "Oldham", lat: 53.5409, lon: -2.1184 },
    { name: "Rochdale", lat: 53.6177, lon: -2.1552 },
    { name: "Stockport", lat: 53.4084, lon: -2.1496 },
    { name: "Salford", lat: 53.4875, lon: -2.2901 },
    { name: "Wigan", lat: 53.5450, lon: -2.6325 },
    { name: "Warrington", lat: 53.3900, lon: -2.5970 },
    { name: "Blackburn", lat: 53.7488, lon: -2.4873 },
    { name: "Burnley", lat: 53.7890, lon: -2.2405 },
    { name: "Preston", lat: 53.7632, lon: -2.7031 },
    { name: "Blackpool", lat: 53.8175, lon: -3.0357 },
    { name: "Chester", lat: 53.1934, lon: -2.8931 },
    { name: "Macclesfield", lat: 53.2594, lon: -2.1254 },
    { name: "Buxton", lat: 53.2578, lon: -1.9094 },
    { name: "Derby", lat: 52.9225, lon: -1.4746 },
    { name: "Stoke-on-Trent", lat: 53.0027, lon: -2.1794 },
    { name: "Crewe", lat: 53.0997, lon: -2.4419 },
    { name: "Northwich", lat: 53.2588, lon: -2.5183 },
    { name: "Altrincham", lat: 53.3878, lon: -2.3488 },
    { name: "Bury", lat: 53.5933, lon: -2.2966 },
    // Additional cities near London and major areas
    { name: "Reading", lat: 51.4543, lon: -0.9781 },
    { name: "Luton", lat: 51.8797, lon: -0.4175 },
    { name: "Milton Keynes", lat: 52.0406, lon: -0.7594 },
    { name: "Southampton", lat: 50.9097, lon: -1.4044 },
    { name: "Portsmouth", lat: 50.8198, lon: -1.0880 },
    { name: "Norwich", lat: 52.6309, lon: 1.2974 },
    // Towns and villages near Norwich (Norfolk/Suffolk)
    { name: "Great Yarmouth", lat: 52.6083, lon: 1.7306 },
    { name: "Lowestoft", lat: 52.4753, lon: 1.7517 },
    { name: "Cromer", lat: 52.9308, lon: 1.2992 },
    { name: "Sheringham", lat: 52.9417, lon: 1.2092 },
    { name: "Holt", lat: 52.9042, lon: 1.0903 },
    { name: "Fakenham", lat: 52.8292, lon: 0.8492 },
    { name: "Dereham", lat: 52.6811, lon: 0.9403 },
    { name: "Wymondham", lat: 52.5708, lon: 1.1153 },
    { name: "Attleborough", lat: 52.5181, lon: 1.0153 },
    { name: "Thetford", lat: 52.4139, lon: 0.7503 },
    { name: "Swaffham", lat: 52.6481, lon: 0.6875 },
    { name: "Downham Market", lat: 52.6069, lon: 0.3831 },
    { name: "King's Lynn", lat: 52.7556, lon: 0.3981 },
    { name: "Wisbech", lat: 52.6631, lon: 0.1597 },
    { name: "Hunstanton", lat: 52.9375, lon: 0.4917 },
    { name: "Wells-next-the-Sea", lat: 52.9583, lon: 0.8500 },
    { name: "Blakeney", lat: 52.9583, lon: 1.0167 },
    { name: "Aylsham", lat: 52.7972, lon: 1.2514 },
    { name: "North Walsham", lat: 52.8211, lon: 1.3847 },
    { name: "Stalham", lat: 52.7708, lon: 1.5153 },
    { name: "Beccles", lat: 52.4583, lon: 1.5639 },
    { name: "Bungay", lat: 52.4542, lon: 1.4375 },
    { name: "Halesworth", lat: 52.3458, lon: 1.5042 },
    { name: "Southwold", lat: 52.3278, lon: 1.6792 },
    { name: "Aldeburgh", lat: 52.1528, lon: 1.6000 },
    { name: "Saxmundham", lat: 52.2167, lon: 1.4889 },
    { name: "Framlingham", lat: 52.2208, lon: 1.3431 },
    { name: "Woodbridge", lat: 52.0931, lon: 1.3208 },
    { name: "Felixstowe", lat: 51.9631, lon: 1.3514 },
    { name: "Ipswich", lat: 52.0567, lon: 1.1482 },
    { name: "Colchester", lat: 51.8959, lon: 0.8919 },
    { name: "Chelmsford", lat: 51.7358, lon: 0.4696 },
    { name: "Canterbury", lat: 51.2802, lon: 1.0789 },
    { name: "Guildford", lat: 51.2362, lon: -0.5704 },
    { name: "Woking", lat: 51.3168, lon: -0.5600 },
    { name: "Slough", lat: 51.5105, lon: -0.5950 },
    { name: "Windsor", lat: 51.4839, lon: -0.6078 },
    { name: "St Albans", lat: 51.7530, lon: -0.3373 },
    { name: "Watford", lat: 51.6565, lon: -0.3903 },
    { name: "Harlow", lat: 51.7729, lon: 0.1024 },
    { name: "Basildon", lat: 51.5684, lon: 0.4577 },
    { name: "Southend-on-Sea", lat: 51.5459, lon: 0.7077 },
    // Smaller towns and villages near London
    { name: "Dartford", lat: 51.4470, lon: 0.2190 },
    { name: "Gravesend", lat: 51.4414, lon: 0.3707 },
    { name: "Rochester", lat: 51.3896, lon: 0.5037 },
    { name: "Maidstone", lat: 51.2704, lon: 0.5227 },
    { name: "Tunbridge Wells", lat: 51.1324, lon: 0.2633 },
    { name: "Sevenoaks", lat: 51.2728, lon: 0.1909 },
    { name: "Tonbridge", lat: 51.1953, lon: 0.2733 },
    { name: "Reigate", lat: 51.2376, lon: -0.2056 },
    { name: "Redhill", lat: 51.2404, lon: -0.1704 },
    { name: "Epsom", lat: 51.3325, lon: -0.2678 },
    { name: "Kingston upon Thames", lat: 51.4123, lon: -0.3008 },
    { name: "Richmond", lat: 51.4613, lon: -0.3037 },
    { name: "Twickenham", lat: 51.4447, lon: -0.3370 },
    { name: "Hounslow", lat: 51.4676, lon: -0.3618 },
    { name: "Uxbridge", lat: 51.5448, lon: -0.4776 },
    { name: "Hayes", lat: 51.5038, lon: -0.4237 },
    { name: "Southall", lat: 51.5074, lon: -0.3758 },
    { name: "Ealing", lat: 51.5133, lon: -0.3081 },
    { name: "Brentford", lat: 51.4831, lon: -0.3084 },
    { name: "Chiswick", lat: 51.4921, lon: -0.2577 },
    { name: "Hammersmith", lat: 51.4926, lon: -0.2239 },
    { name: "Fulham", lat: 51.4800, lon: -0.1950 },
    { name: "Putney", lat: 51.4613, lon: -0.2162 },
    { name: "Wimbledon", lat: 51.4223, lon: -0.2062 },
    { name: "Morden", lat: 51.4012, lon: -0.1948 },
    { name: "Sutton", lat: 51.3614, lon: -0.1936 },
    { name: "Carshalton", lat: 51.3659, lon: -0.1676 },
    { name: "Croydon", lat: 51.3762, lon: -0.0982 },
    { name: "Bromley", lat: 51.4050, lon: 0.0142 },
    { name: "Orpington", lat: 51.3744, lon: 0.0979 },
    { name: "Dartford", lat: 51.4470, lon: 0.2190 },
    { name: "Gravesend", lat: 51.4414, lon: 0.3707 },
    { name: "Rochester", lat: 51.3896, lon: 0.5037 },
    { name: "Chatham", lat: 51.3789, lon: 0.5277 },
    { name: "Gillingham", lat: 51.3894, lon: 0.5483 },
    { name: "Sittingbourne", lat: 51.3412, lon: 0.7326 },
    { name: "Faversham", lat: 51.3148, lon: 0.8886 },
    { name: "Whitstable", lat: 51.3610, lon: 1.0257 },
    { name: "Herne Bay", lat: 51.3730, lon: 1.1280 },
    { name: "Margate", lat: 51.3842, lon: 1.3862 },
    { name: "Ramsgate", lat: 51.3400, lon: 1.4170 },
    { name: "Broadstairs", lat: 51.3592, lon: 1.4390 },
    // Towns north of London
    { name: "Stevenage", lat: 51.9017, lon: -0.2026 },
    { name: "Hitchin", lat: 51.9488, lon: -0.2830 },
    { name: "Letchworth", lat: 51.9794, lon: -0.2264 },
    { name: "Baldock", lat: 51.9930, lon: -0.1883 },
    { name: "Royston", lat: 52.0483, lon: -0.0244 },
    { name: "Bishop's Stortford", lat: 51.8717, lon: 0.1586 },
    { name: "Saffron Walden", lat: 52.0244, lon: 0.2425 },
    { name: "Braintree", lat: 51.8780, lon: 0.5506 },
    { name: "Witham", lat: 51.7978, lon: 0.6373 },
    { name: "Maldon", lat: 51.7311, lon: 0.6746 },
    { name: "Burnham-on-Crouch", lat: 51.6280, lon: 0.8140 },
    // Towns east of London
    { name: "Brentwood", lat: 51.6200, lon: 0.3056 },
    { name: "Romford", lat: 51.5759, lon: 0.1841 },
    { name: "Ilford", lat: 51.5597, lon: 0.0708 },
    { name: "Barking", lat: 51.5396, lon: 0.0813 },
    { name: "Dagenham", lat: 51.5417, lon: 0.1425 },
    { name: "Rainham", lat: 51.5173, lon: 0.1906 },
    { name: "Upminster", lat: 51.5592, lon: 0.2510 },
    { name: "Hornchurch", lat: 51.5569, lon: 0.2189 },
    { name: "Harold Wood", lat: 51.5936, lon: 0.2329 },
    { name: "Gidea Park", lat: 51.5847, lon: 0.2056 },
    // Towns west of London
    { name: "Maidenhead", lat: 51.5228, lon: -0.7221 },
    { name: "Reading", lat: 51.4543, lon: -0.9781 },
    { name: "Henley-on-Thames", lat: 51.5360, lon: -0.9014 },
    { name: "Marlow", lat: 51.5694, lon: -0.7744 },
    { name: "High Wycombe", lat: 51.6291, lon: -0.7493 },
    { name: "Beaconsfield", lat: 51.6120, lon: -0.6472 },
    { name: "Amersham", lat: 51.6739, lon: -0.6077 },
    { name: "Chesham", lat: 51.7008, lon: -0.6114 },
    { name: "Aylesbury", lat: 51.8178, lon: -0.8144 },
    { name: "Thame", lat: 51.7484, lon: -0.9761 },
    { name: "Princes Risborough", lat: 51.7250, lon: -0.8314 },
    // Towns south of London
    { name: "Epsom", lat: 51.3325, lon: -0.2678 },
    { name: "Leatherhead", lat: 51.2956, lon: -0.3289 },
    { name: "Dorking", lat: 51.2329, lon: -0.3338 },
    { name: "Horsham", lat: 51.0629, lon: -0.3259 },
    { name: "Crawley", lat: 51.1092, lon: -0.1872 },
    { name: "East Grinstead", lat: 51.1234, lon: -0.0076 },
    { name: "Haywards Heath", lat: 50.9976, lon: -0.1032 },
    { name: "Burgess Hill", lat: 50.9534, lon: -0.1268 },
    { name: "Hassocks", lat: 50.9281, lon: -0.1460 },
    { name: "Hurstpierpoint", lat: 50.9333, lon: -0.1800 },
    { name: "Steyning", lat: 50.8875, lon: -0.3275 },
    { name: "Shoreham-by-Sea", lat: 50.8340, lon: -0.2743 },
    { name: "Worthing", lat: 50.8179, lon: -0.3729 },
    { name: "Littlehampton", lat: 50.8094, lon: -0.5408 },
    { name: "Bognor Regis", lat: 50.7821, lon: -0.6756 },
    { name: "Chichester", lat: 50.8365, lon: -0.7792 },
    { name: "Arundel", lat: 50.8543, lon: -0.5539 },
    // Towns near Manchester
    { name: "Ashton-under-Lyne", lat: 53.4897, lon: -2.0931 },
    { name: "Hyde", lat: 53.4514, lon: -2.0790 },
    { name: "Stalybridge", lat: 53.4841, lon: -2.0610 },
    { name: "Dukinfield", lat: 53.4747, lon: -2.0881 },
    { name: "Mossley", lat: 53.5147, lon: -2.0344 },
    { name: "Uppermill", lat: 53.5481, lon: -2.0014 },
    { name: "Delph", lat: 53.5675, lon: -2.0247 },
    { name: "Dobcross", lat: 53.5544, lon: -2.0119 },
    { name: "Diggle", lat: 53.5714, lon: -2.0014 },
    { name: "Marsden", lat: 53.6014, lon: -1.9264 },
    { name: "Slaithwaite", lat: 53.6214, lon: -1.8314 },
    { name: "Golcar", lat: 53.6414, lon: -1.8514 },
    { name: "Milnsbridge", lat: 53.6414, lon: -1.8114 },
    { name: "Linthwaite", lat: 53.6314, lon: -1.8414 },
    { name: "Meltham", lat: 53.5914, lon: -1.8514 },
    { name: "Holmfirth", lat: 53.5714, lon: -1.7914 },
    { name: "Honley", lat: 53.6014, lon: -1.7814 },
    { name: "Brockholes", lat: 53.5914, lon: -1.7714 },
    { name: "New Mill", lat: 53.5814, lon: -1.7614 },
    { name: "Thurstonland", lat: 53.5714, lon: -1.7514 },
  ];

  // Calculate distances and filter by radius
  const places: Place[] = ukCities
    .map((city) => {
      const distanceKm = haversineDistance(lat, lon, city.lat, city.lon);

      return {
        id: `fallback-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        distanceKm,
        kinds: ["city"],
        description: null,
      };
    })
    .filter((place) => place.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return places;
}

