import type { MetadataRoute } from 'next';

import { nativeHomeRoute } from '@zeroxsolutions/native-ui-docs-web/routes';

import { canonicalNativeComponentsSource, nativeDocsSource } from '@/lib/native-source';
import { registryHomepage } from '@/lib/registry';

export const revalidate = false;

/**
 * Every native page a reader lands on, at the registry's host: the native home page, every native docs
 * page, and each native component page at its canonical URL. The native blocks pages are left out while
 * they hold only an empty state.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    nativeHomeRoute.build(),
    ...nativeDocsSource.getPages().map((page) => page.url),
    ...canonicalNativeComponentsSource.getPages().map((page) => page.url),
  ].map((path) => ({
    url: new URL(path, registryHomepage).href,
  }));
}
