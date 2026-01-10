/**
 * Type-safe environment variable validation and access
 * Validates required environment variables at startup and provides clear error messages
 */

interface EnvConfig {
  // Required for production
  GEOAPIFY_API_KEY: string;
  OPENTRIPMAP_API_KEY: string;
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: string;
  
  // Optional
  NEXT_PUBLIC_BASE_URL?: string;
  NODE_ENV?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
}

/**
 * Validates that all required environment variables are present
 * Throws an error with a clear message if any are missing
 */
function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const config: Partial<EnvConfig> = {};

  // Required variables
  if (!process.env.GEOAPIFY_API_KEY) {
    missing.push("GEOAPIFY_API_KEY");
  } else {
    config.GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
  }

  if (!process.env.OPENTRIPMAP_API_KEY) {
    missing.push("OPENTRIPMAP_API_KEY");
  } else {
    config.OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY;
  }

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    missing.push("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
  } else {
    config.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  }

  // Optional variables
  config.NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  config.NODE_ENV = process.env.NODE_ENV;
  config.VERCEL = process.env.VERCEL;
  config.VERCEL_ENV = process.env.VERCEL_ENV;

  if (missing.length > 0) {
    const errorMessage = `
Missing required environment variables:
${missing.map((key) => `  - ${key}`).join("\n")}

Please ensure these are set in your .env file or environment configuration.
For local development, create a .env.local file with:
${missing.map((key) => `${key}=your_${key.toLowerCase()}_here`).join("\n")}
    `.trim();

    throw new Error(errorMessage);
  }

  return config as EnvConfig;
}

/**
 * Get validated environment configuration
 * Call this at the top level of server-side code to fail fast if env vars are missing
 */
export function getEnv(): EnvConfig {
  // Cache the validated config
  if (!globalThis.__envConfig) {
    globalThis.__envConfig = validateEnv();
  }
  return globalThis.__envConfig;
}

/**
 * Type-safe access to individual environment variables
 * Use these getters instead of accessing process.env directly
 */
export const env = {
  get geoapifyApiKey(): string {
    return getEnv().GEOAPIFY_API_KEY;
  },
  get opentripmapApiKey(): string {
    return getEnv().OPENTRIPMAP_API_KEY;
  },
  get mapboxAccessToken(): string {
    return getEnv().NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  },
  get baseUrl(): string {
    return getEnv().NEXT_PUBLIC_BASE_URL || "https://escapetherain.com";
  },
  get nodeEnv(): string {
    return getEnv().NODE_ENV || "development";
  },
  get isDevelopment(): boolean {
    return getEnv().NODE_ENV === "development";
  },
  get isProduction(): boolean {
    return getEnv().NODE_ENV === "production";
  },
};

// Extend globalThis to cache the config
declare global {
  // eslint-disable-next-line no-var
  var __envConfig: EnvConfig | undefined;
}

