import { createFromSource } from 'fumadocs-core/search/server';

import { source } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build, so the worker serves the
// exported index as a file and the browser searches it.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source);
