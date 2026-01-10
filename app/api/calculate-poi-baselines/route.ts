/**
 * API route to calculate POI baseline frequencies
 * Call: GET /api/calculate-poi-baselines
 */

import { NextRequest, NextResponse } from "next/server";
import { enrichPlaceWithPOIs } from "@/lib/places";
import { env } from "@/lib/env";

// Force dynamic rendering - this route should never be statically generated
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Sample locations of various sizes across UK
const SAMPLE_LOCATIONS = [
  // Major cities
  { name: "London", lat: 51.5074, lon: -0.1276 },
  { name: "Manchester", lat: 53.4808, lon: -2.2426 },
  { name: "Birmingham", lat: 52.4862, lon: -1.8904 },
  { name: "Liverpool", lat: 53.4084, lon: -2.9916 },
  { name: "Leeds", lat: 53.8008, lon: -1.5491 },
  { name: "Sheffield", lat: 53.3811, lon: -1.4701 },
  { name: "Bristol", lat: 51.4545, lon: -2.5879 },
  { name: "Edinburgh", lat: 55.9533, lon: -3.1883 },
  { name: "Glasgow", lat: 55.8642, lon: -4.2518 },
  { name: "Cardiff", lat: 51.4816, lon: -3.1791 },
  { name: "Newcastle", lat: 54.9783, lon: -1.6178 },
  { name: "Nottingham", lat: 52.9548, lon: -1.1581 },
  { name: "Leicester", lat: 52.6369, lon: -1.1398 },
  { name: "Brighton", lat: 50.8225, lon: -0.1372 },
  { name: "Oxford", lat: 51.7520, lon: -1.2577 },
  { name: "Cambridge", lat: 52.2053, lon: 0.1218 },
  { name: "York", lat: 53.9600, lon: -1.0873 },
  { name: "Bath", lat: 51.3758, lon: -2.3599 },
  
  // Medium towns
  { name: "Reading", lat: 51.4543, lon: -0.9781 },
  { name: "Milton Keynes", lat: 52.0406, lon: -0.7594 },
  { name: "Southampton", lat: 50.9097, lon: -1.4044 },
  { name: "Portsmouth", lat: 50.8198, lon: -1.0880 },
  { name: "Norwich", lat: 52.6309, lon: 1.2974 },
  { name: "Ipswich", lat: 52.0567, lon: 1.1482 },
  { name: "Colchester", lat: 51.8959, lon: 0.8919 },
  { name: "Chelmsford", lat: 51.7358, lon: 0.4696 },
  { name: "Canterbury", lat: 51.2802, lon: 1.0789 },
  { name: "Guildford", lat: 51.2362, lon: -0.5704 },
  { name: "Wakefield", lat: 53.6833, lon: -1.4977 },
  { name: "Bradford", lat: 53.7950, lon: -1.7594 },
  { name: "Huddersfield", lat: 53.6458, lon: -1.7850 },
  { name: "Harrogate", lat: 53.9917, lon: -1.5378 },
  { name: "Doncaster", lat: 53.5228, lon: -1.1314 },
  { name: "Rotherham", lat: 53.4300, lon: -1.3570 },
  { name: "Barnsley", lat: 53.5542, lon: -1.4792 },
  { name: "Stockport", lat: 53.4084, lon: -2.1496 },
  { name: "Bolton", lat: 53.5789, lon: -2.4299 },
  { name: "Warrington", lat: 53.3900, lon: -2.5970 },
  { name: "Blackpool", lat: 53.8175, lon: -3.0357 },
  { name: "Preston", lat: 53.7632, lon: -2.7031 },
  { name: "Chester", lat: 53.1934, lon: -2.8931 },
  { name: "Derby", lat: 52.9225, lon: -1.4746 },
  { name: "Stoke-on-Trent", lat: 53.0027, lon: -2.1794 },
  
  // Smaller towns
  { name: "Otley", lat: 53.9042, lon: -1.6936 },
  { name: "Ilkley", lat: 53.9247, lon: -1.8236 },
  { name: "Knaresborough", lat: 54.0083, lon: -1.4681 },
  { name: "Ripon", lat: 54.1350, lon: -1.5219 },
  { name: "Wetherby", lat: 53.9283, lon: -1.3869 },
  { name: "Tadcaster", lat: 53.8833, lon: -1.2667 },
  { name: "Selby", lat: 53.7833, lon: -1.0667 },
  { name: "Pontefract", lat: 53.6917, lon: -1.3125 },
  { name: "Castleford", lat: 53.7250, lon: -1.3542 },
  { name: "Great Yarmouth", lat: 52.6083, lon: 1.7306 },
  { name: "Lowestoft", lat: 52.4753, lon: 1.7517 },
  { name: "Cromer", lat: 52.9308, lon: 1.2992 },
  { name: "Sheringham", lat: 52.9417, lon: 1.2092 },
  { name: "Fakenham", lat: 52.8292, lon: 0.8492 },
  { name: "Dereham", lat: 52.6811, lon: 0.9403 },
  { name: "Wymondham", lat: 52.5708, lon: 1.1153 },
  { name: "Thetford", lat: 52.4139, lon: 0.7503 },
  { name: "King's Lynn", lat: 52.7556, lon: 0.3981 },
  { name: "Wisbech", lat: 52.6631, lon: 0.1597 },
  { name: "Hunstanton", lat: 52.9375, lon: 0.4917 },
  { name: "Beccles", lat: 52.4583, lon: 1.5639 },
  { name: "Bungay", lat: 52.4542, lon: 1.4375 },
  { name: "Southwold", lat: 52.3278, lon: 1.6792 },
  { name: "Aldeburgh", lat: 52.1528, lon: 1.6000 },
  { name: "Woodbridge", lat: 52.0931, lon: 1.3208 },
  { name: "Felixstowe", lat: 51.9631, lon: 1.3514 },
  { name: "Maidstone", lat: 51.2704, lon: 0.5227 },
  { name: "Tunbridge Wells", lat: 51.1324, lon: 0.2633 },
  { name: "Sevenoaks", lat: 51.2728, lon: 0.1909 },
  { name: "Reigate", lat: 51.2376, lon: -0.2056 },
  { name: "Epsom", lat: 51.3325, lon: -0.2678 },
  { name: "Windsor", lat: 51.4839, lon: -0.6078 },
  { name: "Maidenhead", lat: 51.5228, lon: -0.7221 },
  { name: "Henley-on-Thames", lat: 51.5360, lon: -0.9014 },
  { name: "High Wycombe", lat: 51.6291, lon: -0.7493 },
  { name: "Aylesbury", lat: 51.8178, lon: -0.8144 },
  { name: "St Albans", lat: 51.7530, lon: -0.3373 },
  { name: "Watford", lat: 51.6565, lon: -0.3903 },
  { name: "Harlow", lat: 51.7729, lon: 0.1024 },
  { name: "Basildon", lat: 51.5684, lon: 0.4577 },
  { name: "Southend-on-Sea", lat: 51.5459, lon: 0.7077 },
  { name: "Brentwood", lat: 51.6200, lon: 0.3056 },
  { name: "Romford", lat: 51.5759, lon: 0.1841 },
  { name: "Dartford", lat: 51.4470, lon: 0.2190 },
  { name: "Gravesend", lat: 51.4414, lon: 0.3707 },
  { name: "Rochester", lat: 51.3896, lon: 0.5037 },
  { name: "Whitstable", lat: 51.3610, lon: 1.0257 },
  { name: "Herne Bay", lat: 51.3730, lon: 1.1280 },
  { name: "Margate", lat: 51.3842, lon: 1.3862 },
  { name: "Ramsgate", lat: 51.3400, lon: 1.4170 },
  { name: "Broadstairs", lat: 51.3592, lon: 1.4390 },
  { name: "Horsham", lat: 51.0629, lon: -0.3259 },
  { name: "Crawley", lat: 51.1092, lon: -0.1872 },
  { name: "Worthing", lat: 50.8179, lon: -0.3729 },
  { name: "Bognor Regis", lat: 50.7821, lon: -0.6756 },
  { name: "Chichester", lat: 50.8365, lon: -0.7792 },
  { name: "Arundel", lat: 50.8543, lon: -0.5539 },
];

export async function GET(request: NextRequest) {
  const apiKey = env.geoapifyApiKey;

  console.log(`Calculating POI baselines for ${SAMPLE_LOCATIONS.length} locations...\n`);

  // Track presence of each POI type across all locations
  const poiTypePresence = new Map<string, number>(); // POI type -> count of locations that have it
  const results: Array<{ location: string; poiTypes: string[]; error?: string }> = [];
  let processedCount = 0;
  let errorCount = 0;

  for (const location of SAMPLE_LOCATIONS) {
    try {
      console.log(`Processing ${location.name}...`);
      const poiData = await enrichPlaceWithPOIs(
        location.lat,
        location.lon,
        location.name,
        apiKey
      );

      // Track which POI types this location has
      const locationPoiTypes = new Set(poiData.nearbyPOIs);
      
      for (const poiType of locationPoiTypes) {
        poiTypePresence.set(poiType, (poiTypePresence.get(poiType) || 0) + 1);
      }

      processedCount++;
      results.push({
        location: location.name,
        poiTypes: poiData.nearbyPOIs,
      });
      console.log(`  Found ${poiData.nearbyPOIs.length} POI types: ${poiData.nearbyPOIs.join(", ")}\n`);

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error: any) {
      errorCount++;
      const errorMsg = error?.message || String(error);
      console.error(`  Error processing ${location.name}:`, errorMsg);
      results.push({
        location: location.name,
        poiTypes: [],
        error: errorMsg,
      });
    }
  }

  // Calculate frequencies (percentage of locations that have each POI type)
  const totalLocations = processedCount;
  const baselines: Record<string, number> = {};

  const sortedPoiTypes = Array.from(poiTypePresence.entries())
    .sort((a, b) => b[1] - a[1]); // Sort by frequency descending

  for (const [poiType, count] of sortedPoiTypes) {
    const frequency = count / totalLocations;
    baselines[poiType] = frequency;
  }

  return NextResponse.json({
    summary: {
      totalLocations: SAMPLE_LOCATIONS.length,
      processed: processedCount,
      errors: errorCount,
    },
    baselines,
    results,
  });
}

