import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { AdvancedIndex } from 'fumadocs-core/search/server';

import { canonicalNativeComponentsSource, nativeDocsSource } from '@/lib/native-source';

interface IndexedPage {
  url: string;
  data: { title?: string; description?: string; structuredData: () => Promise<StructuredData> };
}

// The header's search finds only the pages tagged with the platform it is on.
async function pageIndex(page: IndexedPage): Promise<AdvancedIndex> {
  return {
    id: page.url,
    url: page.url,
    title: page.data.title ?? page.url,
    description: page.data.description,
    structuredData: await page.data.structuredData(),
    tag: 'native',
  };
}

/**
 * Every native page search finds. A native component is listed once, at its canonical URL; the search on
 * another engine's page moves the result to that engine.
 */
export async function searchIndexes(): Promise<AdvancedIndex[]> {
  return Promise.all([
    ...nativeDocsSource.getPages().map(pageIndex),
    ...canonicalNativeComponentsSource.getPages().map(pageIndex),
  ]);
}
