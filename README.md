# Rain Escape

A portfolio-ready web application that helps you find the closest dry destinations when it's raining at your location. Built with Next.js, TypeScript, and modern web APIs.

![Rain Escape](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)

## 🌧️ About

Rain Escape is a web app that:
- Detects if it's currently raining at your location
- Finds the 5 closest interesting places (cities, towns, POIs) where it's **not** raining
- Displays results on an interactive map with distances
- Provides direct links to open destinations in Google Maps

Perfect for those rainy days when you want to escape to somewhere dry!

## ✨ Features

- **Geolocation Support**: Automatically detects your location (with manual fallback)
- **Real-time Weather**: Uses Open-Meteo for accurate weather forecasts
- **Smart Recommendations**: Finds interesting places with configurable search distance (auto: 50km → 100km, or manual: 10/25/50/100km)
- **API Logging**: Tracks which APIs return results for analysis and optimization
- **Interactive Map**: Mapbox with POI markers and popups
- **Responsive Design**: Works beautifully on desktop and mobile
- **Zero Cost**: Uses free APIs (no paid services required)

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS with react-map-gl
- **Weather API**: [Open-Meteo](https://open-meteo.com/)
- **Places API**: [Geoapify](https://www.geoapify.com/) (primary), [OpenTripMap](https://opentripmap.io/), [Nominatim](https://nominatim.org/) (OpenStreetMap)
- **Geocoding**: Open-Meteo Geocoding API
- **Testing**: Vitest

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenTripMap API key (free at [opentripmap.io](https://opentripmap.io/docs))
- Geoapify API key (free at [geoapify.com](https://www.geoapify.com/))
- Mapbox access token (free at [mapbox.com](https://www.mapbox.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Rain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```
   OPENTRIPMAP_API_KEY=your_opentripmap_api_key_here
   GEOAPIFY_API_KEY=your_geoapify_api_key_here
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```
   
   **Getting API Keys:**
   - **OpenTripMap**: Free at [opentripmap.io](https://opentripmap.io/docs)
   - **Geoapify**: Free tier at [geoapify.com](https://www.geoapify.com/)
   - **Mapbox**: Free tier (50,000 map loads/month) at [mapbox.com](https://www.mapbox.com/)
     - Sign up for a free account
     - Go to Account → Access tokens to get your public token

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Running Tests

```bash
npm test
```

## 📁 Project Structure

```
Rain/
├── app/
│   ├── api/              # API routes
│   │   ├── geocode/      # Geocoding endpoint
│   │   ├── weather/      # Weather check endpoint
│   │   ├── places/       # Places search endpoint
│   │   └── recommendations/  # Main recommendation logic
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── LocationPicker.tsx
│   ├── StatusCard.tsx
│   ├── DestinationsList.tsx
│   └── MapView.tsx
├── lib/                  # Core logic
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Utility functions
│   ├── geo.ts            # Geographic calculations
│   ├── weather.ts        # Weather API client
│   └── places.ts         # Places API client
└── __tests__/            # Unit tests
```

## 🌐 Deployment

### Deploy to Vercel (Recommended - Free)

[Vercel](https://vercel.com) is the best option for Next.js apps - it's made by the Next.js team and offers an excellent free tier.

**Steps:**

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account (free)

3. **Import your project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

4. **Add environment variables**
   - In the project settings, go to "Environment Variables"
   - Add all three variables:
     - `OPENTRIPMAP_API_KEY` = your OpenTripMap API key
     - `GEOAPIFY_API_KEY` = your Geoapify API key
     - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` = your Mapbox token
   - **Important**: Make sure `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is added to all environments (Production, Preview, Development)

5. **Deploy!**
   - Click "Deploy"
   - Vercel will automatically:
     - Install dependencies
     - Build your app
     - Deploy to a live URL (e.g., `rain-escape.vercel.app`)

**Vercel Free Tier Includes:**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Custom domain support
- Preview deployments for every PR

### Alternative Free Hosting Options

**Netlify** (also excellent for Next.js):
- Similar to Vercel
- Free tier: 100GB bandwidth/month
- [netlify.com](https://www.netlify.com)

**Railway** (has a free tier):
- $5 free credit/month
- [railway.app](https://railway.app)

**Render** (has a free tier):
- Free tier with some limitations
- [render.com](https://render.com)

### Manual Deployment

If you want to deploy to your own server:

```bash
npm run build
npm start
```

The app will run on port 3000 by default. Use a process manager like PM2 for production.

## 🔧 API Endpoints

### `GET /api/geocode?q=<place_name>`
Geocodes a place name to coordinates using Open-Meteo Geocoding.

### `GET /api/weather?lat=<lat>&lon=<lon>`
Checks weather at a specific location.

### `GET /api/places?lat=<lat>&lon=<lon>&radiusKm=<radius>`
Fetches interesting places within a radius.

### `GET /api/recommendations?lat=<lat>&lon=<lon>&source=<source>`
Main endpoint that:
1. Checks local weather
2. If raining, finds nearby dry places
3. Returns top 5 recommendations

## 🎨 How It Works

1. **User provides location** (geolocation or manual search)
2. **Check local weather** using Open-Meteo forecast API
3. **If not raining**: Show friendly "stay put" message
4. **If raining**:
   - Fetch candidate places from OpenTripMap (50km radius)
   - Bulk-check weather for top 20 candidates
   - Filter to dry places
   - Sort by distance
   - Return top 5 results
5. **Display results** on map and in list

## 🧪 Testing

Unit tests are included for:
- Haversine distance calculation
- Rain classification logic

Run tests with:
```bash
npm test
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENTRIPMAP_API_KEY` | API key from opentripmap.io | Yes |
| `GEOAPIFY_API_KEY` | API key from geoapify.com | Yes |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Access token from mapbox.com | Yes |

## 🚧 Future Improvements

- [ ] **Drive-time routing**: Use actual travel time instead of straight-line distance
- [ ] **More place categories**: Filter by specific interests (museums, parks, etc.)
- [ ] **PWA support**: Make it installable as a Progressive Web App
- [ ] **Theme switcher**: Dark/light mode toggle
- [ ] **Caching**: Cache weather/places data to reduce API calls
- [ ] **Multi-day forecasts**: Show dry places for tomorrow/next few days
- [ ] **User preferences**: Save favorite locations
- [ ] **Share functionality**: Share recommendations with friends

## 📊 Logging

The application logs API usage for each location search to help analyze which APIs are most effective. Logs are stored in `logs/api-usage.log` (JSON format, one entry per line).

Each log entry includes:
- Timestamp
- Location coordinates
- Search radius used
- Which APIs were used (Geoapify, Nominatim, OpenTripMap, or fallback)
- Primary API source
- Number of places found from each API
- Number of dry places found
- Whether fallback data was used

To analyze logs:
```bash
# View recent logs
cat logs/api-usage.log | tail -20

# Count API usage (requires jq)
cat logs/api-usage.log | jq -r '.primarySource' | sort | uniq -c

# Find locations using fallback
cat logs/api-usage.log | jq 'select(.fallbackUsed == true)'
```

## 🔒 Security & Risks

### ✅ Security Best Practices (Already Implemented)

1. **API Keys Protected**
   - Server-side API keys (`OPENTRIPMAP_API_KEY`, `GEOAPIFY_API_KEY`) are never exposed to the client
   - Only `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is public (required for Mapbox client-side rendering)
   - `.env` file is in `.gitignore` to prevent accidental commits

2. **Input Validation**
   - Location coordinates are validated
   - Search queries are sanitized
   - API responses are validated before use

3. **No User Data Storage**
   - No user accounts or authentication
   - No personal data stored
   - Location data is only used for API requests, not stored

### ⚠️ Risks to Consider

1. **API Key Exposure**
   - **Risk**: If `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is exposed, someone could use your Mapbox quota
   - **Mitigation**: 
     - Mapbox allows you to restrict tokens by domain (add your domain in Mapbox dashboard)
     - Monitor usage in Mapbox account
     - Free tier: 50,000 map loads/month (should be sufficient for portfolio use)

2. **API Rate Limiting**
   - **Risk**: If your site gets popular, you might hit free tier limits
   - **Mitigation**:
     - Geoapify: 3,000 requests/day free tier
     - OpenTripMap: No strict rate limit mentioned
     - Open-Meteo: No rate limit (free)
     - Monitor usage in each API provider's dashboard
     - Consider adding rate limiting to your API routes if needed

3. **Unexpected Costs**
   - **Risk**: If you exceed free tiers, you might incur charges
   - **Mitigation**:
     - Set up usage alerts in each API provider's dashboard
     - Most providers have generous free tiers
     - Consider adding a simple rate limiter to prevent abuse

4. **DDoS / Abuse**
   - **Risk**: Someone could spam your API endpoints
   - **Mitigation**:
     - Vercel has built-in DDoS protection
     - Consider adding rate limiting (e.g., 10 requests per IP per minute)
     - Monitor your Vercel dashboard for unusual traffic

5. **Location Privacy**
   - **Risk**: Users' locations are sent to third-party APIs
   - **Mitigation**:
     - No location data is stored
     - All API calls are server-side
     - Consider adding a privacy notice explaining data usage

### 🛡️ Recommended Additional Security Measures

1. **Add Rate Limiting** (Optional but recommended):
   ```typescript
   // In your API routes, add rate limiting
   // Example using a simple in-memory store:
   const rateLimit = new Map();
   // Limit to 10 requests per IP per minute
   ```

2. **Add CORS Headers** (if needed):
   - Vercel handles this automatically, but you can customize in `next.config.js`

3. **Monitor API Usage**:
   - Set up alerts in Geoapify, Mapbox, and OpenTripMap dashboards
   - Monitor Vercel usage dashboard

4. **Restrict Mapbox Token**:
   - In Mapbox dashboard, restrict your token to your domain only
   - This prevents others from using your token on their sites

### 📊 Free Tier Limits Summary

| Service | Free Tier Limit | Risk Level |
|---------|----------------|------------|
| Vercel | 100GB bandwidth/month | Low |
| Geoapify | 3,000 requests/day | Medium |
| Mapbox | 50,000 map loads/month | Low |
| OpenTripMap | No strict limit mentioned | Low |
| Open-Meteo | No rate limit | Low |

**Overall Risk Assessment**: **LOW** - The app uses free tiers with generous limits. For a portfolio project, you're unlikely to hit limits unless it goes viral.

## 📄 License

This project is open source and available for portfolio use.

## 🙏 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) for free weather data
- [OpenTripMap](https://opentripmap.io/) for places data
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) for the mapping library
- [Geoapify](https://www.geoapify.com/) for places and POI data

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ using Next.js and TypeScript