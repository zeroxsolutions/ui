import type { MetadataRoute } from 'next';

import { registryHomepage } from '@/lib/registry';
import { sitemapIndexRoute } from '@/routes/sitemap-routes';

export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL(sitemapIndexRoute.build(), registryHomepage).href,
  };
}
