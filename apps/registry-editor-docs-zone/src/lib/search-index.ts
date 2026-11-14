import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { AdvancedIndex } from 'fumadocs-core/search/server';

import { source } from '@/lib/source';

interface IndexedPage {
  url: string;
  data: { title?: string; description?: string; structuredData: () => Promise<StructuredData> };
}

// The header's search finds only the pages tagged with the platform it is on, and the editor pages are web docs.
async function pageIndex(page: IndexedPage): Promise<AdvancedIndex> {
  return {
    id: page.url,
    url: page.url,
    title: page.data.title ?? page.url,
    description: page.data.description,
    structuredData: await page.data.structuredData(),
    tag: 'web',
  };
}

/** Every editor page search finds; the other web pages are registry-ui's `/api/search`. */
export async function searchIndexes(): Promise<AdvancedIndex[]> {
  return Promise.all(source.getPages().map(pageIndex));
}
