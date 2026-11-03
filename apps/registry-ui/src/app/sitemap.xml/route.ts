import { registryHomepage } from '@/lib/registry';
import { sitemapIndexResponse } from '@/lib/sitemap-xml';
import { nativeSitemapRoute } from '@/routes/native-paths';
import { docsSitemapRoute } from '@/routes/sitemap-routes';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

/** Each zone writes its own pages' sitemap; the index at the origin's root names both. */
export function GET(): Response {
  return sitemapIndexResponse(
    [docsSitemapRoute.build(), nativeSitemapRoute.build()].map((path) => new URL(path, registryHomepage).href),
  );
}
