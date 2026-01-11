import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Access NEXT_PUBLIC_* variables directly to avoid triggering validation of server-only env vars
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://escapetherain.com"
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}

