import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { AdvancedIndex } from 'fumadocs-core/search/server';

import { canonicalNativeComponentsSource, nativeDocsSource } from '@/lib/native-source';
import { source } from '@/lib/source';
import type { Platform } from '@/types/platform';

interface IndexedPage {
  url: string;
  data: { title?: string; description?: string; structuredData: StructuredData };
}

function pageIndex(page: IndexedPage, platform: Platform): AdvancedIndex {
  return {
    id: page.url,
    url: page.url,
    title: page.data.title ?? page.url,
    description: page.data.description,
    structuredData: page.data.structuredData,
    tag: platform,
  };
}

/**
 * Every page search finds, tagged with its platform so a page searches only its own platform's text. A
 * native component is listed once, at its canonical URL; the search on another engine's page moves the
 * result to that engine.
 */
export function searchIndexes(): AdvancedIndex[] {
  return [
    ...source.getPages().map((page) => pageIndex(page, 'web')),
    ...nativeDocsSource.getPages().map((page) => pageIndex(page, 'native')),
    ...canonicalNativeComponentsSource.getPages().map((page) => pageIndex(page, 'native')),
  ];
}
