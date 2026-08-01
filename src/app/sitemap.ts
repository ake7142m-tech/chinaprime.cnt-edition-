import { SITE_URL } from '@/lib/constants';
import type { MetadataRoute } from 'next';

export default async function sitemap(): MetadataRoute.Sitemap {
  // In production, fetch tour and content URLs from KV
  const tourSlugs = ['chiangmai-3d', 'bangkok-1d', 'phuket-4d', 'ayutthaya-1d', 'kohsamui-3d'];
  const contentSlugs = ['news-1', 'news-2', 'news-3'];

  const tourUrls = tourSlugs.map((slug) => ({
    url: `${SITE_URL}/tours/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const contentUrls = contentSlugs.map((slug) => ({
    url: `${SITE_URL}/news#${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const staticUrls = [
    { url: `${SITE_URL}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${SITE_URL}/tours`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${SITE_URL}/news`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${SITE_URL}/reviews`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  return [...staticUrls, ...tourUrls, ...contentUrls];
}
