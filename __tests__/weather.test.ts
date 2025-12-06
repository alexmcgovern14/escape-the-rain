import { describe, it, expect } from "vitest";
import { isDryToday } from "@/lib/weather";
import type { WeatherCheckResult } from "@/lib/weather";

describe("isDryToday", () => {
  it("should return true when not raining now and won't rain soon", () => {
    const weather: WeatherCheckResult = {
      isRainingNow: false,
      willRainSoon: false,
      summary: "Dry all day",
    };
    expect(isDryToday(weather)).toBe(true);
  });

  it("should return false when raining now", () => {
    const weather: WeatherCheckResult = {
      isRainingNow: true,
      willRainSoon: false,
      summary: "Raining now",
    };
    expect(isDryToday(weather)).toBe(false);
  });

  it("should return false when will rain soon", () => {
    const weather: WeatherCheckResult = {
      isRainingNow: false,
      willRainSoon: true,
      summary: "Rain expected in 2 hours",
    };
    expect(isDryToday(weather)).toBe(false);
  });

  it("should return false when raining now and will continue", () => {
    const weather: WeatherCheckResult = {
      isRainingNow: true,
      willRainSoon: true,
      summary: "Raining now",
    };
    expect(isDryToday(weather)).toBe(false);
  });
});

