// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { isMatch, type StaticRoute } from '@zeroxsolutions/routing';
import { describe, expect, it } from 'vitest';

import * as webRoutes from '@zeroxsolutions/ui-docs-web/routes';

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
  // The web routes' builders are checked in their package's spec; only this app's tree shows a page answers each.
  const answeredRoutes = [...routes, ...Object.values(webRoutes)];
  const staticRoutes = routes.filter((route): route is StaticRoute => route.build.length === 0);

  // The pathname and the builder are two independent values, so nothing else pairs them.
  it.each(staticRoutes)('$pathname builds and matches its own pathname', (route) => {
    expect(route.build()).toBe(route.pathname);
    expect(route.matcher(route.pathname)).toBeTruthy();
  });

  it('builds a native docs page from its slug, and reads the segments back', () => {
    const built = appRoutes.nativeDocsPageRoute.build({ slug: 'installation' });

    expect(built).toBe('/native/docs/installation');
    expect(appRoutes.nativeDocsPageRoute.matcher(built)).toMatchObject({ params: { slug: ['installation'] } });
  });

  it('builds the native components index and the blocks page under an engine, and reads the engine back', () => {
    const components = appRoutes.nativeComponentsRoute.build({ engine: 'uniwind' });
    const blocks = appRoutes.nativeBlocksRoute.build({ engine: 'uniwind' });

    expect(components).toBe('/native/components/uniwind');
    expect(blocks).toBe('/native/blocks/uniwind');
    expect(appRoutes.nativeComponentsRoute.matcher(components)).toMatchObject({ params: { engine: 'uniwind' } });
    expect(appRoutes.nativeBlocksRoute.matcher(blocks)).toMatchObject({ params: { engine: 'uniwind' } });
  });

  it('builds a native component page under its engine, and reads the engine and the name back', () => {
    const built = appRoutes.nativeComponentRoute.build({ engine: 'nativewind', name: 'button' });

    expect(built).toBe('/native/components/nativewind/button');
    expect(appRoutes.nativeComponentRoute.matcher(built)).toMatchObject({
      params: { engine: 'nativewind', name: 'button' },
    });
  });

  it('builds a native share-image path its own pattern reads the slug back from', () => {
    const built = appRoutes.nativeShareImageRoute.build({ slug: 'components/button/image.png' });

    expect(built).toBe('/og/native/components/button/image.png');
    expect(appRoutes.nativeShareImageRoute.matcher(built)).toMatchObject({
      params: { slug: ['components', 'button', 'image.png'] },
    });
  });

  it('names only paths a page answers', () => {
    const pages = pagePathnames(APP_DIR);

    expect(answeredRoutes.map((route) => route.pathname).filter((pathname) => !answered(pages, pathname))).toEqual([]);
  });
});
