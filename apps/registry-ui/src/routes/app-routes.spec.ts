// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { isMatch, type StaticRoute } from '@zeroxsolutions/routing';
import { describe, expect, it } from 'vitest';

import * as appRoutes from './app-routes';

const APP_DIR = join(import.meta.dirname, '..', 'app');

/**
 * Every pathname a page or an endpoint in the app tree answers, read off the tree, with a dynamic
 * segment `[x]` spelled as the route pattern spells it, `:x`, and a catch-all `[...x]` as its
 * wildcard, `*x`. A group folder is absent from the URL and a private `_` folder is not routable. An
 * optional catch-all `[[...x]]` answers its parent's path as well as every path below it, so it is
 * listed as its parent's path followed by `{/*x}`.
 */
function pagePathnames(directory: string, segments: readonly string[] = []): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const found = entries.some((entry) => entry.isFile() && (entry.name === 'page.tsx' || entry.name === 'route.tsx'))
    ? [`/${segments.join('/')}`]
    : [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const optionalCatchAll = /^\[\[\.\.\.(\w+)\]\]$/.exec(entry.name);
    if (optionalCatchAll) {
      found.push(`/${segments.join('/')}{/*${optionalCatchAll[1]}}`);
      continue;
    }
    const pathless = entry.name.startsWith('(');
    const segment = entry.name.replace(/^\[\.\.\.(\w+)\]$/, '*$1').replace(/^\[(\w+)\]$/, ':$1');
    found.push(...pagePathnames(join(directory, entry.name), pathless ? segments : [...segments, segment]));
  }
  return found;
}

/** Whether a page answers `pathname`: one whose path is the same pattern, or an optional catch-all above it. */
function answered(pages: readonly string[], pathname: string): boolean {
  return pages.some((page) => page === pathname || (page.endsWith('}') && isMatch(page, pathname)));
}

describe('app routes', () => {
  const routes = Object.values(appRoutes);
  const staticRoutes = routes.filter((route): route is StaticRoute => route.build.length === 0);

  // The pathname and the builder are two independent values, so nothing else pairs them.
  it.each(staticRoutes)('$pathname builds and matches its own pathname', (route) => {
    expect(route.build()).toBe(route.pathname);
    expect(route.matcher(route.pathname)).toBeTruthy();
  });

  it('builds a view path its own pattern reads the name back from', () => {
    expect(appRoutes.viewRoute.matcher(appRoutes.viewRoute.build({ name: 'ai-provider-picker' }))).toMatchObject({
      params: { name: 'ai-provider-picker' },
    });
  });

  it('builds the components index under a base, and reads the base back', () => {
    const built = appRoutes.componentsRoute.build({ base: 'base' });

    expect(built).toBe('/docs/components/base');
    expect(appRoutes.componentsRoute.matcher(built)).toMatchObject({ params: { base: 'base' } });
  });

  it('builds a component page under its base, and reads the base and the name back', () => {
    const built = appRoutes.componentRoute.build({ base: 'base', name: 'status-indicator' });

    expect(built).toBe('/docs/components/base/status-indicator');
    expect(appRoutes.componentRoute.matcher(built)).toMatchObject({
      params: { base: 'base', name: 'status-indicator' },
    });
  });

  it('builds the blocks page under a base, and reads the base back', () => {
    const built = appRoutes.blocksRoute.build({ base: 'base' });

    expect(built).toBe('/blocks/base');
    expect(appRoutes.blocksRoute.matcher(built)).toMatchObject({ params: { base: 'base' } });
  });

  it('builds a share-image path its own pattern reads the slug back from', () => {
    const built = appRoutes.docsShareImageRoute.build({ slug: 'components/button/image.png' });

    expect(built).toBe('/og/docs/components/button/image.png');
    expect(appRoutes.docsShareImageRoute.matcher(built)).toMatchObject({
      params: { slug: ['components', 'button', 'image.png'] },
    });
  });

  it('names only paths a page answers', () => {
    const pages = pagePathnames(APP_DIR);

    expect(routes.map((route) => route.pathname).filter((pathname) => !answered(pages, pathname))).toEqual([]);
  });
});
