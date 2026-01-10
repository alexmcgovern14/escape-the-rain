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
import type { RecommendationResponse, Place } from "@/lib/types";

/**
 * Check if a place is a duplicate of any existing places
 * Checks by ID, name (case-insensitive), or close distance (< 5km)
 */
function isDuplicatePlace(place: Place, existingPlaces: Place[]): boolean {
  return existingPlaces.some(existing => {
    // Same ID
    if (existing.id === place.id) return true;
    // Same name (case-insensitive) and very close (< 5km apart) - likely the same place
    const nameMatch = existing.name.toLowerCase().trim() === place.name.toLowerCase().trim();
    if (nameMatch) {
      const distanceBetween = haversineDistance(existing.lat, existing.lon, place.lat, place.lon);
      if (distanceBetween < 5) return true; // Same place at slightly different coordinates
    }
    return false;
  });
}

export async function GET(request: NextRequest) {
  // Log request start for debugging
  console.log(`[REQUEST START] ${new Date().toISOString()} - Recommendations API called`);
  
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
  
  console.log(`[REQUEST PARAMS] lat=${lat}, lon=${lon}, source=${source}, strictHours=${strictHours}, searchDistance=${searchDistanceParam || "auto"}`);

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
    // Track failed APIs to avoid retrying in same request
    const failedApis = new Set<"nominatim" | "opentripmap">();
    
    let candidatePlaces: any[] = [];
    let searchRadius: number;
    let placesResult: Awaited<ReturnType<typeof fetchNearbyPlacesWithSources>> | null = null;
    
    if (useAutoSearch) {
      // Auto logic: fetch all distances in parallel, but prioritize closer results
      // This ensures we check nearby places first while being fast
      searchRadius = 50;
      try {
        // Fetch 10km, 25km, and 50km in parallel for speed
        const [result10km, result25km, result50km] = await Promise.all([
          fetchNearbyPlacesWithSources(latitude, longitude, 10, apiKey, failedApis),
          fetchNearbyPlacesWithSources(latitude, longitude, 25, apiKey, failedApis),
          fetchNearbyPlacesWithSources(latitude, longitude, 50, apiKey, failedApis),
        ]);
        
        // Filter and prioritize closer places: start with 10km, then add 25km, then 50km
        const places10km = result10km.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > 1 && distance <= 10;
        });
        
        const places25km = result25km.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > 10 && distance <= 25;
        });
        
        const places50km = result50km.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > 25 && distance <= 50;
        });
        
        // Combine: prioritize closer places (10km first, then 25km, then 50km)
        candidatePlaces = [...places10km, ...places25km, ...places50km];
        
        // Use the result with the most places for metadata (prefer successful results)
        // This ensures correct logging of API sources
        if (result10km.places.length > 0 || result25km.places.length > 0 || result50km.places.length > 0) {
          // Prefer 25km result (usually has good coverage), fallback to 10km, then 50km
          placesResult = result25km.places.length > 0 ? result25km : 
                        (result10km.places.length > 0 ? result10km : result50km);
        } else {
          // All failed, use 50km result (will show fallback)
          placesResult = result50km;
        }
        searchRadius = 50;
        
        console.log(`[AUTO] Found ${places10km.length} places in 1-10km, ${places25km.length} in 10-25km, ${places50km.length} in 25-50km (total: ${candidatePlaces.length})`);
        
        // If we still have very few places (< 5), extend to 100km
        if (candidatePlaces.length < 5) {
          const finalRadius = 100;
          console.log(`[AUTO] Only ${candidatePlaces.length} places found in 1-50km, extending to 50-100km`);
          const finalResult = await fetchNearbyPlacesWithSources(
            latitude,
            longitude,
            finalRadius,
            apiKey,
            failedApis
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
          apiKey,
          failedApis
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
            apiKey,
            failedApis
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
    // Use bulk weather API to avoid rate limiting - single API call for all locations
    const weatherResults = await checkWeatherBulk(coordinates, strictHours);
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

    // Step 6: Return results immediately without POI enrichment for speed
    // POI enrichment can be done client-side or in a separate request if needed
    // This saves 8-10 seconds on the initial response
    console.log(`Returning ${dryPlaces.length} dry places (POI enrichment skipped for performance)`);
    const enrichedPlaces = dryPlaces.map((item) => {
      return {
        place: {
          ...item.place,
          // Don't set nearbyPOIs/poiSummary initially - they'll be undefined
          // This allows the frontend to distinguish between "not enriched yet" and "enriched but empty"
        },
        isDryToday: item.isDryToday,
        rainSummary: item.rainSummary,
        weatherCode: item.weather?.weatherCode,
      };
    });

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
    // Early exit: If we already have 5+ dry places, skip extended search
    if (enrichedPlaces.length >= 5) {
      console.log(`[EXTENDED SEARCH] Skipping - already found ${enrichedPlaces.length} dry places (target: 5)`);
    } else if (enrichedPlaces.length < 5 && useAutoSearch) {
      console.log(`[EXTENDED SEARCH] Triggered: Found ${enrichedPlaces.length} dry places, current searchRadius=${searchRadius}, useAutoSearch=${useAutoSearch}`);
      // Determine which tier we're at and extend from there
      // If we only searched 10km, extend to 25km
      if (searchRadius <= 10) {
        console.log(`[EXTENDED SEARCH] Entering searchRadius <= 10 block`);
        const extendedRadius = 25;
        console.log(`Only found ${enrichedPlaces.length} dry places in 1-10km, extending search to 10-${extendedRadius}km for more options`);
        const extendedResult = await fetchNearbyPlacesWithSources(
          latitude,
          longitude,
          extendedRadius,
          apiKey
        );
        
        // Filter to only places between 10-25km
        const extendedPlaces = extendedResult.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > 10 && distance <= 25;
        });
        
        let extendedFiltered: typeof topCandidates = [];
        let enrichedExtendedPlaces = enrichedPlaces;
        
        if (extendedPlaces.length > 0) {
          // Merge with existing candidates
          const allCandidates = [...topCandidates];
          const extendedWithDistance = extendedPlaces.map((place) => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return { ...place, distanceKm: distance };
          });
          
          extendedFiltered = extendedWithDistance
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
              if (isDuplicatePlace(place, allCandidates)) {
                return false;
              }
              
              return true;
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 50);
          
          console.log(`[EXTENDED SEARCH] Filtered ${extendedWithDistance.length} places to ${extendedFiltered.length} after name/distance filtering`);
          // Check weather for additional places in parallel
          console.log(`[EXTENDED SEARCH] Checking weather for ${extendedFiltered.length} additional places from 10-25km range`);
          const extendedWeatherPromises = extendedFiltered.map(async (place) => {
            try {
              console.log(`[EXTENDED SEARCH] Checking weather for ${place.name} at ${place.lat},${place.lon}`);
              const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
              console.log(`[EXTENDED SEARCH] ${place.name}: ${result.summary} (dry: ${isDryToday(result, true)})`);
              return { place, weather: result, error: null };
            } catch (error) {
              console.error(`[EXTENDED SEARCH] Failed to check weather for ${place.name} (${place.lat},${place.lon}):`, error);
              return { place, weather: null, error };
            }
          });
          const extendedWeatherResults = await Promise.all(extendedWeatherPromises);
          for (const { place, weather } of extendedWeatherResults) {
            if (weather) {
              weatherResults.set(`${place.lat},${place.lon}`, weather);
            }
          }
          console.log(`[EXTENDED SEARCH] Weather check complete. Total weather results: ${weatherResults.size}`);
          
          // Re-filter with all places
          const allPlaces = [...topCandidates, ...extendedFiltered];
          console.log(`[EXTENDED SEARCH] Re-filtering ${allPlaces.length} total places (${topCandidates.length} original + ${extendedFiltered.length} extended)`);
          const allDryPlaces = allPlaces
            .map((place) => {
              const weatherKey = `${place.lat},${place.lon}`;
              const weather = weatherResults.get(weatherKey);
              if (!weather) {
                console.log(`[EXTENDED SEARCH] No weather data for ${place.name} (${weatherKey})`);
                return null;
              }
              const dry = isDryToday(weather, true);
              if (dry) {
                console.log(`[EXTENDED SEARCH] ${place.name}: DRY - ${weather.summary}`);
              }
              return dry ? {
                place,
                isDryToday: dry,
                rainSummary: weather.summary || "Unknown",
                weather,
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            // Deduplicate by name and distance before sorting
            .filter((item, index, array) => {
              return !array.slice(0, index).some(prev => isDuplicatePlace(item.place, [prev.place]));
            })
            .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
            .slice(0, 5);
          console.log(`[EXTENDED SEARCH] Found ${allDryPlaces.length} total dry places after extended search`);
          
          // Enrich extended places with POI data
          enrichedExtendedPlaces = await Promise.all(
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
                weatherCode: item.weather?.weatherCode,
              };
            })
          );
          
          // Always update recommendations with the latest results
          response.recommendations = enrichedExtendedPlaces;
          console.log(`[EXTENDED SEARCH] Updated recommendations: ${enrichedExtendedPlaces.length} places`);
          
          // If we have 5 places, return early
          if (enrichedExtendedPlaces.length >= 5) {
            return NextResponse.json(response);
          }
        }
        
        // If we still don't have 5 places after 10-25km search, extend to 25-50km
        console.log(`[EXTENDED SEARCH] After 10-25km search, have ${enrichedExtendedPlaces.length} places. Extending to 25-50km...`);
        if (enrichedExtendedPlaces.length < 5) {
          const extendedRadius = 50;
          console.log(`[EXTENDED SEARCH] Extending search to 25-${extendedRadius}km for more options`);
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
        
        let extendedFiltered: typeof topCandidates = [];
        let enrichedExtendedPlaces = enrichedPlaces;
        
        if (extendedPlaces.length > 0) {
          // Merge with existing candidates
          const allCandidates = [...topCandidates];
          const extendedWithDistance = extendedPlaces.map((place) => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return { ...place, distanceKm: distance };
          });
          
          extendedFiltered = extendedWithDistance
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
              if (isDuplicatePlace(place, allCandidates)) {
                return false;
              }
              
              return true;
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 50); // Increased from 30 to 50 to check more places
          
          console.log(`[EXTENDED SEARCH] Filtered ${extendedWithDistance.length} places to ${extendedFiltered.length} after name/distance filtering`);
          // Check weather for additional places
          console.log(`[EXTENDED SEARCH] Checking weather for ${extendedFiltered.length} additional places from 25-50km range`);
          for (const place of extendedFiltered) {
            try {
              console.log(`[EXTENDED SEARCH] Checking weather for ${place.name} at ${place.lat},${place.lon}`);
              const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
              weatherResults.set(`${place.lat},${place.lon}`, result);
              console.log(`[EXTENDED SEARCH] ${place.name}: ${result.summary} (dry: ${isDryToday(result, true)})`);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`[EXTENDED SEARCH] Failed to check weather for ${place.name} (${place.lat},${place.lon}):`, error);
            }
          }
          console.log(`[EXTENDED SEARCH] Weather check complete. Total weather results: ${weatherResults.size}`);
          
          // Re-filter with all places
          const allPlaces = [...topCandidates, ...extendedFiltered];
          console.log(`[EXTENDED SEARCH] Re-filtering ${allPlaces.length} total places (${topCandidates.length} original + ${extendedFiltered.length} extended)`);
          const allDryPlaces = allPlaces
            .map((place) => {
              const weatherKey = `${place.lat},${place.lon}`;
              const weather = weatherResults.get(weatherKey);
              if (!weather) {
                console.log(`[EXTENDED SEARCH] No weather data for ${place.name} (${weatherKey})`);
                return null;
              }
              const dry = isDryToday(weather, true);
              if (dry) {
                console.log(`[EXTENDED SEARCH] ${place.name}: DRY - ${weather.summary}`);
              }
              return dry ? {
                place,
                isDryToday: dry,
                rainSummary: weather.summary || "Unknown",
                weather,
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            // Deduplicate by name and distance before sorting
            .filter((item, index, array) => {
              return !array.slice(0, index).some(prev => isDuplicatePlace(item.place, [prev.place]));
            })
            .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
            .slice(0, 5);
          console.log(`[EXTENDED SEARCH] Found ${allDryPlaces.length} total dry places after extended search`);
          
          // Enrich extended places with POI data
          enrichedExtendedPlaces = await Promise.all(
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
                weatherCode: item.weather?.weatherCode,
              };
            })
          );
          
          // Always update recommendations with the latest results
          response.recommendations = enrichedExtendedPlaces;
          console.log(`[EXTENDED SEARCH] Updated recommendations: ${enrichedExtendedPlaces.length} places`);
          
          // If we have 5 places, return early
          if (enrichedExtendedPlaces.length >= 5) {
            return NextResponse.json(response);
          }
        }
        
          // If we still don't have 5 places after 25-50km search, extend to 50-100km
          console.log(`[EXTENDED SEARCH] After 25-50km search, have ${enrichedExtendedPlaces.length} places. Extending to 50-100km...`);
          if (enrichedExtendedPlaces.length < 5) {
            const finalRadius = 100;
            console.log(`[EXTENDED SEARCH] Extending search to 50-${finalRadius}km for more options`);
          const finalExtendedResult = await fetchNearbyPlacesWithSources(
            latitude,
            longitude,
            finalRadius,
            apiKey,
            failedApis
          );
          
          // Filter to only places between 50-100km
          const finalExtendedPlaces = finalExtendedResult.places.filter(place => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return distance > 50 && distance <= 100;
          });
          
          if (finalExtendedPlaces.length > 0) {
            const finalWithDistance = finalExtendedPlaces.map((place) => {
              const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
              return { ...place, distanceKm: distance };
            });
            
            const finalFiltered = finalWithDistance
              .filter((place) => {
                if (place.distanceKm <= 1) return false;
                
                if (userLocationName) {
                  const placeNameLower = place.name.toLowerCase().trim();
                  const userLocationNameLower = userLocationName.toLowerCase().trim();
                  
                  if (placeNameLower === userLocationNameLower) return false;
                  
                  if (placeNameLower.includes(userLocationNameLower) || userLocationNameLower.includes(placeNameLower)) {
                    if (place.distanceKm < 5) return false;
                  }
                }
                
                // Don't duplicate existing candidates
                const allExistingPlaces = [...topCandidates, ...extendedFiltered];
                if (isDuplicatePlace(place, allExistingPlaces)) return false;
                
                return true;
              })
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .slice(0, 50); // Increased from 30 to 50 to check more places
            
            console.log(`[EXTENDED SEARCH] Filtered ${finalWithDistance.length} places to ${finalFiltered.length} after name/distance filtering (50-100km)`);
            console.log(`[EXTENDED SEARCH] Checking weather for ${finalFiltered.length} additional places from 50-100km range`);
            const finalWeatherPromises = finalFiltered.map(async (place) => {
              try {
                const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
                console.log(`[EXTENDED SEARCH] ${place.name}: ${result.summary} (dry: ${isDryToday(result, true)})`);
                return { place, weather: result, error: null };
              } catch (error) {
                console.error(`[EXTENDED SEARCH] Failed to check weather for ${place.name}:`, error);
                return { place, weather: null, error };
              }
            });
            const finalWeatherResults = await Promise.all(finalWeatherPromises);
            for (const { place, weather } of finalWeatherResults) {
              if (weather) {
                weatherResults.set(`${place.lat},${place.lon}`, weather);
              }
            }
            
            // Re-filter with all places including final extended
            const allFinalPlaces = [...topCandidates, ...(extendedFiltered || []), ...finalFiltered];
            const allFinalDryPlaces = allFinalPlaces
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
            
            console.log(`[EXTENDED SEARCH] Found ${allFinalDryPlaces.length} total dry places after 50-100km search`);
            
            // Enrich final places with POI data
            const enrichedFinalPlaces = await Promise.all(
              allFinalDryPlaces.map(async (item) => {
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
            
            // Always update recommendations with the latest results (even if same count, they might be different places)
            if (enrichedFinalPlaces.length >= enrichedExtendedPlaces.length) {
              response.recommendations = enrichedFinalPlaces;
              console.log(`[EXTENDED SEARCH] Updated recommendations with 50-100km results: ${enrichedFinalPlaces.length} places`);
              return NextResponse.json(response);
            } else {
              // Keep the 25-50km results if they're better
              response.recommendations = enrichedExtendedPlaces;
              console.log(`[EXTENDED SEARCH] Keeping 25-50km results (${enrichedExtendedPlaces.length} places) as they're better than 50-100km results`);
              return NextResponse.json(response);
            }
          }
        }
          }
        }
      }
      // If we searched 25km, extend to 50km
      else if (searchRadius === 25) {
        console.log(`[EXTENDED SEARCH] Entering searchRadius === 25 block`);
        const extendedRadius = 50;
        console.log(`[EXTENDED SEARCH] Only found ${enrichedPlaces.length} dry places in 1-25km, extending search to 25-${extendedRadius}km for more options`);
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
        
        let extendedFiltered: typeof topCandidates = [];
        let enrichedExtendedPlaces = enrichedPlaces;
        
        if (extendedPlaces.length > 0) {
          // Merge with existing candidates
          const allCandidates = [...topCandidates];
          const extendedWithDistance = extendedPlaces.map((place) => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return { ...place, distanceKm: distance };
          });
          
          extendedFiltered = extendedWithDistance
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
              if (isDuplicatePlace(place, allCandidates)) {
                return false;
              }
              
              return true;
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 50);
          
          console.log(`[EXTENDED SEARCH] Filtered ${extendedWithDistance.length} places to ${extendedFiltered.length} after name/distance filtering`);
          // Check weather for additional places
          console.log(`[EXTENDED SEARCH] Checking weather for ${extendedFiltered.length} additional places from 25-50km range`);
          for (const place of extendedFiltered) {
            try {
              console.log(`[EXTENDED SEARCH] Checking weather for ${place.name} at ${place.lat},${place.lon}`);
              const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
              weatherResults.set(`${place.lat},${place.lon}`, result);
              console.log(`[EXTENDED SEARCH] ${place.name}: ${result.summary} (dry: ${isDryToday(result, true)})`);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`[EXTENDED SEARCH] Failed to check weather for ${place.name} (${place.lat},${place.lon}):`, error);
            }
          }
          console.log(`[EXTENDED SEARCH] Weather check complete. Total weather results: ${weatherResults.size}`);
          
          // Re-filter with all places
          const allPlaces = [...topCandidates, ...extendedFiltered];
          console.log(`[EXTENDED SEARCH] Re-filtering ${allPlaces.length} total places (${topCandidates.length} original + ${extendedFiltered.length} extended)`);
          const allDryPlaces = allPlaces
            .map((place) => {
              const weatherKey = `${place.lat},${place.lon}`;
              const weather = weatherResults.get(weatherKey);
              if (!weather) {
                console.log(`[EXTENDED SEARCH] No weather data for ${place.name} (${weatherKey})`);
                return null;
              }
              const dry = isDryToday(weather, true);
              if (dry) {
                console.log(`[EXTENDED SEARCH] ${place.name}: DRY - ${weather.summary}`);
              }
              return dry ? {
                place,
                isDryToday: dry,
                rainSummary: weather.summary || "Unknown",
                weather,
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            // Deduplicate by name and distance before sorting
            .filter((item, index, array) => {
              return !array.slice(0, index).some(prev => isDuplicatePlace(item.place, [prev.place]));
            })
            .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
            .slice(0, 5);
          console.log(`[EXTENDED SEARCH] Found ${allDryPlaces.length} total dry places after extended search`);
          
          // Enrich extended places with POI data
          enrichedExtendedPlaces = await Promise.all(
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
                weatherCode: item.weather?.weatherCode,
              };
            })
          );
          
          // Always update recommendations with the latest results
          response.recommendations = enrichedExtendedPlaces;
          console.log(`[EXTENDED SEARCH] Updated recommendations: ${enrichedExtendedPlaces.length} places`);
          
          // If we have 5 places, return early
          if (enrichedExtendedPlaces.length >= 5) {
            return NextResponse.json(response);
          }
        }
        
        // If we still don't have 5 places after 25-50km search, extend to 50-100km
        console.log(`[EXTENDED SEARCH] After 25-50km search, have ${enrichedExtendedPlaces.length} places. Extending to 50-100km...`);
        if (enrichedExtendedPlaces.length < 5) {
          const finalRadius = 100;
          console.log(`[EXTENDED SEARCH] Extending search to 50-${finalRadius}km for more options`);
          const finalExtendedResult = await fetchNearbyPlacesWithSources(
            latitude,
            longitude,
            finalRadius,
            apiKey,
            failedApis
          );
          
          // Filter to only places between 50-100km
          const finalExtendedPlaces = finalExtendedResult.places.filter(place => {
            const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
            return distance > 50 && distance <= 100;
          });
          
          if (finalExtendedPlaces.length > 0) {
            const finalWithDistance = finalExtendedPlaces.map((place) => {
              const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
              return { ...place, distanceKm: distance };
            });
            
            const finalFiltered = finalWithDistance
              .filter((place) => {
                if (place.distanceKm <= 1) return false;
                
                if (userLocationName) {
                  const placeNameLower = place.name.toLowerCase().trim();
                  const userLocationNameLower = userLocationName.toLowerCase().trim();
                  
                  if (placeNameLower === userLocationNameLower) return false;
                  
                  if (placeNameLower.includes(userLocationNameLower) || userLocationNameLower.includes(placeNameLower)) {
                    if (place.distanceKm < 5) return false;
                  }
                }
                
                // Don't duplicate existing candidates
                const allExistingPlaces = [...topCandidates, ...extendedFiltered];
                if (isDuplicatePlace(place, allExistingPlaces)) return false;
                
                return true;
              })
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .slice(0, 50);
            
            console.log(`[EXTENDED SEARCH] Filtered ${finalWithDistance.length} places to ${finalFiltered.length} after name/distance filtering (50-100km)`);
            console.log(`[EXTENDED SEARCH] Checking weather for ${finalFiltered.length} additional places from 50-100km range`);
            const finalWeatherPromises = finalFiltered.map(async (place) => {
              try {
                const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
                console.log(`[EXTENDED SEARCH] ${place.name}: ${result.summary} (dry: ${isDryToday(result, true)})`);
                return { place, weather: result, error: null };
              } catch (error) {
                console.error(`[EXTENDED SEARCH] Failed to check weather for ${place.name}:`, error);
                return { place, weather: null, error };
              }
            });
            const finalWeatherResults = await Promise.all(finalWeatherPromises);
            for (const { place, weather } of finalWeatherResults) {
              if (weather) {
                weatherResults.set(`${place.lat},${place.lon}`, weather);
              }
            }
            
            // Re-filter with all places including final extended
            const allFinalPlaces = [...topCandidates, ...(extendedFiltered || []), ...finalFiltered];
            const allFinalDryPlaces = allFinalPlaces
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
            
            console.log(`[EXTENDED SEARCH] Found ${allFinalDryPlaces.length} total dry places after 50-100km search`);
            
            // Enrich final places with POI data
            const enrichedFinalPlaces = await Promise.all(
              allFinalDryPlaces.map(async (item) => {
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
            
            // Always update recommendations with the latest results (even if same count, they might be different places)
            if (enrichedFinalPlaces.length >= enrichedExtendedPlaces.length) {
              response.recommendations = enrichedFinalPlaces;
              console.log(`[EXTENDED SEARCH] Updated recommendations with 50-100km results: ${enrichedFinalPlaces.length} places`);
              return NextResponse.json(response);
            } else {
              // Keep the 25-50km results if they're better
              response.recommendations = enrichedExtendedPlaces;
              console.log(`[EXTENDED SEARCH] Keeping 25-50km results (${enrichedExtendedPlaces.length} places) as they're better than 50-100km results`);
              return NextResponse.json(response);
            }
          }
        }
      }
      // If we searched 50km, extend to 100km
      else if (searchRadius === 50) {
        console.log(`[EXTENDED SEARCH] Entering searchRadius === 50 block`);
        const extendedRadius = 100;
        const minDistance = 50;
        const maxDistance = 100;
        console.log(`[EXTENDED SEARCH] Only found ${enrichedPlaces.length} dry places in 1-${searchRadius}km, extending search to ${minDistance}-${maxDistance}km for more options`);
        const extendedResult = await fetchNearbyPlacesWithSources(
          latitude,
          longitude,
          extendedRadius,
          apiKey
        );
        
        // Filter to only places in the extended range
        const extendedPlaces = extendedResult.places.filter(place => {
          const distance = haversineDistance(latitude, longitude, place.lat, place.lon);
          return distance > minDistance && distance <= maxDistance;
        });
        
        console.log(`[EXTENDED SEARCH] Found ${extendedPlaces.length} places in ${minDistance}-${maxDistance}km range`);
        
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
            
            // Don't duplicate existing candidates
            if (isDuplicatePlace(place, topCandidates)) {
              return false;
            }
            
            return true;
          })
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 50);
        
        // Check weather for additional places (only ones we haven't checked yet)
        const newPlaces = extendedFiltered.filter(
          (place) => !topCandidates.some((c) => c.id === place.id) && !weatherResults.has(`${place.lat},${place.lon}`)
        );
        
        console.log(`[EXTENDED SEARCH] Found ${newPlaces.length} new places to check weather for (out of ${extendedFiltered.length} filtered places)`);
        
        if (newPlaces.length > 0) {
          console.log(`[EXTENDED SEARCH] Checking weather for ${Math.min(newPlaces.length, 50)} additional places from ${minDistance}-${maxDistance}km range`);
          const newPlacesWeatherPromises = newPlaces.slice(0, 50).map(async (place) => {
            try {
              console.log(`[EXTENDED SEARCH] Checking weather for ${place.name} at ${place.lat},${place.lon}`);
              const result = await checkWeatherAtLocation(place.lat, place.lon, strictHours);
              console.log(`[EXTENDED SEARCH] ${place.name}: ${result.summary} (dry: ${isDryToday(result, true)})`);
              return { place, weather: result, error: null };
            } catch (error) {
              console.error(`[EXTENDED SEARCH] Failed to check weather for ${place.name} (${place.lat},${place.lon}):`, error);
              return { place, weather: null, error };
            }
          });
          const newPlacesWeatherResults = await Promise.all(newPlacesWeatherPromises);
          for (const { place, weather } of newPlacesWeatherResults) {
            if (weather) {
              weatherResults.set(`${place.lat},${place.lon}`, weather);
            }
          }
          
          // Re-filter with ALL places (original + extended), including ones we already checked
          const allCandidates = [...topCandidates, ...extendedFiltered];
          console.log(`[EXTENDED SEARCH] Re-filtering ${allCandidates.length} total places (${topCandidates.length} original + ${extendedFiltered.length} extended)`);
          const allDryPlaces = allCandidates
            .map((place) => {
              const weatherKey = `${place.lat},${place.lon}`;
              const weather = weatherResults.get(weatherKey);
              if (!weather) {
                console.log(`[EXTENDED SEARCH] No weather data for ${place.name} (${weatherKey})`);
                return null;
              }
              const dry = isDryToday(weather, true);
              if (dry) {
                console.log(`[EXTENDED SEARCH] ${place.name}: DRY - ${weather.summary}`);
              }
              return dry ? {
                place,
                isDryToday: dry,
                rainSummary: weather.summary || "Unknown",
                weather,
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            // Deduplicate by name and distance before sorting
            .filter((item, index, array) => {
              return !array.slice(0, index).some(prev => isDuplicatePlace(item.place, [prev.place]));
            })
            .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
            .slice(0, 5);
          
          console.log(`[EXTENDED SEARCH] Found ${allDryPlaces.length} total dry places after ${minDistance}-${maxDistance}km search`);
          
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
                weatherCode: item.weather?.weatherCode,
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
        } else {
          console.log(`[EXTENDED SEARCH] No places found in ${minDistance}-${maxDistance}km range, cannot extend search`);
        }
      } else {
        console.log(`[EXTENDED SEARCH] searchRadius=${searchRadius} does not match any extended search condition (10, 25, or 50)`);
      }
    } else {
      console.log(`[EXTENDED SEARCH] Not triggered: enrichedPlaces.length=${enrichedPlaces.length}, useAutoSearch=${useAutoSearch}`);
    }
    
    // Debug: Log all weather results
    console.log("All weather results:");
    topCandidates.forEach((place) => {
      const weatherKey = `${place.lat},${place.lon}`;
      const weather = weatherResults.get(weatherKey);
      console.log(`  ${place.name} (${weatherKey}): ${weather ? `${weather.summary} (dry: ${isDryToday(weather, true)})` : 'NO DATA'}`);
    });
    
    response.recommendations = enrichedPlaces;
    
    // If no dry places found, add error message with furthest distance checked
    if (enrichedPlaces.length === 0 && topCandidates.length > 0) {
      // Find the furthest place that was checked for weather
      const furthestPlace = topCandidates.reduce((furthest, current) => {
        return current.distanceKm > furthest.distanceKm ? current : furthest;
      }, topCandidates[0]);
      
      // Round to nearest km for display
      const furthestDistanceKm = Math.round(furthestPlace.distanceKm);
      response.error = `No dry places within ${furthestDistanceKm}km!`;
      console.log(`[ERROR] ${response.error} (checked ${topCandidates.length} places, furthest: ${furthestPlace.name} at ${furthestPlace.distanceKm.toFixed(1)}km)`);
    }

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

