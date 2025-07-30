import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chasing-chapters.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/uploads/',
          '*.json',
          '/search?*', // Allow search page but not specific search queries
        ],
      },
      // Block AI crawlers from scraping content
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
        ],
        disallow: '/',
      },
      // Allow search engines to crawl more frequently
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'Slurp',
          'DuckDuckBot',
        ],
        allow: '/',
        crawlDelay: 1,
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/uploads/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}