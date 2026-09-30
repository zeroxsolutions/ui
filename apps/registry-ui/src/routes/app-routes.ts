import { createStaticRoute } from '@zeroxsolutions/routing';

/** The registry's home page. */
export const homeRoute = createStaticRoute('/', () => '/');

/** The docs; the content loader serves every page beneath this path. */
export const docsRoute = createStaticRoute('/docs', () => '/docs');
