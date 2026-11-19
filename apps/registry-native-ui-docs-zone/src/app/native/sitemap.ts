import type { MetadataRoute } from 'next';

import { nativeHomeRoute, nativeIconsRoute } from '@zeroxsolutions/native-ui-docs-web/routes';
import { NATIVE_ENGINES } from '@zeroxsolutions/ui/site/constants/native-engines';

import { canonicalNativeComponentsSource, nativeDocsSource } from '@/lib/native-source';
import { registryHomepage } from '@/lib/registry';

export const revalidate = false;

/**
 * Every native page a reader lands on, at the registry's host: the native home page, every native docs
 * page, each native component page at its canonical URL, and the icons page of each engine, which names
 * no canonical twin. The native blocks pages are left out while they hold only an empty state.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    nativeHomeRoute.build(),
    ...nativeDocsSource.getPages().map((page) => page.url),
    ...canonicalNativeComponentsSource.getPages().map((page) => page.url),
    ...NATIVE_ENGINES.map((engine) => nativeIconsRoute.build({ engine })),
  ].map((path) => ({
    url: new URL(path, registryHomepage).href,
  }));
}
