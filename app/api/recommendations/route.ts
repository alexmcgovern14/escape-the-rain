/**
 * GET /api/recommendations
 * Main recommendation endpoint
 * Query params: 
 *   - lat, lon (required)
 *   - source (optional: "geolocation" | "manual")
 *   - strictHours (optional: number of hours to check for rain in candidate places, default: 4)
 * 
 * Algorithm:
 * 1. Check local weather for next 12 hours
 * 2. Always fetch candidate places and search for nearby dry locations (even if user's location is dry)
 * 3. Filter out places within 1km of user location
 * 4. Weather-check top candidates using strictHours (default: 4 hours)
 * 5. Filter to dry places (not raining now and not in next N hours), sort by distance, return top 5
 */

import { NextRequest, NextResponse } from "next/server";
import { checkWeatherAtLocation, checkWeatherBulk, isDryToday } from "@/lib/weather";
import { fetchNearbyPlacesWithSources, enrichPlaceWithPOIs } from "@/lib/places";
import { haversineDistance } from "@/lib/geo";
import { logSearchResult } from "@/lib/logging";
import type { RecommendationResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const source = searchParams.get("source") || "geolocation";
  const userLocationName = searchParams.get("locationName") || null; // User's location name for filtering
  const strictHoursParam = searchParams.get("strictHours");
  const strictHours = strictHoursParam ? parseInt(strictHoursParam, 10) : 4; // Default: 4 hours
  const searchDistanceParam = searchParams.get("searchDistance");
  // "auto" or empty means use original logic (50km -> 100km fallback)
  // Otherwise use the specified distance
  const useAutoSearch = !searchDistanceParam || searchDistanceParam === "auto";
  const searchDistance = useAutoSearch ? null : parseInt(searchDistanceParam, 10);

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

    const apiKey = process.env.OPENTRIPMAP_API_KEY || "";
    const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || "";
    
    // At least one API key should be configured
    if (!geoapifyApiKey && !apiKey) {
      return NextResponse.json(
        { error: "No API keys configured. Please set GEOAPIFY_API_KEY or OPENTRIPMAP_API_KEY" },
        { status: 500 }
      );
    }

  try {
    // Step 1: Check local weather for next 12 hours
    // This determines if user's location is dry, but we'll still search for nearby dry places
    const localWeather = await checkWeatherAtLocation(latitude, longitude, 12);

    const response: RecommendationResponse = {
      userLocation: {
        lat: latitude,
        lon: longitude,
        source: source === "manual" ? "manual" : "geolocation",
      },
      localWeather,
      recommendations: [],
    };

    // Step 2: Always continue searching for nearby dry places
    // Even if user's location is dry, show them other nearby dry locations

    // Step 3: Fetch candidate places using user-specified search distance or auto logic
    let candidatePlaces: any[] = [];
    let searchRadius: number;
    let placesResult: Awaited<ReturnType<typeof fetchNearbyPlacesWithSources>> | null = null;
    
    if (useAutoSearch) {
      // Auto logic: search 25km first, then 50km, then 100km if needed
      searchRadius = 25;
      try {
        // First try: 1-25km
        placesResult = await fetchNearbyPlacesWithSources(
          latitude,
          longitude,
          searchRadius,
          apiKey
        );
        candidatePlaces = placesResult.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > 1 && distance <= 25;
        });
        console.log(`[AUTO] Found ${candidatePlaces.length} candidate places within 1-25km`);
        
        // Second try: 25-50km if we have very few places (< 5)
        if (candidatePlaces.length < 5) {
          searchRadius = 50;
          console.log(`[AUTO] Only ${candidatePlaces.length} places found in 1-25km, extending to 25-50km`);
          const extendedResult = await fetchNearbyPlacesWithSources(
            latitude,
            longitude,
            searchRadius,
            apiKey
          );
          const extendedPlaces = extendedResult.places.filter(place => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return distance > 25 && distance <= 50;
          });
          candidatePlaces = [...candidatePlaces, ...extendedPlaces];
          placesResult = {
            ...extendedResult,
            places: candidatePlaces,
          };
          console.log(`[AUTO] Found ${extendedPlaces.length} additional places in 25-50km (total: ${candidatePlaces.length})`);
        }
        
        // Third try: 50-100km if we still have very few places (< 5)
        if (candidatePlaces.length < 5) {
          const finalRadius = 100;
          console.log(`[AUTO] Only ${candidatePlaces.length} places found in 1-50km, extending to 50-100km`);
          const finalResult = await fetchNearbyPlacesWithSources(
            latitude,
            longitude,
            finalRadius,
            apiKey
          );
          const finalPlaces = finalResult.places.filter(place => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return distance > 50 && distance <= 100;
          });
          candidatePlaces = [...candidatePlaces, ...finalPlaces];
          placesResult = {
            ...finalResult,
            places: candidatePlaces,
          };
          searchRadius = finalRadius;
          console.log(`[AUTO] Found ${finalPlaces.length} additional places in 50-100km (total: ${candidatePlaces.length})`);
        }
      } catch (error) {
        console.error("Error fetching places:", error);
        // Continue anyway - we'll have empty recommendations
      }
    } else {
      // User-specified distance
      const allowedDistances = [10, 25, 50, 100];
      if (!searchDistance || !allowedDistances.includes(searchDistance)) {
        searchRadius = 50; // Default to 50km if invalid
      } else {
        searchRadius = searchDistance;
      }
      
      try {
        placesResult = await fetchNearbyPlacesWithSources(
          latitude,
          longitude,
          searchRadius,
          apiKey
        );
        candidatePlaces = placesResult.places;
        console.log(`Found ${candidatePlaces.length} candidate places within ${searchRadius}km`);
        
        // If we have very few places (< 10) and user hasn't selected max distance, extend search
        if (candidatePlaces.length < 10 && searchRadius < 100) {
          const extendedRadius = Math.min(searchRadius * 2, 100);
          console.log(`Only ${candidatePlaces.length} places found within ${searchRadius}km, extending search to ${extendedRadius}km`);
          const extendedResult = await fetchNearbyPlacesWithSources(
            latitude,
            longitude,
            extendedRadius,
            apiKey
          );
          candidatePlaces = extendedResult.places;
          placesResult = extendedResult; // Use extended result for logging
          searchRadius = extendedRadius;
          console.log(`Found ${candidatePlaces.length} candidate places within ${extendedRadius}km`);
        }
      } catch (error) {
        console.error("Error fetching places:", error);
        // Continue anyway - we'll have empty recommendations
      }
    }

    if (candidatePlaces.length === 0) {
      console.log("No candidate places found - returning early");
      return NextResponse.json(response);
    }

    // Step 4: Recalculate distances from user location for accuracy
    // Note: For auto search, we've already filtered by distance, but we still need to recalculate
    // for accurate distance values
    const candidatesWithDistance = candidatePlaces.map((place) => {
      const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
      return {
        ...place,
        distanceKm: distance, // Use recalculated distance
      };
    });
    
    // Filter out places within 1km of user location AND places with the same name
    // This avoids recommending the same place the user is already at
    const filteredCandidates = candidatesWithDistance.filter((place) => {
      // Distance filter
      if (place.distanceKm <= 1) return false;
      
      // Name-based filter - exclude if it's the exact same location name
      if (userLocationName) {
        const placeNameLower = place.name.toLowerCase().trim();
        const userLocationNameLower = userLocationName.toLowerCase().trim();
        
        // Exact match
        if (placeNameLower === userLocationNameLower) {
          return false;
        }
        
        // Also check if the place name is contained in user location or vice versa
        // (e.g., "Braintree" should exclude "Braintree, Essex")
        if (placeNameLower.includes(userLocationNameLower) || userLocationNameLower.includes(placeNameLower)) {
          // But allow if it's clearly a different place (e.g., "Braintree" vs "Braintree District" is OK if distance > 5km)
          // Only exclude if very close (likely the same place)
          if (place.distanceKm < 5) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    if (filteredCandidates.length === 0) {
      console.log("No candidate places found after filtering user location");
      return NextResponse.json(response);
    }
    
    // Sort by distance and take top candidates (increased to find more dry places)
    // Check more candidates to increase chances of finding dry places
    const topCandidates = filteredCandidates
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, Math.max(50, Math.min(filteredCandidates.length, 100))); // Check up to 100 candidates if available
    
    if (topCandidates.length === 0) {
      console.log("No candidate places found after filtering user location");
      return NextResponse.json(response);
    }
    
    const coordinates = topCandidates.map((place) => ({
      lat: place.lat,
      lon: place.lon,
    }));

    console.log(`Checking weather for ${coordinates.length} locations (after filtering user location, strictHours: ${strictHours})`);
    // Use individual requests for now (more reliable than bulk)
    const weatherResults = new Map<string, Awaited<ReturnType<typeof checkWeatherAtLocation>>>();
    for (const coord of coordinates) {
      try {
        const result = await checkWeatherAtLocation(coord.lat, coord.lon, strictHours);
        weatherResults.set(`${coord.lat},${coord.lon}`, result);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to check weather for ${coord.lat},${coord.lon}:`, error);
      }
    }
    console.log(`Got weather results for ${weatherResults.size} locations`);
    const weatherSuccessRate = coordinates.length > 0 ? Math.round((weatherResults.size / coordinates.length) * 100) : 0;
    console.log(`Weather check success rate: ${weatherResults.size}/${coordinates.length} (${weatherSuccessRate}%)`);

    // Step 5: Filter to dry places and sort by distance
    // Use strict mode: must not be raining now AND must not rain in next N hours
    const dryPlaces = topCandidates
      .map((place) => {
        const weatherKey = `${place.lat},${place.lon}`;
        const weather = weatherResults.get(weatherKey);
        
        if (!weather) {
          console.log(`No weather data for ${place.name} (${weatherKey})`);
          return null;
        }

        const dry = isDryToday(weather, true); // true = strict mode
        console.log(`${place.name}: ${dry ? "DRY" : "WET"} - ${weather.summary}`);

        return {
          place,
          isDryToday: dry,
          rainSummary: weather.summary || "Unknown",
          weather,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.isDryToday)
      .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
      .slice(0, 5); // Take top 5

    const wetCount = topCandidates.length - dryPlaces.length;
    console.log(`Weather analysis: ${dryPlaces.length} dry places, ${wetCount} wet places out of ${topCandidates.length} candidates checked`);

    // Step 6: Enrich places with POI information
    console.log(`Enriching ${dryPlaces.length} places with POI data...`);
    const enrichedPlaces = await Promise.all(
      dryPlaces.map(async (item) => {
        const poiData = await enrichPlaceWithPOIs(
          item.place.lat,
          item.place.lon,
          item.place.name,
          geoapifyApiKey
        );
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
          place: {
            ...item.place,
            nearbyPOIs: poiData.nearbyPOIs,
            poiSummary: poiData.poiSummary,
          },
          isDryToday: item.isDryToday,
          rainSummary: item.rainSummary,
        };
      })
    );

    console.log(`Found ${enrichedPlaces.length} dry places`);
    
    // Log the search result with API source information
    if (placesResult) {
      await logSearchResult({
        timestamp: new Date().toISOString(),
        location: { lat: latitude, lon: longitude },
        searchRadius,
        apiSources: placesResult.apiSources,
        placesFound: candidatePlaces.length,
        dryPlacesFound: enrichedPlaces.length,
        primarySource: placesResult.primarySource,
        geoapifyCount: placesResult.geoapifyCount,
        nominatimCount: placesResult.nominatimCount,
        opentripmapCount: placesResult.opentripmapCount,
        fallbackUsed: placesResult.fallbackUsed,
      });
    }
    
    // If we found fewer than 5 dry places and we're in auto mode, try extending search
    if (enrichedPlaces.length < 5 && useAutoSearch) {
      // If we only searched 25km, extend to 50km
      if (searchRadius === 25) {
        const extendedRadius = 50;
        console.log(`Only found ${enrichedPlaces.length} dry places in 1-25km, extending search to 25-${extendedRadius}km for more options`);
        const extendedResult = await fetchNearbyPlacesWithSources(
          latitude,
          longitude,
          extendedRadius,
          apiKey
        );
        
        // Filter to only places between 25-50km
        const extendedPlaces = extendedResult.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > 25 && distance <= 50;
        });
        
        if (extendedPlaces.length > 0) {
          // Merge with existing candidates
          const allCandidates = [...topCandidates];
          const extendedWithDistance = extendedPlaces.map((place) => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return { ...place, distanceKm: distance };
          });
          
          const extendedFiltered = extendedWithDistance
            .filter((place) => {
              // Distance filter
              if (place.distanceKm <= 1) return false;
              
              // Name-based filter
              if (userLocationName) {
                const placeNameLower = place.name.toLowerCase().trim();
                const userLocationNameLower = userLocationName.toLowerCase().trim();
                
                if (placeNameLower === userLocationNameLower) {
                  return false;
                }
                
                if (placeNameLower.includes(userLocationNameLower) || userLocationNameLower.includes(placeNameLower)) {
                  if (place.distanceKm < 5) {
                    return false;
                  }
                }
              }
              
              // Don't duplicate existing candidates
              if (allCandidates.some(c => c.id === place.id)) {
                return false;
              }
              
              return true;
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 30);
          
          // Check weather for additional places
          for (const place of extendedFiltered) {
            try {
              const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
              weatherResults.set(`${place.lat},${place.lon}`, result);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Failed to check weather for ${place.lat},${place.lon}:`, error);
            }
          }
          
          // Re-filter with all places
          const allPlaces = [...allCandidates, ...extendedFiltered];
          const allDryPlaces = allPlaces
            .map((place) => {
              const weatherKey = `${place.lat},${place.lon}`;
              const weather = weatherResults.get(weatherKey);
              if (!weather) return null;
              const dry = isDryToday(weather, true);
              return dry ? {
                place,
                isDryToday: dry,
                rainSummary: weather.summary || "Unknown",
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
            .slice(0, 5);
          
          // Enrich extended places with POI data
          const enrichedExtendedPlaces = await Promise.all(
            allDryPlaces.map(async (item) => {
              const poiData = await enrichPlaceWithPOIs(
                item.place.lat,
                item.place.lon,
                item.place.name,
                geoapifyApiKey
              );
              await new Promise(resolve => setTimeout(resolve, 200));
              return {
                place: {
                  ...item.place,
                  nearbyPOIs: poiData.nearbyPOIs,
                  poiSummary: poiData.poiSummary,
                },
                isDryToday: item.isDryToday,
                rainSummary: item.rainSummary,
              };
            })
          );
          
          if (enrichedExtendedPlaces.length > enrichedPlaces.length) {
            response.recommendations = enrichedExtendedPlaces;
            return NextResponse.json(response);
          }
        }
      }
      // If we searched 50km, extend to 100km
      else if (searchRadius === 50) {
        const extendedRadius = 100;
        console.log(`Only found ${enrichedPlaces.length} dry places in 1-50km, extending search to 50-${extendedRadius}km for more options`);
        const extendedResult = await fetchNearbyPlacesWithSources(
          latitude,
          longitude,
          extendedRadius,
          apiKey
        );
        
        // Filter to only places between 50-100km
        const extendedPlaces = extendedResult.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > 50 && distance <= 100;
        });
        
        if (extendedPlaces.length > 0) {
          // Recalculate distances and filter
        const extendedWithDistance = extendedPlaces.map((place) => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return { ...place, distanceKm: distance };
        });
        
        const extendedFiltered = extendedWithDistance
          .filter((place) => {
            // Distance filter
            if (place.distanceKm <= 1) return false;
            
            // Name-based filter
            if (userLocationName) {
              const placeNameLower = place.name.toLowerCase().trim();
              const userLocationNameLower = userLocationName.toLowerCase().trim();
              
              if (placeNameLower === userLocationNameLower) {
                return false;
              }
              
              if (placeNameLower.includes(userLocationNameLower) || userLocationNameLower.includes(placeNameLower)) {
                if (place.distanceKm < 5) {
                  return false;
                }
              }
            }
            
            return true;
          })
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 50);
        
        // Check weather for additional places (only ones we haven't checked yet)
        const newPlaces = extendedFiltered.filter(
          (place) => !topCandidates.some((c) => c.id === place.id)
        );
        
        if (newPlaces.length > 0) {
          console.log(`Checking weather for ${newPlaces.length} additional places from extended search`);
          for (const place of newPlaces.slice(0, 30)) {
            try {
              const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
              weatherResults.set(`${place.lat},${place.lon}`, result);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Failed to check weather for ${place.lat},${place.lon}:`, error);
            }
          }
          
          // Re-filter with all places
          const allCandidates = [...topCandidates, ...newPlaces];
          const allDryPlaces = allCandidates
            .map((place) => {
              const weatherKey = `${place.lat},${place.lon}`;
              const weather = weatherResults.get(weatherKey);
              if (!weather) return null;
              const dry = isDryToday(weather, true);
              return dry ? {
                place,
                isDryToday: dry,
                rainSummary: weather.summary || "Unknown",
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
            .slice(0, 5);
          
          // Enrich extended places with POI data
          const enrichedExtendedPlaces = await Promise.all(
            allDryPlaces.map(async (item) => {
              const poiData = await enrichPlaceWithPOIs(
                item.place.lat,
                item.place.lon,
                item.place.name,
                geoapifyApiKey
              );
              await new Promise(resolve => setTimeout(resolve, 200));
              return {
                place: {
                  ...item.place,
                  nearbyPOIs: poiData.nearbyPOIs,
                  poiSummary: poiData.poiSummary,
                },
                isDryToday: item.isDryToday,
                rainSummary: item.rainSummary,
              };
            })
          );
          
          // Log extended search result
          await logSearchResult({
            timestamp: new Date().toISOString(),
            location: { lat: latitude, lon: longitude },
            searchRadius: extendedRadius,
            apiSources: extendedResult.apiSources,
            placesFound: extendedPlaces.length,
            dryPlacesFound: enrichedExtendedPlaces.length,
            primarySource: extendedResult.primarySource,
            geoapifyCount: extendedResult.geoapifyCount,
            nominatimCount: extendedResult.nominatimCount,
            opentripmapCount: extendedResult.opentripmapCount,
            fallbackUsed: extendedResult.fallbackUsed,
          });
          
          response.recommendations = enrichedExtendedPlaces;
          return NextResponse.json(response);
        }
      }
      }
    }
    
    // Debug: Log all weather results
    console.log("All weather results:");
    topCandidates.forEach((place) => {
      const weatherKey = `${place.lat},${place.lon}`;
      const weather = weatherResults.get(weatherKey);
      console.log(`  ${place.name} (${weatherKey}): ${weather ? `${weather.summary} (dry: ${isDryToday(weather, true)})` : 'NO DATA'}`);
    });
    
    response.recommendations = enrichedPlaces;

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Recommendations error:", error);
    const errorMessage = error?.message || "Failed to generate recommendations";
    return NextResponse.json(
      { 
        error: "Failed to generate recommendations",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

