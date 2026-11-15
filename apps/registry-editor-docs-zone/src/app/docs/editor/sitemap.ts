import type { MetadataRoute } from 'next';

import { registryHomepage } from '@/lib/registry';
import { source } from '@/lib/source';

export const revalidate = false;

/** Every editor docs page, at the registry's host. */
export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({ url: new URL(page.url, registryHomepage).href }));
}
