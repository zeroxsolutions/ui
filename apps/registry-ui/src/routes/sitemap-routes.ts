import { createStaticRoute } from '@zeroxsolutions/routing';

/** The sitemap index, which `robots.txt` names: this app's sitemap and the native zone's. */
export const sitemapIndexRoute = createStaticRoute('/sitemap.xml', () => '/sitemap.xml');

/** This app's own pages' sitemap, which the sitemap index names. */
export const docsSitemapRoute = createStaticRoute('/docs-sitemap.xml', () => '/docs-sitemap.xml');
