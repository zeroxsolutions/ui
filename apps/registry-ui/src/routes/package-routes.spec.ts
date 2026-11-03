// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { isMatch } from '@zeroxsolutions/routing';
import { describe, expect, it } from 'vitest';

import * as webRoutes from '@zeroxsolutions/ui-docs-web/routes';

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

describe('package routes', () => {
  // The package's spec checks its routes' builders; only this app's tree shows a page answers each.
  const routes = Object.values(webRoutes);

  it('names only paths a page answers', () => {
    const pages = pagePathnames(APP_DIR);

    expect(routes.map((route) => route.pathname).filter((pathname) => !answered(pages, pathname))).toEqual([]);
  });
});
