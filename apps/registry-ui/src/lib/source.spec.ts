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

/** A file an item ships, as `registry.json` lists it. */
interface RegistryFile {
  path: string;
  type: string;
}

/** A `registry:component` item, with what its page installs and documents. */
interface ComponentItem {
  name: string;
  files: RegistryFile[];
  dependencies: string[];
}

/** The items registry.json publishes as `registry:component`. */
function readComponentItems(): ComponentItem[] {
  const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string; files: RegistryFile[]; dependencies?: string[] }[];
  };
  return items
    .filter((item) => item.type === 'registry:component')
    .map(({ name, files, dependencies }) => ({ name, files, dependencies: dependencies ?? [] }));
}

/** The registry's source root, which the CLI drops from a component's path. */
const SOURCE_ROOT = 'registry/bases/base-ui/';

/**
 * Where the shadcn CLI writes a file. A lib or hook file goes into the app's `lib/` or `hooks/`
 * under its own name, and a component keeps its path from `components/` on.
 */
function installTarget({ path, type }: RegistryFile): string {
  const name = path.split('/').pop() ?? path;
  if (type === 'registry:lib') return `lib/${name}`;
  if (type === 'registry:hook') return `hooks/${name}`;
  return path.slice(SOURCE_ROOT.length);
}

/** Components whose page is still to be written. Each kind's task removes its names; the last task removes the set. */
const UNDOCUMENTED = new Set([
  'avatar-picker',
  'center',
  'chat-suggestion-item',
  'collapsible-card',
  'command-menu',
  'copy-button',
  'editor-tab',
  'emoji-appearance-toggle-group',
  'emoji-picker',
  'file-type-icon',
  'floating-toolbar',
  'font-preview',
  'frontmatter-form',
  'highlighted-code',
  'icon-label',
  'icon-media',
  'image-preview',
  'language-combobox',
  'language-toggle-group',
  'markdown-view',
  'model-info-card',
  'model-list',
  'number-field',
  'page-container',
  'panel-field-group',
  'panel-header',
  'panel-row',
  'password-input',
  'permission-card',
  'reasoning-collapsible',
  'resize-handle',
  'tag-input',
  'tool-call-card',
  'tree-item',
  'unsaved-indicator',
]);

/** Every component with no page that is not still to be written, and every one still listed as such that has a page. */
function pagelessComponents(
  sources: Record<string, string>,
  components: ComponentItem[],
  pending: Set<string>,
): string[] {
  return components.flatMap(({ name }) => {
    const documented = `components/${name}` in sources;
    if (!documented && !pending.has(name)) return [`${name}: has no page`];
    if (documented && pending.has(name)) return [`${name}: has a page, so it leaves UNDOCUMENTED`];
    return [];
  });
}

const COMPONENT_SOURCE = /<ComponentSource\b([^>]*?)\/>/g;

/** An attribute's value in a JSX tag's attribute text. */
function attribute(attributes: string, key: string): string | undefined {
  return new RegExp(`\\b${key}="([^"]*)"`).exec(attributes)?.[1];
}

/**
 * Every way a component page's Manual tab disagrees with its item: a file with no `ComponentSource`,
 * one titled with another path than the CLI writes it to, and `pnpm add` lines naming other packages
 * than the item's `dependencies`.
 */
function manualProblems(sources: Record<string, string>, components: ComponentItem[]): string[] {
  return components.flatMap(({ name, files, dependencies }) => {
    const slug = `components/${name}`;
    const source = sources[slug];
    if (source === undefined) return [];
    const blocks = [...source.matchAll(COMPONENT_SOURCE)]
      .map(([, attributes = '']) => attributes)
      .filter((attributes) => attribute(attributes, 'name') === name)
      .map((attributes) => ({
        file: attribute(attributes, 'file') ?? files[0]?.path,
        title: attribute(attributes, 'title'),
      }));
    const fileProblems = files.flatMap((file) => {
      const block = blocks.find((candidate) => candidate.file === file.path);
      if (!block) return [`${slug}: has no ComponentSource for ${file.path}`];
      const target = installTarget(file);
      return block.title === target ? [] : [`${slug}: titles ${file.path} "${block.title ?? ''}", not "${target}"`];
    });
    const installs = source
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('pnpm add '));
    const expected = dependencies.length > 0 ? [`pnpm add ${dependencies.join(' ')}`] : [];
    const dependencyProblems =
      installs.join('\n') === expected.join('\n')
        ? []
        : [`${slug}: installs ${installs.join('; ') || 'no package'}, not ${expected[0] ?? 'no package'}`];
    return [...fileProblems, ...dependencyProblems];
  });
}

/**
 * The names a family file exports in its last `export { }`, in order, its type exports aside.
 * An aliased export (`X as Y`) counts by the name it exports as.
 */
function exportedNames(source: string): string[] {
  const lists = [...source.matchAll(/^export \{([^}]*)\};/gm)];
  return (lists.at(-1)?.[1] ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '' && !name.startsWith('type '))
    .map((name) => name.split(/\s+as\s+/).pop() ?? name);
}

/** A page's `## API reference` section, up to the next `##` heading. */
function apiReference(page: string): string {
  const [, after = ''] = page.split(/^## API reference$/m);
  return after.split(/^## /m)[0] ?? '';
}

/** The `###` headings under a page's `## API reference`, in order. */
function apiHeadings(page: string): string[] {
  return [...apiReference(page).matchAll(/^### (.+)$/gm)].map(([, heading = '']) => heading.trim());
}

/** The props a part's table lists: the backticked name opening each row under the part's heading. */
function tableProps(page: string, part: string): string[] {
  const body = apiReference(page)
    .split(/^### /m)
    .find((chunk) => chunk.startsWith(`${part}\n`));
  return [...(body ?? '').matchAll(/^\| `(\w+)`/gm)].map(([, prop = '']) => prop);
}

/** The members of `<Part>Props` in a family's source, as an interface or a type literal; undefined where it declares none. */
function declaredProps(source: string, part: string): Set<string> | undefined {
  const body = new RegExp(`^(?:export )?(?:interface|type) ${part}Props\\b[^{]*\\{([\\s\\S]*?)^\\}`, 'm').exec(
    source,
  )?.[1];
  return body === undefined
    ? undefined
    : new Set([...body.matchAll(/^ {2}(?:readonly )?(\w+)\??:/gm)].map(([, prop = '']) => prop));
}

/** Parts whose table lists props their own file does not declare as `<Part>Props`, with where those props come from. */
const PROPS_READ_ELSEWHERE: Record<string, string> = {
  DataTablePaginationPrevious:
    'takes DataTablePaginationStepProps, declared for the unexported DataTablePaginationStep both share.',
  DataTablePaginationNext:
    'takes DataTablePaginationStepProps, declared for the unexported DataTablePaginationStep both share.',
};

/**
 * Every component page whose API reference documents other parts than its file exports, in another
 * order, or a prop the part does not declare.
 */
function apiProblems(
  sources: Record<string, string>,
  components: ComponentItem[],
  sourceOf: (item: ComponentItem) => string,
  readElsewhere: Record<string, string>,
): string[] {
  return components.flatMap((item) => {
    const slug = `components/${item.name}`;
    const page = sources[slug];
    if (page === undefined) return [];
    const code = sourceOf(item);
    const parts = exportedNames(code);
    const headings = apiHeadings(page);
    const headingProblems =
      headings.join(', ') === parts.join(', ')
        ? []
        : [`${slug}: API reference documents ${headings.join(', ') || 'nothing'}, not ${parts.join(', ')}`];
    const propProblems = parts.flatMap((part) => {
      const listed = tableProps(page, part);
      if (listed.length === 0 || part in readElsewhere) return [];
      const declared = declaredProps(code, part);
      if (!declared) return [`${slug}: ${part} lists props, but its source declares no ${part}Props`];
      return listed.filter((prop) => !declared.has(prop)).map((prop) => `${slug}: ${part} has no prop \`${prop}\``);
    });
    return [...headingProblems, ...propProblems];
  });
}

/** An item's first file, which holds its family. */
function familySource(item: ComponentItem): string {
  return readFileSync(join(APP, item.files[0]?.path ?? ''), 'utf8');
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

  it('gives every component a page, apart from those still to be written', () => {
    expect(pagelessComponents(readPageSources(CONTENT), readComponentItems(), UNDOCUMENTED)).toEqual([]);
  });

  it('reports a component with no page, and one listed as still to be written that has one', () => {
    const components = [
      { name: 'status-indicator', files: [], dependencies: [] },
      { name: 'tag-input', files: [], dependencies: [] },
      { name: 'center', files: [], dependencies: [] },
    ];
    const sources = { 'components/status-indicator': '', 'components/center': '' };

    expect(pagelessComponents(sources, components, new Set(['center']))).toEqual([
      'tag-input: has no page',
      'center: has a page, so it leaves UNDOCUMENTED',
    ]);
  });

  it('writes each file to the path the shadcn CLI installs it at', () => {
    expect(
      installTarget({
        path: 'registry/bases/base-ui/components/feedback/status-indicator.tsx',
        type: 'registry:component',
      }),
    ).toBe('components/feedback/status-indicator.tsx');
    expect(installTarget({ path: 'registry/bases/base-ui/types/status-tone.ts', type: 'registry:lib' })).toBe(
      'lib/status-tone.ts',
    );
    expect(
      installTarget({ path: 'registry/bases/base-ui/hooks/use-controllable-state.ts', type: 'registry:hook' }),
    ).toBe('hooks/use-controllable-state.ts');
  });

  it("installs every component's files and packages as its item lists them", () => {
    expect(manualProblems(readPageSources(CONTENT), readComponentItems())).toEqual([]);
  });

  it('reports a missing file, a file titled with the wrong path, and the wrong packages', () => {
    const components = [
      {
        name: 'status-indicator',
        files: [
          { path: 'registry/bases/base-ui/components/feedback/status-indicator.tsx', type: 'registry:component' },
          { path: 'registry/bases/base-ui/types/status-tone.ts', type: 'registry:lib' },
        ],
        dependencies: ['lucide-react'],
      },
    ];
    const sources = {
      'components/status-indicator':
        '<ComponentSource name="status-indicator" title="components/status-indicator.tsx" />\n```bash\npnpm add react\n```',
    };

    expect(manualProblems(sources, components)).toEqual([
      'components/status-indicator: titles registry/bases/base-ui/components/feedback/status-indicator.tsx "components/status-indicator.tsx", not "components/feedback/status-indicator.tsx"',
      'components/status-indicator: has no ComponentSource for registry/bases/base-ui/types/status-tone.ts',
      'components/status-indicator: installs pnpm add react, not pnpm add lucide-react',
    ]);
  });

  it('documents exactly the parts each component exports, with props each part declares', () => {
    expect(apiProblems(readPageSources(CONTENT), readComponentItems(), familySource, PROPS_READ_ELSEWHERE)).toEqual([]);
  });

  it('reports a missing part, and a prop the part does not declare', () => {
    const item = { name: 'tag-input', files: [], dependencies: [] };
    const code = [
      'interface TagInputProps {',
      '  value: string[];',
      '  onValueChange?: (value: string[]) => void;',
      '}',
      'export { TagInput, TagInputItem };',
    ].join('\n');
    const sources = {
      'components/tag-input': [
        '## API reference',
        '',
        '### TagInput',
        '',
        '| Prop | Type | Default |',
        '| --- | --- | --- |',
        '| `value` | `string[]` | required |',
        '| `max` | `number` | - |',
      ].join('\n'),
    };

    expect(apiProblems(sources, [item], () => code, {})).toEqual([
      'components/tag-input: API reference documents TagInput, not TagInput, TagInputItem',
      'components/tag-input: TagInput has no prop `max`',
    ]);
  });

  it('names an aliased export by the name it exports as, skips a type export, and keeps a lowercase export', () => {
    const item = { name: 'markdown-view', files: [], dependencies: [] };
    const code = [
      'export type MarkdownViewProps = { markdown: string };',
      'function MemoizedMarkdownView(props: MarkdownViewProps) { return null; }',
      'function useMarkdownCollapse() { return false; }',
      'export { MemoizedMarkdownView as MarkdownView, useMarkdownCollapse, type MarkdownViewProps };',
    ].join('\n');
    const sources = {
      'components/markdown-view': ['## API reference', '', '### MarkdownView', '', '### useMarkdownCollapse'].join(
        '\n',
      ),
    };

    expect(apiProblems(sources, [item], () => code, {})).toEqual([]);
  });
});
