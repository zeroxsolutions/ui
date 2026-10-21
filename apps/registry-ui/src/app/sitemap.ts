import type { MetadataRoute } from 'next';

import { COMPONENT_BASES } from '@/constants/component-bases';
import { registryHomepage } from '@/lib/registry';
import { source } from '@/lib/source';
import { blocksRoute, homeRoute } from '@/routes/app-routes';

export const revalidate = false;

/** Every page a reader lands on: the home page, the blocks page of each base and every docs page, at the registry's host. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    homeRoute.build(),
    ...COMPONENT_BASES.map((base) => blocksRoute.build({ base })),
    ...source.getPages().map((page) => page.url),
  ].map((path) => ({
    url: new URL(path, registryHomepage).href,
  }));
}
