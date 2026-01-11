# Escape the Rain - Technical Product Requirements Document

## 1. Overview

Location-based recommendation system identifying nearby dry destinations when user's location is raining. Combines real-time weather forecasts with spatial search to surface viable alternatives within driving distance.

**Flow Overview:**
User provides location → geocode API returns lat/lon → system fetches 12h weather for origin → spatial search queries candidates within 50-100km → weather evaluation filters (precipitation >0.1mm excluded) → ranking by distance → top 5 results returned → optional POI enrichment (async) → client renders cards + map.

---

## 2. User Need & Core Decision

**Primary Need:** Find nearby destinations (30-60km) that remain dry for spontaneous trip duration.

**Core Decision:** "Which nearby destinations will be dry when I arrive and remain dry for next N hours?" (N = `strictHours`, default: 4)

**System Decides:** Binary dry/wet classification, distance ranking, weather confidence, POI availability.

**System Does NOT Decide:** Driving routes, user preferences, indoor alternatives, multi-day planning, historical data.

---

## 3. Functional Requirements

**Location Input:**
- Geolocation: Browser API returns lat/lon directly
- Manual search: `/api/geocode` → Open-Meteo (primary), Nominatim (fallback)
- Filters: UK settlements only (PPL, PPLA, PPLC feature codes)
- Returns: Up to 20 results, deduplicated

**Recommendation Generation:**
- Endpoint: `GET /api/recommendations?lat={lat}&lon={lon}&source={geolocation|manual}&strictHours={4}&searchDistance={auto|10|25|50|100}`
- Auto mode: Parallel fetch 10km/25km/50km, merge prioritizing closer
- Manual mode: Single radius (default 50km, extends to 100km if <10 results)
- Extended search: If <5 dry results, extends incrementally (10→25→50→100km)
- Filters: Exclude ≤1km from origin; exclude name matches if <5km
- Returns: Top 5 sorted by distance

**Weather Evaluation:**
- Source: Open-Meteo Forecast API
- Bulk: Up to 50 locations per request (batched if >50)
- Window: 24h hourly granularity
- Threshold: >0.1mm = excluded
- Logic: `isRainingNow = precipitation[0] > 0.1`, `willRainSoon = max(precipitation[0:strictHours]) > 0.1`
- Strict: `isDryToday = !isRainingNow && !willRainSoon`
- Summary: "Dry all day" | "Dry for next X hours" | "Raining now" | "Dry now, rain expected in X hours"

**Spatial Search:**
- Primary: Geoapify (populated_place, administrative)
- Fallback 1: Nominatim (search + reverse geocoding grid)
- Fallback 2: OpenTripMap (bbox → radius)
- Fallback 3: Hardcoded UK cities (99 locations)
- Filtering: Exclude administrative districts, counties, high-level admin areas
- Priority: Settlements (cities/towns/villages) over attractions
- Deduplication: By name (keep closest)

**POI Enrichment (Deferred):**
- Endpoint: `POST /api/poi` (async after initial results)
- Source: Geoapify (commercial, entertainment, catering, natural, tourism, sport, leisure)
- Radius: 3km from destination
- Scoring: `1 / baseline_frequency` (rarer = higher priority)
- Baselines: Pre-calculated from 99 UK sample (shops: 96%, markets: 1%)
- Returns: Top POI types by overindexing score → count → alphabetical

---

## 4. Decision Logic & Rules

**Rain Classification:**
- Threshold: `precipitation > 0.1mm` (mm/hour)
- Current: `precipitation[0] > 0.1` → `isRainingNow`
- Forecast: `max(precipitation[0:strictHours]) > 0.1` → `willRainSoon`
- Strict: Exclude if `isRainingNow || willRainSoon`

**strictHours:**
- Default: 4h
- Range: 1-12h via query param
- Applied: Candidate destinations only (not user location, always 12h)
- Logic: `max(precipitation.slice(0, strictHours)) > 0.1` → exclude

**Dry Criteria:**
- Dry: `!isRainingNow && !willRainSoon`
- Edge: Rain after `strictHours` but within 24h → "Dry for next X hours" (included)
- Edge: All 24h rain → excluded

**Ranking:**
- Primary: Distance ascending (Haversine)
- Secondary: Weather confidence (not explicitly sorted)
- Limit: Top 5

**Extension Logic:**
- Trigger: <5 dry results AND `useAutoSearch = true`
- Tiers: 10km→25km, 25km→50km, 50km→100km (check extended range only)
- Deduplication: Merge with existing, filter by name+distance
- Weather: Extended candidates checked individually (not bulk)

---

## 5. System Architecture (Logical)

**Client:** Location capture, API orchestration (`/geocode` → `/recommendations` → `/poi`), state management, UI rendering, async POI enrichment.

**Server:** Geocoding (query normalization, API selection, UK filtering), spatial search (multi-API orchestration, fallbacks, deduplication), weather evaluation (bulk calls, threshold evaluation), ranking (distance, filtering, top-N), POI enrichment (Geoapify queries, overindexing), error handling.

**External:** Open-Meteo (weather, ~10k/day free), Geoapify (places + POI, requires key), Nominatim (places fallback, 1 req/sec), OpenTripMap (places fallback, requires key).

**Complexity:** Server-side multi-API fallbacks, bulk weather, administrative filtering. Client-side async POI, state transitions. Separation: API keys server-side only.

---

## 6. APIs & Data Sources

**Endpoints:**
- `/api/geocode`: Open-Meteo (primary), Nominatim (fallback)
- `/api/recommendations`: Orchestrates places + weather
- `/api/poi`: Geoapify (POI only)

**Third-Party APIs:**
1. **Open-Meteo Forecast:** `hourly=precipitation,weathercode`, bulk up to 100 locations, ~10k/day free
2. **Geoapify Places:** `categories=populated_place,administrative`, `filter=circle`, requires key
3. **Nominatim:** `q={settlementType}`, `countrycodes=gb`, 1 req/sec, 8s timeout
4. **OpenTripMap:** `bbox` → `radius`, requires key, fallback to hardcoded list

**Priority:** Places: Geoapify → Nominatim → OpenTripMap → Hardcoded. Geocoding: Open-Meteo → Nominatim. Weather: Open-Meteo only.

**Bulk vs Individual:** Weather: Bulk (50/batch) with individual fallback. Places: Individual. POI: Individual (parallelized).

---

## 7. Constraints & Performance Considerations

**Rate Limits:** Open-Meteo ~10k/day, Nominatim 1/sec, Geoapify/OpenTripMap vary by plan.

**Timeouts:** Nominatim 8s, others browser default.

**Geographic:** UK only (`country_codes=gb`), coverage depends on Open-Meteo availability.

**Optimizations:** Parallel 10km/25km/50km searches, bulk weather (50/location), deferred POI (saves 8-10s), candidate limiting (top 50-100), deduplication by name.

**Why POI Async:** Geoapify queries ~1-2s/destination, 5×2s = 10s added latency. Trade-off: Initial cards without "things to do" tags.

---

## 8. Error Handling & Edge Cases

**Failure Modes:**
1. No dry destinations: Empty array, empty state message
2. API timeout (Nominatim): 8s timeout → fallback, no user error
3. Invalid location: 400 error, "Location not found"
4. Weather API failure: Individual failures excluded, bulk → individual fallback, no partial results
5. Rate limit: 429/403 → mark failed, skip future calls, "Service unavailable" if all fail
6. All raining: All filtered → empty results
7. POI failure: Empty POI arrays, cards without tags
8. User location dry: Still searches (no early exit)

**Edge Cases:** Remote location (no POIs within 100km → hardcoded fallback), international (UK filter → empty), rapid weather changes (forecast may be outdated), duplicate names (deduplication by name+distance), administrative areas (filtered by name patterns).

---

## 9. Non-Goals & Explicit Trade-offs

**Non-Goals:** Future planning, indoor alternatives, driving directions, real-time weather, user preferences, historical data, multi-day planning, route optimization.

**Trade-offs:**
1. Distance vs weather confidence: Prioritize distance
2. API calls vs speed: Sequential = slower but simpler (2-5s latency)
3. POI richness vs load time: Deferred saves 8-10s, initial cards without tags
4. Search radius vs coverage: Auto starts 10km, may miss closer
5. Strict vs relaxed: Strict excludes rain in next 4h, may exclude dry-by-arrival
6. Bulk vs individual: Bulk faster but may fail → individual fallback

---

## 10. Anything Else

**Data Quality:** POI baselines from 99 UK sample, hardcoded UK county/district exclusion lists, settlement priority in search.

**Monitoring:** API source tracking, search result logging (radius, places found, dry count, sources), comprehensive error logging.

**Future (Not Implemented):** Weather caching, user location caching, POI caching, extended search parallelization.

<<END>>
