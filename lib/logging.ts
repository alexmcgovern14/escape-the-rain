/**
 * Logging utility for tracking API usage and search results
 * Logs to both console and a log file for analysis
 */

import { writeFile, appendFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export type ApiSource = "geoapify" | "nominatim" | "opentripmap" | "fallback" | "merged";

export interface SearchLogEntry {
  timestamp: string;
  location: {
    lat: number;
    lon: number;
  };
  searchRadius: number;
  apiSources: ApiSource[];
  placesFound: number;
  dryPlacesFound: number;
  primarySource: ApiSource; // The main API that provided results
  geoapifyCount?: number;
  nominatimCount?: number;
  opentripmapCount?: number;
  fallbackUsed: boolean;
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "api-usage.log");

// Check if we're in a serverless environment (Vercel, etc.)
// In serverless, filesystem is read-only except /tmp, so we skip file logging
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL_ENV;

/**
 * Ensure log directory exists (only in non-serverless environments)
 */
async function ensureLogDir(): Promise<void> {
  if (isServerless) {
    return; // Skip file operations in serverless
  }
  if (!existsSync(LOG_DIR)) {
    await mkdir(LOG_DIR, { recursive: true });
  }
}

/**
 * Log a search operation with API source information
 */
export async function logSearchResult(entry: SearchLogEntry): Promise<void> {
  try {
    // Always log to console (Vercel captures this automatically)
    console.log(`[LOG] Search at (${entry.location.lat}, ${entry.location.lon}): ${entry.placesFound} places from ${entry.primarySource} (${entry.apiSources.join(", ")})`);
    console.log(`[LOG] Dry places found: ${entry.dryPlacesFound}, API sources: ${entry.apiSources.join(", ")}, Geoapify: ${entry.geoapifyCount || 0}, Nominatim: ${entry.nominatimCount || 0}, OpenTripMap: ${entry.opentripmapCount || 0}`);
    
    // Only write to file in non-serverless environments (local development)
    if (!isServerless) {
      await ensureLogDir();
      const logLine = JSON.stringify(entry) + "\n";
      await appendFile(LOG_FILE, logLine, "utf-8");
    }
  } catch (error) {
    // Silently fail - logging shouldn't break the app
    // Only log errors in development
    if (!isServerless) {
      console.error("[LOG ERROR] Failed to write log entry:", error);
    }
  }
}

/**
 * Get recent log entries (for analysis/debugging)
 * Note: In serverless environments, this will return empty array
 * as file logging is disabled. Use Vercel logs dashboard instead.
 */
export async function getRecentLogs(limit: number = 100): Promise<SearchLogEntry[]> {
  try {
    // In serverless, file logs don't exist
    if (isServerless) {
      return [];
    }
    
    if (!existsSync(LOG_FILE)) {
      return [];
    }
    
    const { readFile } = await import("fs/promises");
    const content = await readFile(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    
    return lines
      .slice(-limit)
      .map((line) => JSON.parse(line) as SearchLogEntry)
      .reverse(); // Most recent first
  } catch (error) {
    if (!isServerless) {
      console.error("[LOG ERROR] Failed to read logs:", error);
    }
    return [];
  }
}

