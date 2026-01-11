import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Access NEXT_PUBLIC_* variables directly to avoid triggering validation of server-only env vars
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://escapetherain.com"
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

