import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { AdvancedIndex } from 'fumadocs-core/search/server';

import { source } from '@/lib/source';

interface IndexedPage {
  url: string;
  data: { title?: string; description?: string; structuredData: () => Promise<StructuredData> };
}

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

/**
 * Every web page search finds, tagged with its platform as the site's search asks; the native pages are
 * the native zone's `/native/api/search`.
 */
export async function searchIndexes(): Promise<AdvancedIndex[]> {
  return Promise.all(source.getPages().map(pageIndex));
}
