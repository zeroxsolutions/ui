// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { webDocsSections } from './web-docs-paths';

/** The web docs registry-ui serves, which this zone may not import. */
const WEB_CONTENT = resolve(import.meta.dirname, '../../../../packages/ui-docs-web/content/docs');

/** The folder or page each root entry of the web docs' sidebar names, in its order. */
function webRootSections(): string[] {
  const meta = JSON.parse(readFileSync(join(WEB_CONTENT, 'meta.json'), 'utf8')) as { pages: string[] };
  return meta.pages.filter((entry) => !entry.startsWith('---'));
}

/** Whether a page of the web docs answers `url` itself, rather than through a redirect or not at all. */
function isWebPage(url: string): boolean {
  const slug = url.replace(/^\/docs\/?/, '');
  return [`${slug || 'index'}.mdx`, join(slug, 'index.mdx')].some((file) => existsSync(join(WEB_CONTENT, file)));
}

describe('webDocsSections', () => {
  it("lists the web docs' root sections in the web sidebar's order", () => {
    const sections = webDocsSections.map(({ url }) => url.replace(/^\/docs\/?/, '').split('/')[0] || 'index');

    expect(sections).toEqual(webRootSections());
  });

  it('links each section at a page the web docs hold, not at a folder that redirects', () => {
    expect(webDocsSections.map(({ url }) => url).filter((url) => !isWebPage(url))).toEqual([]);
  });
});
