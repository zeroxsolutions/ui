// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { Index } from '@/registry/bases/base-ui/examples/__index__';

const APP = resolve(import.meta.dirname, '../..');
const CONTENT = join(APP, 'content/docs');

/** The content tree: every page's slug (`components/button`), and each folder's `meta.json` pages by folder (`''` is the root). */
interface DocsTree {
  pages: string[];
  metas: Record<string, string[]>;
}

/** A `pages` entry that takes every page of its folder not listed before it. */
const REST = /^(\.\.\.|z\.\.\.a)$/;

/** A `pages` entry linking into the docs, `[Label](/docs/<slug>)`; the slug is captured. */
const DOCS_LINK = /^\[[^\]]*\]\(\/docs\/?([^)#]*)\)$/;

function readDocsTree(root: string): DocsTree {
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' });
  const pages = files.filter((file) => file.endsWith('.mdx')).map((file) => file.slice(0, -'.mdx'.length));
  const metas = Object.fromEntries(
    files
      .filter((file) => file === 'meta.json' || file.endsWith('/meta.json'))
      .map((file) => [
        file.slice(0, -'meta.json'.length).replace(/\/$/, ''),
        (JSON.parse(readFileSync(join(root, file), 'utf8')) as { pages?: string[] }).pages ?? [],
      ]),
  );
  return { pages: pages.sort(), metas };
}

/** Every page no `meta.json` reaches: neither listed down a chain of folders from the root, nor linked from any entry. */
function unreachedPages({ pages, metas }: DocsTree): string[] {
  const listed = (folder: string, name: string): boolean =>
    (metas[folder] ?? []).some((entry) => entry === name || REST.test(entry));
  const linked = new Set(
    Object.values(metas)
      .flat()
      .flatMap((entry) => {
        const slug = DOCS_LINK.exec(entry)?.[1]?.replace(/\/$/, '');
        if (slug === undefined) return [];
        return slug === '' ? ['index'] : [slug, `${slug}/index`];
      }),
  );

  return pages.filter((page) => {
    const parts = page.split('/');
    const reached = parts.every((name, depth) => listed(parts.slice(0, depth).join('/'), name));
    return !reached && !linked.has(page);
  });
}

/** Each page's MDX source, by slug. */
function readPageSources(root: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(root, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => [file.slice(0, -'.mdx'.length), readFileSync(join(root, file), 'utf8')]),
  );
}

/** The names of the components and the block `registry.json` publishes, which an item page is named for. */
function readItemNames(): Set<string> {
  const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string }[];
  };
  return new Set(items.filter((item) => item.type !== 'registry:example').map((item) => item.name));
}

const NAMED_SOURCE = /<(ComponentPreview|ComponentSource)\b[^>]*?\bname="([^"]+)"/g;

/** Every `ComponentPreview` or `ComponentSource` name the index lacks, as `<slug>: <name>`. */
function unresolvedNames(sources: Record<string, string>, index: Set<string>): string[] {
  return Object.entries(sources).flatMap(([slug, source]) =>
    [...source.matchAll(NAMED_SOURCE)].filter(([, , name]) => !index.has(name)).map(([, , name]) => `${slug}: ${name}`),
  );
}

/** Every item page under `components/` or `blocks/` whose first `ComponentPreview` is not `<name>-demo`. */
function misplacedFirstPreviews(sources: Record<string, string>, items: Set<string>): string[] {
  return Object.entries(sources)
    .filter(([slug]) => /^(components|blocks)\//.test(slug) && items.has(slug.split('/').pop() ?? ''))
    .filter(([slug, source]) => {
      const first = [...source.matchAll(NAMED_SOURCE)].find(([, component]) => component === 'ComponentPreview');
      return first?.[2] !== `${slug.split('/').pop()}-demo`;
    })
    .map(([slug]) => slug);
}

describe('content/docs', () => {
  it('reaches every page from a meta.json', () => {
    expect(unreachedPages(readDocsTree(CONTENT))).toEqual([]);
  });

  it('reports a page no meta.json lists or links', () => {
    const tree: DocsTree = {
      pages: ['blocks/ai-provider-picker', 'blocks/chat', 'components/button', 'index', 'installation'],
      metas: {
        '': ['index', 'components', '[AI Provider Picker](/docs/blocks/ai-provider-picker)'],
        components: ['...'],
      },
    };

    expect(unreachedPages(tree)).toEqual(['blocks/chat', 'installation']);
  });

  it('names only demos and items the examples index holds', () => {
    expect(unresolvedNames(readPageSources(CONTENT), new Set(Object.keys(Index)))).toEqual([]);
  });

  it('reports a name the examples index lacks', () => {
    const sources = {
      'components/status-indicator':
        '<ComponentPreview name="status-indicator-demo" />\n<ComponentSource name="status-indicator-missing" />',
    };

    expect(unresolvedNames(sources, new Set(['status-indicator', 'status-indicator-demo']))).toEqual([
      'components/status-indicator: status-indicator-missing',
    ]);
  });

  it("opens every item page with the item's own demo", () => {
    expect(misplacedFirstPreviews(readPageSources(CONTENT), readItemNames())).toEqual([]);
  });

  it("reports an item page whose first preview is not the item's demo", () => {
    const sources = {
      'blocks/ai-provider-picker': '<ComponentPreview name="ai-provider-picker-demo" />',
      'components/button': '<ComponentPreview name="button-outline" />',
      'components/status-indicator':
        '<ComponentPreview name="status-indicator-tones" />\n<ComponentPreview name="status-indicator-demo" />',
      'components/tag-input': '<ComponentSource name="tag-input" />',
    };

    expect(misplacedFirstPreviews(sources, new Set(['ai-provider-picker', 'status-indicator', 'tag-input']))).toEqual([
      'components/status-indicator',
      'components/tag-input',
    ]);
  });
});
