import type { MetadataRoute } from 'next';

import { registryHomepage } from '@/lib/registry';
import { source } from '@/lib/source';
import { blocksRoute, homeRoute } from '@/routes/app-routes';

export const revalidate = false;

/** Every page a reader lands on: the home page, the blocks page and every docs page, at the registry's host. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [homeRoute.build(), blocksRoute.build(), ...source.getPages().map((page) => page.url)].map((path) => ({
    url: new URL(path, registryHomepage).href,
  }));
}
