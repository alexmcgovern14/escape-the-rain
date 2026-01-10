/**
 * Application-wide constants
 * Centralized configuration values to avoid magic numbers and hardcoded strings
 */

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  EXIT: 150,
  FADE_IN: 400,
  FADE_IN_LEFT: 400,
  STAGGER_DELAY: 100, // Delay between staggered animations
  MAP_FLY_TO: 1000,
  SUN_SPIN: 20000, // 20 seconds
} as const;

/**
 * Animation delays (in seconds, for CSS animations)
 */
export const ANIMATION_DELAYS = {
  INITIAL: 0.15,
  MAP: 0.3,
  FIRST_CARD: 0.4,
  FOOTER: 1.0,
} as const;

/**
 * Component sizes (in pixels)
 */
export const COMPONENT_SIZES = {
  EMPTY_STATE: {
    MOBILE: { width: 256, height: 256 }, // w-64 h-64
    DESKTOP: { width: 320, height: 320 }, // w-80 h-80
  },
  SUN_ICON: {
    MOBILE: 128, // size-32
    DESKTOP: 160, // size-40
  },
  RAIN_CLOUD: {
    SMALL: { mobile: 85, desktop: 100 },
    LARGE: { mobile: 106, desktop: 125 },
    BOTTOM: { mobile: 80, desktop: 96 }, // size-20 lg:size-24
  },
  BUTTON: {
    HEIGHT: { mobile: 48, desktop: 56 }, // h-12 lg:h-14
    FONT_SIZE: { mobile: 16, desktop: 18 },
  },
  INPUT: {
    HEIGHT: { mobile: 40, desktop: 48 }, // h-10 lg:h-12
  },
} as const;

/**
 * Typography sizes
 */
export const TYPOGRAPHY = {
  TITLE: { mobile: 36, desktop: 48 },
  SUBTITLE: { mobile: 16, desktop: 18 },
  SECTION_HEADING: 24, // text-2xl
  CARD_TITLE: 20, // text-xl
  BODY: { mobile: 14, desktop: 16 },
  SMALL: 12, // text-sm
  TINY: 10, // text-[10px]
} as const;

/**
 * Spacing values (in pixels)
 */
export const SPACING = {
  PADDING: {
    MOBILE: 16, // px-4
    DESKTOP: 28, // px-[28px]
  },
  TOP_PADDING: {
    MOBILE: 40,
    DESKTOP: 75,
  },
  BOTTOM_MARGIN: {
    MOBILE: 20,
    DESKTOP: 40,
  },
} as const;

/**
 * Map configuration
 */
export const MAP_CONFIG = {
  DEFAULT_VIEW: {
    longitude: -2.0,
    latitude: 54.0,
    zoom: 5.5,
  },
  CLOSE_ZOOM: 12, // Zoom level when locations are very close
  MAX_ZOOM: 15,
  PADDING: { top: 50, bottom: 50, left: 50, right: 50 },
  CLOSE_THRESHOLD: 0.01, // ~1km in degrees
  BOUNDS_PADDING_PERCENT: 0.1, // 10% padding
  MIN_BOUNDS_PADDING: 0.01, // Minimum padding in degrees
} as const;

/**
 * Search configuration
 */
export const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 30,
  POI_LIMIT: 5, // Maximum POI pills to show
} as const;

/**
 * Weather configuration
 */
export const WEATHER_CONFIG = {
  DEFAULT_STRICT_HOURS: 4,
  MAX_STRICT_HOURS: 12,
  USER_LOCATION_CHECK_HOURS: 12,
} as const;

/**
 * POI filtering
 */
export const POI_FILTERS = {
  EXCLUDED_KEYWORDS: ['attractions'],
  MIN_KEYWORD_LENGTH: 2,
  MAX_KEYWORD_LENGTH: 20,
  ADMINISTRATIVE_KEYWORDS: [
    'administrative',
    'populated_place',
    'district',
    'county',
    'municipality',
  ],
  INCLUDED_CATEGORIES: [
    'tourism',
    'amenity',
    'leisure',
    'sport',
    'entertainment',
    'catering',
    'commercial',
    'natural',
  ],
} as const;

/**
 * POI baseline frequencies (percentage of locations that have each POI type)
 * Calculated from sampling 99 UK locations of various sizes
 * Used to prioritize POI types that "overindex" (are more notable than average)
 * 
 * Extracted from baseline calculation script output
 * Format: "poi_type": frequency (0.0 to 1.0, where 0.2 means 20% of locations have it)
 */
export const POI_BASELINES: Record<string, number> = {
  shops: 0.960,
  restaurants: 0.960,
  pubs: 0.949,
  shopping: 0.949,
  museums: 0.939,
  cafes: 0.909,
  sports: 0.889,
  attractions: 0.808,
  sights: 0.586,
  parks: 0.556,
  cinema: 0.485,
  'nature reserves': 0.333,
  stadiums: 0.121,
  forests: 0.121,
  playgrounds: 0.051,
  markets: 0.010,
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  RECOMMENDATIONS: '/api/recommendations',
  GEOCODE: '/api/geocode',
  POI: '/api/poi',
  PLACES: '/api/places',
  WEATHER: '/api/weather',
} as const;

/**
 * External API URLs
 */
export const EXTERNAL_APIS = {
  GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
  NOMINATIM: 'https://nominatim.openstreetmap.org/search',
  MAPBOX: 'https://api.mapbox.com',
} as const;

