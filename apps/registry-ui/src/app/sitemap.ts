import type { MetadataRoute } from 'next';

import { COMPONENT_BASES } from '@/constants/component-bases';
import { canonicalNativeComponentsSource, nativeDocsSource } from '@/lib/native-source';
import { registryHomepage } from '@/lib/registry';
import { source } from '@/lib/source';
import { blocksRoute, homeRoute, nativeHomeRoute } from '@/routes/app-routes';

export const revalidate = false;

/**
 * Every page a reader lands on, at the registry's host: each platform's home page, the blocks page of
 * each base, every web docs page, every native docs page, and each native component page at its
 * canonical URL.
 * The native blocks pages are left out while they hold only an empty state.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    homeRoute.build(),
    nativeHomeRoute.build(),
    ...COMPONENT_BASES.map((base) => blocksRoute.build({ base })),
    ...source.getPages().map((page) => page.url),
    ...nativeDocsSource.getPages().map((page) => page.url),
    ...canonicalNativeComponentsSource.getPages().map((page) => page.url),
  ].map((path) => ({
    url: new URL(path, registryHomepage).href,
  }));
}
