// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { EditorComponents } from '@zeroxsolutions/ui/registry/bases/base-ui/examples/__editor-components__';
import { Index } from '@zeroxsolutions/ui/registry/bases/base-ui/examples/__index__';
import { editorDocsSections } from '@zeroxsolutions/ui/site/constants/editor-docs-sections';

const APP = resolve(import.meta.dirname, '../..');
/** The web registry's package, whose `registry.json` paths are relative to it. */
const UI = resolve(APP, '../../packages/ui');
/** The editor docs' folder, which `source.config.ts` loads; its pages sit under `editor/`. */
const CONTENT = resolve(APP, '../../packages/editor-docs-web/content/docs');

/** Each page's MDX source, by slug. */
function readPageSources(roots: string[]): Record<string, string> {
  return Object.fromEntries(
    roots.flatMap((root) =>
      readdirSync(root, { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => [file.slice(0, -'.mdx'.length), readFileSync(join(root, file), 'utf8')]),
    ),
  );
}

/** What an item page repeats of its item: the `title` and `description` in `registry.json`. */
interface ItemText {
  title: string;
  description: string;
}

/** The components and the block `registry.json` publishes, by the name an item page is named for. */
function readItems(): Map<string, ItemText> {
  const { items } = JSON.parse(readFileSync(join(UI, 'registry.json'), 'utf8')) as {
    items: (ItemText & { name: string; type: string })[];
  };
  return new Map(
    items
      .filter((item) => item.type !== 'registry:example')
      .map(({ name, title, description }) => [name, { title, description }]),
  );
}

/** The component and block items registry.json publishes, each of which has a demo; a lib has none. */
function readDemoedNames(): Set<string> {
  const { items } = JSON.parse(readFileSync(join(UI, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string }[];
  };
  return new Set(
    items
      .filter((item) => item.type === 'registry:component' || item.type === 'registry:block')
      .map((item) => item.name),
  );
}

/** The names registry.json publishes as `registry:example` in the editor set, whose demos the editor pages name. */
function readExampleNames(): string[] {
  const { items } = JSON.parse(readFileSync(join(UI, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string }[];
  };
  return items
    .filter((item) => item.type === 'registry:example' && item.name in EditorComponents)
    .map((item) => item.name);
}

/**
 * A page's frontmatter `title` and `description`, each a value on one line, unquoted unless YAML requires
 * quoting (a value with its own `: ` must be quoted so the frontmatter parses; oxfmt picks single or double
 * quotes - double when the text has its own apostrophe, to avoid a doubled `''` escape, single otherwise -
 * and either is stripped here so it still compares equal to the item's unquoted text). A quote oxfmt picks
 * never needs un-escaping: it always picks the style that needs none, so this strips a matching outer pair and
 * does not unescape `''` inside a single-quoted value.
 */
function readFrontmatter(source: string): Partial<ItemText> {
  const block = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
  const field = (key: string): string | undefined => {
    const value = new RegExp(`^${key}: *(.*)$`, 'm').exec(block)?.[1];
    return value === undefined ? undefined : /^(['"])[\s\S]*\1$/.test(value) ? value.slice(1, -1) : value;
  };
  return { title: field('title'), description: field('description') };
}

/** A slug under `editor/`, the folder whose pages document one registry item each. */
const ITEM_PAGE = /^editor\/[^/]+$/;

/** The pages under `editor/` that document one registry item each, which leaves out a folder's index. */
function namedPages(sources: Record<string, string>): [slug: string, name: string, source: string][] {
  return Object.entries(sources)
    .filter(([slug]) => ITEM_PAGE.test(slug) && !slug.endsWith('/index'))
    .map(([slug, source]) => [slug, slug.split('/').pop() ?? '', source]);
}

/**
 * Every page under `editor/` that names no registry item, and every item
 * page whose title or description is not the item's.
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

/** The item a document feature plugs into, which its page installs alongside it. */
const FEATURE_HOST = '@zui/document-editor';

/**
 * The command a page installs its subject with: an item by its `@zui/` name, after Document Editor for a
 * document feature, and a primitive by its name at shadcn.
 */
function installCommand(name: string, items: Map<string, ItemText>, features: ReadonlySet<string>): string {
  if (features.has(name)) return `pnpm dlx shadcn@latest add ${FEATURE_HOST} @zui/${name}`;
  return items.has(name) ? `pnpm dlx shadcn@latest add @zui/${name}` : `pnpm dlx shadcn@latest add ${name}`;
}

/** A page's `<TabsContent value="cli">...</TabsContent>` block, where its install command lives. */
function cliBlock(source: string): string {
  return /<TabsContent value="cli">([\s\S]*?)<\/TabsContent>/.exec(source)?.[1] ?? '';
}

/** Every item or primitive page whose CLI tab has no line that is exactly its install command. */
function missingInstallCommands(
  sources: Record<string, string>,
  items: Map<string, ItemText>,
  features: ReadonlySet<string> = new Set(),
): string[] {
  return namedPages(sources)
    .filter(
      ([, name, source]) =>
        !cliBlock(source)
          .split('\n')
          .some((line) => line.trim() === installCommand(name, items, features)),
    )
    .map(([slug, name]) => `${slug}: has no \`${installCommand(name, items, features)}\``);
}

/** A file an item ships, as `registry.json` lists it. */
interface RegistryFile {
  path: string;
  type: string;
  /** Where the CLI writes the file, when the item names it. */
  target?: string;
}

/** A `registry:component` or editor item, with what its page installs and documents. */
interface ComponentItem {
  name: string;
  /** The item's category; an `editor` item's page sits under `editor/`. */
  categories?: string[];
  files: RegistryFile[];
  dependencies: string[];
  registryDependencies: string[];
  /** The CSS the item ships, keyed by selector or at-rule. */
  css?: Record<string, unknown>;
}

/** The items registry.json publishes in the `editor` category, whose pages sit under `editor/`. */
function readComponentItems(): ComponentItem[] {
  const { items } = JSON.parse(readFileSync(join(UI, 'registry.json'), 'utf8')) as {
    items: {
      name: string;
      type: string;
      categories?: string[];
      files: RegistryFile[];
      dependencies?: string[];
      registryDependencies?: string[];
      css?: Record<string, unknown>;
    }[];
  };
  return items
    .filter((item) => item.categories?.[0] === 'editor')
    .map(({ name, categories, files, dependencies, registryDependencies, css }) => ({
      name,
      categories,
      files,
      dependencies: dependencies ?? [],
      registryDependencies: registryDependencies ?? [],
      css,
    }));
}

/** A document feature's first file, under `editor/document/features/<feature>/`; the barrel above them is no feature. */
const FEATURE_FILE = /^registry\/bases\/base-ui\/editor\/document\/features\/[^/]+\//;

function isFeature({ files }: ComponentItem): boolean {
  return FEATURE_FILE.test(files[0]?.path ?? '');
}

/** A `css` key loading a Tailwind plugin, `@plugin "<package>"`; the package is captured. */
const TAILWIND_PLUGIN = /^@plugin\s+["']([^"']+)["']$/;

/** The Tailwind plugins an item's css loads, which a project installs as dev dependencies. */
function pluginsOf({ css }: ComponentItem): string[] {
  return Object.keys(css ?? {}).flatMap((key) => {
    const plugin = TAILWIND_PLUGIN.exec(key)?.[1];
    return plugin === undefined ? [] : [plugin];
  });
}

/** The registry's source root, which the CLI drops from a component's path. */
const SOURCE_ROOT = 'registry/bases/base-ui/';

/**
 * Where the shadcn CLI writes a file: its `target` when the item names one. Otherwise a lib or hook
 * file goes into the app's `lib/` or `hooks/` under its own name, and a component keeps its path from
 * `components/` on.
 */
function installTarget({ path, type, target }: RegistryFile): string {
  if (target !== undefined) return target;
  const name = path.split('/').pop() ?? path;
  if (type === 'registry:lib') return `lib/${name}`;
  if (type === 'registry:hook') return `hooks/${name}`;
  return path.slice(SOURCE_ROOT.length);
}

/** The page that documents an editor item, under `editor/`. */
function componentPage({ name }: ComponentItem): string {
  return `editor/${name}`;
}

/** Every component with no page. */
function pagelessComponents(sources: Record<string, string>, components: ComponentItem[]): string[] {
  return components.flatMap((item) => (componentPage(item) in sources ? [] : [`${item.name}: has no page`]));
}

const COMPONENT_SOURCE = /<ComponentSource\b([^>]*?)\/>/g;

/** An attribute's value in a JSX tag's attribute text. */
function attribute(attributes: string, key: string): string | undefined {
  return new RegExp(`\\b${key}="([^"]*)"`).exec(attributes)?.[1];
}

/** A page's `<TabsContent value="manual">...</TabsContent>` block, where its Manual tab's steps live. */
function manualBlock(source: string): string {
  return /<TabsContent value="manual">([\s\S]*?)<\/TabsContent>/.exec(source)?.[1] ?? '';
}

/** What `pnpm dlx shadcn@latest add` takes for a registryDependencies list: `@shadcn/x` bare, `@zui/x` as given, in order. */
function registryDependencyNames(registryDependencies: string[]): string[] {
  return registryDependencies.map((dependency) =>
    dependency.startsWith('@shadcn/') ? dependency.slice('@shadcn/'.length) : dependency,
  );
}

/**
 * Every way a component page's Manual tab disagrees with its item: a file with no `ComponentSource`,
 * one titled with another path than the CLI writes it to, two `ComponentSource` blocks naming the same
 * file, `pnpm add` lines naming other packages than the item's `dependencies` (and, as `pnpm add -D`, the
 * Tailwind plugins its css loads), and a `pnpm dlx shadcn@latest add` line naming other names than its
 * `registryDependencies`, in another order. A document feature adds Document Editor in a step of its own
 * first, and leaves it out of the line after.
 */
function manualProblems(sources: Record<string, string>, components: ComponentItem[]): string[] {
  return components.flatMap((item) => {
    const { name, files, dependencies, registryDependencies } = item;
    const slug = componentPage(item);
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
    const duplicateProblems = [...new Set(blocks.map((block) => block.file))].flatMap((file) => {
      const count = blocks.filter((block) => block.file === file).length;
      return count > 1 ? [`${slug}: has ${count} ComponentSource blocks for ${file}`] : [];
    });
    const installs = source
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('pnpm add '));
    const plugins = pluginsOf(item);
    const expectedInstalls = [
      ...(dependencies.length > 0 ? [`pnpm add ${dependencies.join(' ')}`] : []),
      ...(plugins.length > 0 ? [`pnpm add -D ${plugins.join(' ')}`] : []),
    ];
    const dependencyProblems =
      installs.join('\n') === expectedInstalls.join('\n')
        ? []
        : [
            `${slug}: installs ${installs.join('; ') || 'no package'}, not ${expectedInstalls.join('; ') || 'no package'}`,
          ];
    // Scoped to the Manual tab so this never reads the CLI tab's own `pnpm dlx shadcn@latest add
    // @zui/<name>` line, which installs the item itself, not its registryDependencies.
    const adds = manualBlock(source)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('pnpm dlx shadcn@latest add '));
    const parts = isFeature(item)
      ? registryDependencies.filter((dependency) => dependency !== FEATURE_HOST)
      : registryDependencies;
    const expectedAdds = [
      ...(isFeature(item) ? [`pnpm dlx shadcn@latest add ${FEATURE_HOST}`] : []),
      ...(parts.length > 0 ? [`pnpm dlx shadcn@latest add ${registryDependencyNames(parts).join(' ')}`] : []),
    ];
    const registryProblems =
      adds.join('\n') === expectedAdds.join('\n')
        ? []
        : [`${slug}: adds ${adds.join('; ') || 'nothing'}, not ${expectedAdds.join('; ') || 'nothing'}`];
    return [...fileProblems, ...duplicateProblems, ...dependencyProblems, ...registryProblems];
  });
}

const NAMED_SOURCE = /<(ComponentPreview|BlockPreview|ComponentSource)\b[^>]*?\bname="([^"]+)"/g;

/** Every `ComponentPreview`, `BlockPreview` or `ComponentSource` name the index lacks, as `<slug>: <name>`. */
function unresolvedNames(sources: Record<string, string>, index: Set<string>): string[] {
  return Object.entries(sources).flatMap(([slug, source]) =>
    [...source.matchAll(NAMED_SOURCE)].filter(([, , name]) => !index.has(name)).map(([, , name]) => `${slug}: ${name}`),
  );
}

/** Every item page under `editor/` whose first `ComponentPreview` or `BlockPreview` is not `<name>-demo`. */
function misplacedFirstPreviews(sources: Record<string, string>, items: Set<string>): string[] {
  return Object.entries(sources)
    .filter(([slug]) => ITEM_PAGE.test(slug) && items.has(slug.split('/').pop() ?? ''))
    .filter(([slug, source]) => {
      const first = [...source.matchAll(NAMED_SOURCE)].find(([, component]) => component !== 'ComponentSource');
      return first?.[2] !== `${slug.split('/').pop()}-demo`;
    })
    .map(([slug]) => slug);
}

/** Every `registry:example` no page's `ComponentPreview` or `BlockPreview` names (a `ComponentSource` aside, which names a file, not an example). */
function unusedExamples(sources: Record<string, string>, examples: string[]): string[] {
  const named = new Set(
    Object.values(sources).flatMap((source) =>
      [...source.matchAll(NAMED_SOURCE)]
        .filter(([, component]) => component !== 'ComponentSource')
        .map(([, , name]) => name),
    ),
  );
  return examples.filter((name) => !named.has(name)).map((name) => `${name}: is named by no page's preview`);
}

describe('content/docs', () => {
  it('lists every editor page in the sidebar, and only those', () => {
    const pages = readdirSync(join(CONTENT, 'editor'))
      .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
      .map((file) => file.slice(0, -'.mdx'.length));

    expect(editorDocsSections.flatMap((section) => section.pages).toSorted()).toEqual(pages.toSorted());
  });

  it('names only demos and items the examples index holds', () => {
    expect(unresolvedNames(readPageSources([CONTENT]), new Set(Object.keys(Index)))).toEqual([]);
  });

  it('reports a name the examples index lacks', () => {
    const sources = {
      'components/base/status-indicator':
        '<ComponentPreview name="status-indicator-demo" />\n<ComponentSource name="status-indicator-missing" />',
    };

    expect(unresolvedNames(sources, new Set(['status-indicator', 'status-indicator-demo']))).toEqual([
      'components/base/status-indicator: status-indicator-missing',
    ]);
  });

  it("names every registry:example in some page's preview", () => {
    expect(unusedExamples(readPageSources([CONTENT]), readExampleNames())).toEqual([]);
  });

  it('reports an example no page previews, naming it in a ComponentSource aside', () => {
    const sources = {
      'components/base/status-indicator': [
        '<ComponentPreview name="status-indicator-demo" />',
        '<ComponentSource name="status-indicator-tones" />',
      ].join('\n'),
    };

    expect(unusedExamples(sources, ['status-indicator-demo', 'status-indicator-tones'])).toEqual([
      "status-indicator-tones: is named by no page's preview",
    ]);
  });

  it("opens every item page with the item's own demo", () => {
    expect(misplacedFirstPreviews(readPageSources([CONTENT]), readDemoedNames())).toEqual([]);
  });

  it("reports an editor page whose first preview is not the item's demo", () => {
    const sources = { 'editor/math-editor': '<ComponentPreview name="mermaid-editor-demo" />' };

    expect(misplacedFirstPreviews(sources, new Set(['math-editor']))).toEqual(['editor/math-editor']);
  });

  it('reports an editor page that renames its item, and leaves the editor index out', () => {
    const items = new Map([['math-editor', { title: 'Math Editor', description: 'A LaTeX editor.' }]]);
    const sources = {
      'editor/index': '---\ntitle: Editor\n---',
      'editor/math-editor': '---\ntitle: Formula Editor\ndescription: A LaTeX editor.\n---',
    };

    expect(unnamedPages(sources, items)).toEqual(['editor/math-editor: title is not "Math Editor"']);
  });

  it("documents only registry items, and repeats an item's title and description", () => {
    expect(unnamedPages(readPageSources([CONTENT]), readItems())).toEqual([]);
  });

  it('installs each item by its @zui name and each primitive by its name at shadcn', () => {
    const features = new Set(
      readComponentItems()
        .filter(isFeature)
        .map((item) => item.name),
    );
    expect(missingInstallCommands(readPageSources([CONTENT]), readItems(), features)).toEqual([]);
  });

  it('installs a document feature together with Document Editor, which it plugs into', () => {
    const items = new Map([
      ['editor-toggle', { title: 'Editor Toggle', description: 'A fold.' }],
      ['editor-mention', { title: 'Editor Mention', description: 'A mention.' }],
    ]);
    const sources = {
      'editor/editor-toggle':
        '<TabsContent value="cli">\n```bash\npnpm dlx shadcn@latest add @zui/document-editor @zui/editor-toggle\n```\n</TabsContent>',
      'editor/editor-mention':
        '<TabsContent value="cli">\n```bash\npnpm dlx shadcn@latest add @zui/editor-mention\n```\n</TabsContent>',
    };

    expect(missingInstallCommands(sources, items, new Set(['editor-toggle', 'editor-mention']))).toEqual([
      'editor/editor-mention: has no `pnpm dlx shadcn@latest add @zui/document-editor @zui/editor-mention`',
    ]);
  });

  it('gives every editor item a page', () => {
    expect(pagelessComponents(readPageSources([CONTENT]), readComponentItems())).toEqual([]);
  });

  it("finds an editor item's page under editor/, not under components/base/", () => {
    const components = [
      { name: 'document-editor', categories: ['editor'], files: [], dependencies: [], registryDependencies: [] },
    ];

    expect(pagelessComponents({ 'editor/document-editor': '' }, components)).toEqual([]);
    expect(pagelessComponents({ 'components/base/document-editor': '' }, components)).toEqual([
      'document-editor: has no page',
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

  it('writes a file with a target to that target, as the shadcn CLI does', () => {
    expect(
      installTarget({
        path: 'registry/bases/base-ui/editor/shared/theme/index.ts',
        type: 'registry:lib',
        target: 'components/editor/shared/theme/index.ts',
      }),
    ).toBe('components/editor/shared/theme/index.ts');
  });

  it("checks an editor item's Manual tab on its page under editor/", () => {
    const items = [
      {
        name: 'editor-theme',
        categories: ['editor'],
        files: [
          {
            path: 'registry/bases/base-ui/editor/shared/theme/index.ts',
            type: 'registry:lib',
            target: 'components/editor/shared/theme/index.ts',
          },
        ],
        dependencies: ['next-themes'],
        registryDependencies: [],
      },
    ];
    const sources = {
      'editor/editor-theme': '<ComponentSource name="editor-theme" title="lib/index.ts" />',
    };

    expect(manualProblems(sources, items)).toEqual([
      'editor/editor-theme: titles registry/bases/base-ui/editor/shared/theme/index.ts "lib/index.ts", not "components/editor/shared/theme/index.ts"',
      'editor/editor-theme: installs no package, not pnpm add next-themes',
    ]);
  });

  it('adds Document Editor in its own step before the parts a document feature is built from', () => {
    const toggle = {
      name: 'editor-toggle',
      categories: ['editor'],
      files: [
        {
          path: 'registry/bases/base-ui/editor/document/features/toggle/index.ts',
          type: 'registry:component',
          target: 'components/editor/document/features/toggle/index.ts',
        },
      ],
      dependencies: [],
      registryDependencies: ['@shadcn/utils', '@zui/document-editor'],
    };
    const page = (adds: string[]): Record<string, string> => ({
      'editor/editor-toggle': [
        '<TabsContent value="manual">',
        ...adds,
        '<ComponentSource name="editor-toggle" title="components/editor/document/features/toggle/index.ts" />',
        '</TabsContent>',
      ].join('\n'),
    });

    expect(
      manualProblems(page(['pnpm dlx shadcn@latest add @zui/document-editor', 'pnpm dlx shadcn@latest add utils']), [
        toggle,
      ]),
    ).toEqual([]);
    expect(manualProblems(page(['pnpm dlx shadcn@latest add utils @zui/document-editor']), [toggle])).toEqual([
      'editor/editor-toggle: adds pnpm dlx shadcn@latest add utils @zui/document-editor, not pnpm dlx shadcn@latest add @zui/document-editor; pnpm dlx shadcn@latest add utils',
    ]);
  });

  it("installs the Tailwind plugin an item's css loads as a dev dependency", () => {
    const item = {
      name: 'document-editor',
      categories: ['editor'],
      files: [],
      dependencies: ['lucide-react'],
      registryDependencies: [],
      css: { '@plugin "@tailwindcss/typography"': {} },
    };
    const sources = { 'editor/document-editor': 'pnpm add lucide-react\n' };

    expect(manualProblems(sources, [item])).toEqual([
      'editor/document-editor: installs pnpm add lucide-react, not pnpm add lucide-react; pnpm add -D @tailwindcss/typography',
    ]);
  });

  it("installs every component's files and packages as its item lists them", () => {
    expect(manualProblems(readPageSources([CONTENT]), readComponentItems())).toEqual([]);
  });
});
