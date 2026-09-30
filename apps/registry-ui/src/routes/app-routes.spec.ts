// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { StaticRoute } from '@zeroxsolutions/routing';
import { describe, expect, it } from 'vitest';

import * as appRoutes from './app-routes';

const APP_DIR = join(import.meta.dirname, '..', 'app');

/**
 * Every pathname a page in the app tree answers, read off the tree, with a dynamic segment `[x]` spelled
 * as the route pattern spells it, `:x`. A group folder is absent from the URL, a private `_` folder is
 * not routable, and an optional catch-all `[[...x]]` answers its parent's path as well as every path
 * below it.
 */
function pagePathnames(directory: string, segments: readonly string[] = []): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const found = entries.some((entry) => entry.isFile() && entry.name === 'page.tsx') ? [`/${segments.join('/')}`] : [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const pathless = entry.name.startsWith('(') || entry.name.startsWith('[[...');
    const segment = entry.name.replace(/^\[(\w+)\]$/, ':$1');
    found.push(...pagePathnames(join(directory, entry.name), pathless ? segments : [...segments, segment]));
  }
  return found;
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

  it('names only paths a page answers', () => {
    const pages = new Set(pagePathnames(APP_DIR));

    expect(routes.map((route) => route.pathname).filter((pathname) => !pages.has(pathname))).toEqual([]);
  });
});
