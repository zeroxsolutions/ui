import { createSearchAPI } from 'fumadocs-core/search/server';

import { searchIndexes } from '@/lib/search-index';

// Unset, the handler runs on every request; `false` runs it once at build, so the worker serves the
// exported index as a file and the browser searches it.
export const revalidate = false;

export const { staticGET: GET } = createSearchAPI('advanced', { indexes: searchIndexes });
