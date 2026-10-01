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

/** What an item page repeats of its item: the `title` and `description` in `registry.json`. */
interface ItemText {
  title: string;
  description: string;
}

/** The components and the block `registry.json` publishes, by the name an item page is named for. */
function readItems(): Map<string, ItemText> {
  const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
    items: (ItemText & { name: string; type: string })[];
  };
  return new Map(
    items
      .filter((item) => item.type !== 'registry:example')
      .map(({ name, title, description }) => [name, { title, description }]),
  );
}

/** The registry.json items published as `registry:component`, by name. */
function readComponentNames(): Set<string> {
  const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string }[];
  };
  return new Set(items.filter((item) => item.type === 'registry:component').map((item) => item.name));
}

/** Every page directly under `components/`, its own index aside, that names nothing `registry.json` publishes as a `registry:component`. */
function nonComponentPages(sources: Record<string, string>, components: Set<string>): string[] {
  return Object.keys(sources)
    .filter((slug) => /^components\/[^/]+$/.test(slug) && slug !== 'components/index')
    .filter((slug) => !components.has(slug.slice('components/'.length)))
    .sort()
    .map((slug) => `${slug}: names no registry:component item`);
}

/** A page's frontmatter `title` and `description`, each an unquoted value on one line. */
function readFrontmatter(source: string): Partial<ItemText> {
  const block = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
  const field = (key: string): string | undefined => new RegExp(`^${key}: *(.*)$`, 'm').exec(block)?.[1];
  return { title: field('title'), description: field('description') };
}

/** The pages under `components/` and `blocks/` that document one registry item each, which leaves out a folder's index. */
function namedPages(sources: Record<string, string>): [slug: string, name: string, source: string][] {
  return Object.entries(sources)
    .filter(([slug]) => /^(components|blocks)\/[^/]+$/.test(slug) && !slug.endsWith('/index'))
    .map(([slug, source]) => [slug, slug.split('/')[1] ?? '', source]);
}

/**
 * Every page under `components/` or `blocks/` that names no registry item, and every item page
 * whose title or description is not the item's.
 */
function unnamedPages(sources: Record<string, string>, items: Map<string, ItemText>): string[] {
  return namedPages(sources).flatMap(([slug, name, source]) => {
    const item = items.get(name);
    if (!item) return [`${slug}: is not a registry item`];
    const { title, description } = readFrontmatter(source);
    return [
      ...(title === item.title ? [] : [`${slug}: title is not "${item.title}"`]),
      ...(description === item.description ? [] : [`${slug}: description is not the item's`]),
    ];
  });
}

/** The command a page installs its subject with: an item by its URL here, a primitive by its name at shadcn. */
function installCommand(name: string, items: Map<string, ItemText>): string {
  return items.has(name)
    ? `pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/${name}.json`
    : `pnpm dlx shadcn@latest add ${name}`;
}

/** Every item or primitive page with no line that is exactly its install command. */
function missingInstallCommands(sources: Record<string, string>, items: Map<string, ItemText>): string[] {
  return namedPages(sources)
    .filter(([, name, source]) => !source.split('\n').some((line) => line.trim() === installCommand(name, items)))
    .map(([slug, name]) => `${slug}: has no \`${installCommand(name, items)}\``);
}

const NAMED_SOURCE = /<(ComponentPreview|BlockPreview|ComponentSource)\b[^>]*?\bname="([^"]+)"/g;

/** Every `ComponentPreview`, `BlockPreview` or `ComponentSource` name the index lacks, as `<slug>: <name>`. */
function unresolvedNames(sources: Record<string, string>, index: Set<string>): string[] {
  return Object.entries(sources).flatMap(([slug, source]) =>
    [...source.matchAll(NAMED_SOURCE)].filter(([, , name]) => !index.has(name)).map(([, , name]) => `${slug}: ${name}`),
  );
}

/** Every item page under `components/` or `blocks/` whose first `ComponentPreview` or `BlockPreview` is not `<name>-demo`. */
function misplacedFirstPreviews(sources: Record<string, string>, items: Set<string>): string[] {
  return Object.entries(sources)
    .filter(([slug]) => /^(components|blocks)\//.test(slug) && items.has(slug.split('/').pop() ?? ''))
    .filter(([slug, source]) => {
      const first = [...source.matchAll(NAMED_SOURCE)].find(([, component]) => component !== 'ComponentSource');
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
    expect(misplacedFirstPreviews(readPageSources(CONTENT), new Set(readItems().keys()))).toEqual([]);
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

  it('takes a block page whose first preview is a BlockPreview of the demo', () => {
    const pages = {
      'blocks/ai-provider-picker': '<BlockPreview name="ai-provider-picker-demo" block="ai-provider-picker" />',
    };

    expect(misplacedFirstPreviews(pages, new Set(['ai-provider-picker']))).toEqual([]);
  });

  it("documents only registry items, and repeats an item's title and description", () => {
    expect(unnamedPages(readPageSources(CONTENT), readItems())).toEqual([]);
  });

  it('reports a page for nothing published, and an item page that renames its item', () => {
    const items = new Map([['status-indicator', { title: 'Status Indicator', description: 'A small dot.' }]]);
    const sources = {
      'components/index': '---\ntitle: Components\n---',
      'components/card': '---\ntitle: Card\n---',
      'components/status-indicator': '---\ntitle: Status\ndescription: A small dot.\n---',
    };

    expect(unnamedPages(sources, items)).toEqual([
      'components/card: is not a registry item',
      'components/status-indicator: title is not "Status Indicator"',
    ]);
  });

  it('documents only registry:component items under components/, its own index aside', () => {
    expect(nonComponentPages(readPageSources(CONTENT), readComponentNames())).toEqual([]);
  });

  it('reports a components page for nothing registry.json publishes as a registry:component', () => {
    const sources = {
      'components/index': '---\ntitle: Components\n---',
      'components/status-indicator': '---\ntitle: Status Indicator\n---',
      'components/button': '---\ntitle: Button\n---',
    };

    expect(nonComponentPages(sources, new Set(['status-indicator']))).toEqual([
      'components/button: names no registry:component item',
    ]);
  });

  it('installs each item by its URL here and each primitive by its name at shadcn', () => {
    expect(missingInstallCommands(readPageSources(CONTENT), readItems())).toEqual([]);
  });

  it('reports a page that installs its subject some other way', () => {
    const items = new Map([['status-indicator', { title: 'Status Indicator', description: 'A small dot.' }]]);
    const sources = {
      'components/button': '```bash\npnpm dlx shadcn@latest add button-group\n```',
      'components/status-indicator': '```bash\npnpm dlx shadcn@latest add status-indicator\n```',
    };

    expect(missingInstallCommands(sources, items)).toEqual([
      'components/button: has no `pnpm dlx shadcn@latest add button`',
      'components/status-indicator: has no `pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json`',
    ]);
  });
});
