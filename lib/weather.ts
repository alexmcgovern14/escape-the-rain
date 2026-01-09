/**
 * Open-Meteo weather API client
 * Documentation: https://open-meteo.com/en/docs
 */

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1";

type OpenMeteoForecastResponse = {
  hourly: {
    time: string[];
    precipitation: number[];
  };
};

export type WeatherCheckResult = {
  isRainingNow: boolean;
  willRainSoon: boolean;
  summary: string;
};

/**
 * Check if it's currently raining at a location
 * Threshold: precipitation > 0.1mm
 * @param hoursAhead - Number of hours to check ahead for rain (default: 4)
 */
export async function checkWeatherAtLocation(
  lat: number,
  lon: number,
  hoursAhead: number = 4
): Promise<WeatherCheckResult> {
  const url = new URL(`${OPEN_METEO_BASE_URL}/forecast`);
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("hourly", "precipitation");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data: OpenMeteoForecastResponse = await response.json();

  // Check current hour (index 0)
  const currentPrecipitation = data.hourly.precipitation[0] || 0;
  const isRainingNow = currentPrecipitation > 0.1;

  // Check next N hours (default 4, but can be configured)
  const hoursToCheck = Math.min(hoursAhead, 24); // Cap at 24 hours
  const nextHours = data.hourly.precipitation.slice(0, hoursToCheck);
  const maxPrecipitation = Math.max(...nextHours);
  const willRainSoon = maxPrecipitation > 0.1;

  // Check full 24-hour forecast to see when rain is expected
  const full24Hours = data.hourly.precipitation.slice(0, 24);
  const firstRainIn24Hours = full24Hours.findIndex((p) => p > 0.1);

  // Generate summary
  let summary = "Dry all day";
  if (isRainingNow) {
    summary = "Raining now";
  } else if (willRainSoon) {
    // Rain expected within the next hoursToCheck hours
    const firstRainIndex = nextHours.findIndex((p) => p > 0.1);
    if (firstRainIndex >= 0) {
      const hoursUntilRain = firstRainIndex;
      summary = `Dry now, rain expected in ${hoursUntilRain} hour${hoursUntilRain !== 1 ? "s" : ""}`;
    }
  } else if (firstRainIn24Hours >= 0) {
    // Dry for next hoursToCheck hours, but rain expected later today
    // Show how many hours until rain
    const hoursUntilRain = firstRainIn24Hours;
    summary = `Dry for next ${hoursUntilRain} hour${hoursUntilRain !== 1 ? "s" : ""}`;
  } else {
    // No rain in next 24 hours
    summary = "Dry all day";
  }

  return {
    isRainingNow,
    willRainSoon,
    summary,
  };
}

/**
 * Bulk check weather for multiple locations
 * Open-Meteo supports multi-point requests
 */
export async function checkWeatherBulk(
  coordinates: Array<{ lat: number; lon: number }>,
  hoursAhead: number = 4
): Promise<Map<string, WeatherCheckResult>> {
  // Open-Meteo allows up to 100 locations per request
  // For simplicity, we'll batch them if needed
  const results = new Map<string, WeatherCheckResult>();

  // Process in batches of 50 to be safe
  const batchSize = 50;
  for (let i = 0; i < coordinates.length; i += batchSize) {
    const batch = coordinates.slice(i, i + batchSize);
    
    // Build multi-point URL
    const url = new URL(`${OPEN_METEO_BASE_URL}/forecast`);
    url.searchParams.set("latitude", batch.map((c) => c.lat.toString()).join(","));
    url.searchParams.set("longitude", batch.map((c) => c.lon.toString()).join(","));
    url.searchParams.set("hourly", "precipitation");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.log(`Bulk weather request failed (${response.status}), falling back to individual requests`);
      // If bulk fails, fall back to individual requests
      for (const coord of batch) {
        try {
          const result = await checkWeatherAtLocation(coord.lat, coord.lon);
          results.set(`${coord.lat},${coord.lon}`, result);
        } catch (error) {
          console.error(`Failed to check weather for ${coord.lat},${coord.lon}:`, error);
        }
      }
      continue;
    }

    const data = await response.json();
    
    // Open-Meteo returns an array of objects when multiple coordinates are provided
    // Each object has: { latitude, longitude, hourly: { time: [], precipitation: [] } }
    const weatherData = Array.isArray(data) ? data : [data];
    
    console.log(`Bulk weather response: ${weatherData.length} locations, batch size: ${batch.length}`);
    
      // If we didn't get the expected number of results, fall back to individual requests
    if (weatherData.length !== batch.length) {
      console.log(`Mismatch in weather data count, falling back to individual requests`);
      const defaultHours = 4; // Default for bulk fallback
      for (const coord of batch) {
        try {
          const result = await checkWeatherAtLocation(coord.lat, coord.lon, defaultHours);
          results.set(`${coord.lat},${coord.lon}`, result);
        } catch (error) {
          console.error(`Failed to check weather for ${coord.lat},${coord.lon}:`, error);
        }
      }
      continue;
    }
    
    // Match response data with our batch coordinates (order should match)
    weatherData.forEach((locationData: any, index: number) => {
      if (index >= batch.length) {
        console.log(`Weather data index ${index} exceeds batch size ${batch.length}`);
        return;
      }
      if (!locationData.hourly || !locationData.hourly.precipitation) {
        console.log(`No hourly data for index ${index}`);
        return;
      }

      const coord = batch[index];
      const precipitation = locationData.hourly.precipitation;
      
      if (!Array.isArray(precipitation) || precipitation.length === 0) {
        console.log(`Invalid precipitation data for ${coord.lat},${coord.lon}`);
        return;
      }

      const currentPrecipitation = precipitation[0] || 0;
      const isRainingNow = currentPrecipitation > 0.1;

      // Use provided hoursAhead parameter
      const hoursToCheck = Math.min(hoursAhead, 24);
      const nextHours = precipitation.slice(0, hoursToCheck);
      const maxPrecipitation = Math.max(...nextHours, 0);
      const willRainSoon = maxPrecipitation > 0.1;

      // Check full 24-hour forecast to see when rain is expected
      const full24Hours = precipitation.slice(0, 24);
      const firstRainIn24Hours = full24Hours.findIndex((p) => p > 0.1);

      let summary = "Dry all day";
      if (isRainingNow) {
        summary = "Raining now";
      } else if (willRainSoon) {
        // Rain expected within the next hoursToCheck hours
        const firstRainIndex = nextHours.findIndex((p) => p > 0.1);
        if (firstRainIndex >= 0) {
          const hoursUntilRain = firstRainIndex;
          summary = `Dry now, rain expected in ${hoursUntilRain} hour${hoursUntilRain !== 1 ? "s" : ""}`;
        }
      } else if (firstRainIn24Hours >= 0) {
        // Dry for next hoursToCheck hours, but rain expected later today
        // Show how many hours until rain
        const hoursUntilRain = firstRainIn24Hours;
        summary = `Dry for next ${hoursUntilRain} hour${hoursUntilRain !== 1 ? "s" : ""}`;
      } else {
        // No rain in next 24 hours
        summary = "Dry all day";
      }

      const key = `${coord.lat},${coord.lon}`;
      console.log(`Weather for ${key}: ${summary} (now: ${isRainingNow}, soon: ${willRainSoon})`);
      
      // Use the original coordinates from our batch to ensure exact matching
      results.set(key, {
        isRainingNow,
        willRainSoon,
        summary,
      });
    });
  }

  return results;
}

/**
 * Check if a location is dry (not raining now and won't rain in the specified time window)
 * @param weather - Weather check result
 * @param strict - If true, requires both "not raining now" AND "won't rain soon". If false, only checks "not raining now"
 */
export function isDryToday(weather: WeatherCheckResult, strict: boolean = true): boolean {
  if (strict) {
    // Strict mode: must not be raining now AND must not rain soon
    return !weather.isRainingNow && !weather.willRainSoon;
  } else {
    // Relaxed mode: only check if not currently raining
    return !weather.isRainingNow;
  }
}

