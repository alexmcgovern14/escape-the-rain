# Escape the Rain - Product Detail

## 1. User Need & Context
• Problem: User is at location X, it's raining, wants nearby dry destination for immediate drive
• Use case: Spontaneous trip planning, weather-dependent outdoor activity
• Time horizon: Today/now (not future planning)
• Distance range: ~30-60km typical (drivable in <1hr)
• User action: Selects current location (GPS or manual entry)
• Success metric: Find 3-5 viable dry destinations within reasonable drive

## Step-by-Step Process (Location Selection → Results)
• User clicks "Use my location" or enters search → geocode API called
• Geocode returns lat/lng for selected location
• System fetches current weather for selected location (Open-Meteo)
• If raining at origin → proceed; if dry → show message (edge case)
• Spatial search: Query POIs/destinations within ~60km radius
• For each candidate: Fetch weather forecast (next 6-12hrs)
• Filter: Only destinations with "dry" forecast (no precipitation)
• Rank: Sort by distance (closest first), then by weather confidence
• Limit: Return top 5 destinations
• Enrich: Fetch POI details (name, categories, things to do) from OpenTripMap
• Render: Display cards + map with markers
• Map shows: Origin (blue pulsing), top 3 destinations (A/B/C markers)

## 2. Core Decision Being Made
• Primary: "Which nearby destinations will be dry when I arrive?"
• Secondary: "What can I do there?" (POI categories)
• Tertiary: "How far is it?" (distance ranking)
• Decision factors: Weather forecast confidence, distance, POI availability
• Exclusion: Destinations with any precipitation in forecast window
• Inclusion: Destinations with clear/sunny/partly cloudy (no rain)

## 3. Weather Interpretation Logic
• Data source: Open-Meteo free API
• Forecast window: Next 6-12 hours (arrival + activity time)
• Precipitation threshold: >0mm = "not dry" (excluded)
• Weather codes: Interpret WMO codes (0=clear, 1-3=cloudy OK, 45+=fog OK, 61+=rain excluded)
• Confidence: Hourly granularity; if ANY hour shows rain → exclude
• Edge: If all hours dry → "Dry all day"; if partial → "Dry for X hours"
• Fallback: If API fails → show error, don't show destinations
• Caching: Weather data may be cached (TTL ~15min) to reduce API calls

## 4. Spatial Search & Ranking Logic
• Search radius: ~60km from origin (configurable)
• POI source: OpenTripMap API (free tier)
• POI filters: Exclude residential, include: attractions, cafes, parks, museums, nature
• Distance calc: Haversine formula (great-circle distance)
• Primary sort: Distance ascending (closest first)
• Secondary sort: Weather confidence (more hours dry = higher)
• Tertiary: POI count (more things to do = higher)
• Limit: Top 5 results (UI constraint)
• Map display: Show top 3 only (A/B/C markers) to avoid clutter
• Baselines: System may use pre-calculated POI baselines for performance

## 5. System & Data Constraints
• API rate limits: Open-Meteo (free: ~10k/day), OpenTripMap (free: limited)
• Latency: Sequential API calls (geocode → weather → places → POI details) = ~2-5s total
• Data freshness: Weather updates hourly; POI data static (monthly updates)
• Geographic coverage: Limited to areas with Open-Meteo + OpenTripMap data
• Accuracy: Distance is straight-line (not driving distance)
• POI completeness: OpenTripMap may miss local spots
• Weather precision: Hourly forecasts, not minute-by-minute
• No real-time: Forecasts are predictions, not current conditions
• Error handling: If any API fails → show error state, don't show partial results

## 6. Key Trade-offs & Non-goals
• Trade-off: Distance vs weather confidence (closer may be less certain)
• Trade-off: API calls vs speed (sequential = slower but simpler)
• Trade-off: POI richness vs load time (fetch details on-demand)
• Non-goal: Future planning (only "now" use case)
• Non-goal: Indoor alternatives (only outdoor destinations)
• Non-goal: Driving directions (only distance, not route)
• Non-goal: Real-time weather (only forecasts)
• Non-goal: User preferences (no personalization)
• Non-goal: Historical data (only current forecast)
• Non-goal: Multi-day planning (single-day focus)

## 7. Failure Modes & Edge Cases
• No dry destinations found: Show empty state "No dry destinations nearby"
• API timeout: Show error, retry button
• Invalid location: Geocode fails → show "Location not found"
• Location outside coverage: No weather data → show error
• All destinations raining: Return empty results
• Network failure: Offline state, cache last results if available
• Rate limit exceeded: Show "Service temporarily unavailable"
• POI data missing: Show destination with name/distance only (no "things to do")
• Weather API inconsistency: If forecast contradicts → use conservative (exclude if uncertain)
• Edge: User at dry location → Should show message "You're already in a dry area"
• Edge: Very remote location → May have no POIs within 60km
• Edge: International locations → May have different data quality
• Edge: Rapid weather changes → Forecast may be outdated by arrival time

<<END>>
