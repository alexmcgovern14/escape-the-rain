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

/**
 * Ensure log directory exists
 */
async function ensureLogDir(): Promise<void> {
  if (!existsSync(LOG_DIR)) {
    await mkdir(LOG_DIR, { recursive: true });
  }
}

/**
 * Log a search operation with API source information
 */
export async function logSearchResult(entry: SearchLogEntry): Promise<void> {
  try {
    await ensureLogDir();
    
    const logLine = JSON.stringify(entry) + "\n";
    await appendFile(LOG_FILE, logLine, "utf-8");
    
    // Also log to console for immediate visibility
    console.log(`[LOG] Search at (${entry.location.lat}, ${entry.location.lon}): ${entry.placesFound} places from ${entry.primarySource} (${entry.apiSources.join(", ")})`);
  } catch (error) {
    console.error("[LOG ERROR] Failed to write log entry:", error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Get recent log entries (for analysis/debugging)
 */
export async function getRecentLogs(limit: number = 100): Promise<SearchLogEntry[]> {
  try {
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
    console.error("[LOG ERROR] Failed to read logs:", error);
    return [];
  }
}

