/**
 * Open-Meteo weather API client
 * Documentation: https://open-meteo.com/en/docs
 */

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1";

type OpenMeteoForecastResponse = {
  hourly: {
    time: string[];
    precipitation: number[];
    weathercode?: number[]; // WMO weather code (0-99)
  };
};

export type WeatherCheckResult = {
  isRainingNow: boolean;
  willRainSoon: boolean;
  summary: string;
  weatherCode?: number; // WMO weather code for current hour
};

/**
 * Get weather icon type based on WMO weather code
 * WMO codes: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */
export function getWeatherIconFromCode(weatherCode?: number): 'sun' | 'cloud-sun' | 'cloud' | 'cloud-rain' | 'cloud-fog' | 'wind' | 'snowflake' | 'cloud-drizzle' {
  if (weatherCode === undefined) return 'cloud-sun'; // Default fallback
  
  // WMO Weather Code mapping:
  // 0: Clear sky -> sun
  // 1-3: Mainly clear, partly cloudy, overcast -> cloud-sun or cloud
  // 45-48: Fog and depositing rime fog -> cloud-fog
  // 51-55: Drizzle -> cloud-drizzle
  // 56-57: Freezing drizzle -> cloud-drizzle
  // 61-65: Rain -> cloud-rain
  // 66-67: Freezing rain -> cloud-rain
  // 71-77: Snow -> snowflake
  // 80-82: Rain showers -> cloud-rain
  // 85-86: Snow showers -> snowflake
  // 95: Thunderstorm -> cloud-rain
  // 96-99: Thunderstorm with hail -> cloud-rain
  
  if (weatherCode === 0) {
    return 'sun'; // Clear sky
  } else if (weatherCode >= 1 && weatherCode <= 3) {
    return 'cloud-sun'; // Mainly clear, partly cloudy, overcast
  } else if (weatherCode >= 45 && weatherCode <= 48) {
    return 'cloud-fog'; // Fog
  } else if (weatherCode >= 51 && weatherCode <= 57) {
    return 'cloud-drizzle'; // Drizzle
  } else if (weatherCode >= 61 && weatherCode <= 67) {
    return 'cloud-rain'; // Rain
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    return 'snowflake'; // Snow
  } else if (weatherCode >= 80 && weatherCode <= 82) {
    return 'cloud-rain'; // Rain showers
  } else if (weatherCode >= 85 && weatherCode <= 86) {
    return 'snowflake'; // Snow showers
  } else if (weatherCode >= 95 && weatherCode <= 99) {
    return 'cloud-rain'; // Thunderstorm
  }
  
  // Default fallback
  return 'cloud-sun';
}

export type UserWeatherStatus = {
  status: 'rain-hours' | 'dry-until' | 'rain-all-day' | 'dry-all-day';
  hours?: number; // For 'rain-hours': number of hours of rain
  time?: string; // For 'dry-until': time when rain starts (e.g., "2:00 PM")
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

  // Get current weather code for icon
  const currentWeatherCode = data.hourly.weathercode?.[0];

  return {
    isRainingNow,
    willRainSoon,
    summary,
    weatherCode: currentWeatherCode,
  };
}

/**
 * Get detailed weather status for user location header display
 * Returns formatted status for: "Rain for next X hours", "Rain at X PM", "Rain all day", "Dry all day"
 */
export async function getUserWeatherStatus(
  lat: number,
  lon: number
): Promise<UserWeatherStatus> {
  const url = new URL(`${OPEN_METEO_BASE_URL}/forecast`);
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("hourly", "precipitation,weathercode");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data: OpenMeteoForecastResponse = await response.json();
  const precipitation = data.hourly.precipitation;
  const times = data.hourly.time;

  // Check current hour (index 0)
  const currentPrecipitation = precipitation[0] || 0;
  const isRainingNow = currentPrecipitation > 0.1;

  // Check all 24 hours
  const full24Hours = precipitation.slice(0, 24);
  const hasRainIn24Hours = full24Hours.some((p) => p > 0.1);
  const allHoursHaveRain = full24Hours.every((p) => p > 0.1);

  // If raining now
  if (isRainingNow) {
    // Count consecutive hours of rain from now
    let consecutiveRainHours = 1;
    for (let i = 1; i < 24; i++) {
      if (precipitation[i] > 0.1) {
        consecutiveRainHours++;
      } else {
        break;
      }
    }

    // If it's raining all day
    if (allHoursHaveRain) {
      return { status: 'rain-all-day' };
    }

    // Otherwise, return hours of rain
    return { 
      status: 'rain-hours',
      hours: consecutiveRainHours
    };
  }

  // If not raining now, check when rain will start
  const firstRainIndex = full24Hours.findIndex((p) => p > 0.1);
  
  if (firstRainIndex === -1) {
    // No rain in next 24 hours
    return { status: 'dry-all-day' };
  }

  // Rain will start later - format the time
  const rainStartTime = times[firstRainIndex];
  const date = new Date(rainStartTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeString = minutes > 0 
    ? `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
    : `${displayHours} ${ampm}`;

  return {
    status: 'dry-until',
    time: timeString
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
    url.searchParams.set("hourly", "precipitation,weathercode");
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
      const weathercode = locationData.hourly.weathercode;
      
      if (!Array.isArray(precipitation) || precipitation.length === 0) {
        console.log(`Invalid precipitation data for ${coord.lat},${coord.lon}`);
        return;
      }

      const currentPrecipitation = precipitation[0] || 0;
      const isRainingNow = currentPrecipitation > 0.1;
      const currentWeatherCode = Array.isArray(weathercode) && weathercode.length > 0 ? weathercode[0] : undefined;

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
        weatherCode: currentWeatherCode,
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

