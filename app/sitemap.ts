import { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.baseUrl
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}

