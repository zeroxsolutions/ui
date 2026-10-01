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

/** The names registry.json publishes as `registry:example`. */
function readExampleNames(): string[] {
  const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string }[];
  };
  return items.filter((item) => item.type === 'registry:example').map((item) => item.name);
}

/** Every page directly under `components/`, its own index aside, that names nothing `registry.json` publishes as a `registry:component`. */
function nonComponentPages(sources: Record<string, string>, components: Set<string>): string[] {
  return Object.keys(sources)
    .filter((slug) => /^components\/[^/]+$/.test(slug) && slug !== 'components/index')
    .filter((slug) => !components.has(slug.slice('components/'.length)))
    .sort()
    .map((slug) => `${slug}: names no registry:component item`);
}

/**
 * A page's frontmatter `title` and `description`, each a value on one line, unquoted unless YAML requires
 * quoting (a value with its own `: ` must be quoted so the frontmatter parses; prettier picks single or double
 * quotes - double when the text has its own apostrophe, to avoid a doubled `''` escape, single otherwise -
 * and either is stripped here so it still compares equal to the item's unquoted text). A quote prettier picks
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

/** A page's `<TabsContent value="cli">...</TabsContent>` block, where its install command lives. */
function cliBlock(source: string): string {
  return /<TabsContent value="cli">([\s\S]*?)<\/TabsContent>/.exec(source)?.[1] ?? '';
}

/** Every item or primitive page whose CLI tab has no line that is exactly its install command. */
function missingInstallCommands(sources: Record<string, string>, items: Map<string, ItemText>): string[] {
  return namedPages(sources)
    .filter(
      ([, name, source]) =>
        !cliBlock(source)
          .split('\n')
          .some((line) => line.trim() === installCommand(name, items)),
    )
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
  registryDependencies: string[];
}

/** The items registry.json publishes as `registry:component`. */
function readComponentItems(): ComponentItem[] {
  const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
    items: {
      name: string;
      type: string;
      files: RegistryFile[];
      dependencies?: string[];
      registryDependencies?: string[];
    }[];
  };
  return items
    .filter((item) => item.type === 'registry:component')
    .map(({ name, files, dependencies, registryDependencies }) => ({
      name,
      files,
      dependencies: dependencies ?? [],
      registryDependencies: registryDependencies ?? [],
    }));
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

/** Every component with no page. */
function pagelessComponents(sources: Record<string, string>, components: ComponentItem[]): string[] {
  return components.flatMap(({ name }) => (`components/${name}` in sources ? [] : [`${name}: has no page`]));
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

/** What `pnpm dlx shadcn@latest add` takes for a registryDependencies list: `@shadcn/x` bare, a URL as given, in order. */
function registryDependencyNames(registryDependencies: string[]): string[] {
  return registryDependencies.map((dependency) =>
    dependency.startsWith('@shadcn/') ? dependency.slice('@shadcn/'.length) : dependency,
  );
}

/**
 * Every way a component page's Manual tab disagrees with its item: a file with no `ComponentSource`,
 * one titled with another path than the CLI writes it to, two `ComponentSource` blocks naming the same
 * file, `pnpm add` lines naming other packages than the item's `dependencies`, and a
 * `pnpm dlx shadcn@latest add` line naming other names than its `registryDependencies`, in another order.
 */
function manualProblems(sources: Record<string, string>, components: ComponentItem[]): string[] {
  return components.flatMap(({ name, files, dependencies, registryDependencies }) => {
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
    const duplicateProblems = [...new Set(blocks.map((block) => block.file))].flatMap((file) => {
      const count = blocks.filter((block) => block.file === file).length;
      return count > 1 ? [`${slug}: has ${count} ComponentSource blocks for ${file}`] : [];
    });
    const installs = source
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('pnpm add '));
    const expectedInstalls = dependencies.length > 0 ? [`pnpm add ${dependencies.join(' ')}`] : [];
    const dependencyProblems =
      installs.join('\n') === expectedInstalls.join('\n')
        ? []
        : [`${slug}: installs ${installs.join('; ') || 'no package'}, not ${expectedInstalls[0] ?? 'no package'}`];
    // Scoped to the Manual tab so this never reads the CLI tab's own `pnpm dlx shadcn@latest add
    // https://.../<name>.json` line, which installs the item itself, not its registryDependencies.
    const adds = manualBlock(source)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('pnpm dlx shadcn@latest add '));
    const expectedAdds =
      registryDependencies.length > 0
        ? [`pnpm dlx shadcn@latest add ${registryDependencyNames(registryDependencies).join(' ')}`]
        : [];
    const registryProblems =
      adds.join('\n') === expectedAdds.join('\n')
        ? []
        : [`${slug}: adds ${adds.join('; ') || 'nothing'}, not ${expectedAdds[0] ?? 'nothing'}`];
    return [...fileProblems, ...duplicateProblems, ...dependencyProblems, ...registryProblems];
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
  return [...(body ?? '').matchAll(/^\| `([\w-]+)`/gm)].map(([, prop = '']) => prop);
}

/** The group names (`tone`, `variant`, ...) of a `cva` config's own `variants` object, read by their fixed indent. */
function variantKeys(source: string, cvaName: string): string[] {
  const from = new RegExp(`\\b${cvaName} = cva\\(`).exec(source);
  if (!from) return [];
  const variants = /^ {2}variants: \{\n([\s\S]*?)^ {2}\}/m.exec(source.slice(from.index))?.[1];
  return [...(variants ?? '').matchAll(/^ {4}([\w-]+):/gm)].map(([, key = '']) => key);
}

/** The `VariantProps<typeof x>` keys a type's own header (an alias's `=` or an interface's `extends`) reads off `x`'s `cva` config. */
function headerVariantProps(header: string, source: string): string[] {
  return [...header.matchAll(/VariantProps<typeof (\w+)>/g)].flatMap(([, cvaName = '']) =>
    variantKeys(source, cvaName),
  );
}

/**
 * The members `<Name>` declares as an interface or a type alias: its own object-literal body (quoted
 * keys included), plus the variant keys of a `VariantProps<typeof x>` named in its header (an alias's
 * `=` or an interface's `extends`). A header-only alias (no object-literal body) and an empty interface
 * (`{}` on one line, so no member ever starts its own line) both skip the body; undefined where neither
 * a body nor a `VariantProps` is found, so a stale reference does not read into the next statement.
 */
function propsBody(source: string, name: string): Set<string> | undefined {
  const match = new RegExp(`^(?:export )?(?:interface|type) ${name}\\b([^{;]*)(?:\\{\\n([\\s\\S]*?)^\\})?`, 'm').exec(
    source,
  );
  if (!match) return undefined;
  const [, header = '', body] = match;
  const members =
    body === undefined
      ? []
      : [...body.matchAll(/^ {2}(?:readonly )?(?:(\w+)|'([\w-]+)')\??:/gm)].map(
          ([, bare, quoted]) => bare ?? quoted ?? '',
        );
  const variants = headerVariantProps(header, source);
  return body === undefined && variants.length === 0 ? undefined : new Set([...members, ...variants]);
}

/** The identifier a component's own parameter is annotated with, read off `function <name>(` or `function <name>({`. */
function parameterType(source: string, name: string): string | undefined {
  const params = new RegExp(`\\bfunction ${name}\\s*(?:<[^>]*>)?\\(([^)]*)\\)`).exec(source)?.[1];
  return params === undefined ? undefined : /:\s*(\w+)\s*$/.exec(params.trim())?.[1];
}

/**
 * The members of `<Part>Props` in a family's source; undefined where it declares none. Where the part
 * has no `<Part>Props` of its own, follows its parameter's own type alias (`DataTablePaginationPrevious`
 * takes the unexported `DataTablePaginationStep`'s `DataTablePaginationStepProps`).
 */
function declaredProps(source: string, part: string): Set<string> | undefined {
  const own = propsBody(source, `${part}Props`);
  if (own) return own;
  const alias = parameterType(source, part);
  return alias === undefined ? own : propsBody(source, alias);
}

/** What a `PROPS_READ_ELSEWHERE` entry allows: the props it lists skip the declared-prop check, for the reason given. */
interface ReadElsewhere {
  props: string[];
  reason: string;
}

/** Parts whose table lists props their own file does not declare as `<Part>Props`, with where those props come from. */
const PROPS_READ_ELSEWHERE: Record<string, ReadElsewhere> = {
  LanguageCombobox: {
    props: ['kind', 'options', 'locales', 'value', 'onValueChange'],
    reason:
      "takes LanguageOptionSource (kind, options, locales - declared in types/language-option.ts) & Omit<ComboboxPrimitive.Root.Props<LanguageOption>, ...> & { value; onValueChange }; this check reads only two-space-indented members, and the intersection's own value/onValueChange sit four spaces in, inside a destructured parameter this check also walks into.",
  },
  Center: {
    props: ['inline', 'render'],
    reason:
      "takes useRender.ComponentProps<'div'> & VariantProps<typeof centerVariants> inline on the function's parameter, declaring no named CenterProps for this check to find.",
  },
};

/**
 * Every component page whose API reference documents other parts than its file exports, in another
 * order, or a prop the part does not declare.
 */
function apiProblems(
  sources: Record<string, string>,
  components: ComponentItem[],
  sourceOf: (item: ComponentItem) => string,
  readElsewhere: Record<string, ReadElsewhere>,
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
      const allowed = readElsewhere[part]?.props ?? [];
      const unexempt = listed.filter((prop) => !allowed.includes(prop));
      if (unexempt.length === 0) return [];
      const declared = declaredProps(code, part);
      if (!declared) return [`${slug}: ${part} lists props, but its source declares no ${part}Props`];
      return unexempt.filter((prop) => !declared.has(prop)).map((prop) => `${slug}: ${part} has no prop \`${prop}\``);
    });
    return [...headingProblems, ...propProblems];
  });
}

/** An item's first file, which holds its family. */
function familySource(item: ComponentItem): string {
  return readFileSync(join(APP, item.files[0]?.path ?? ''), 'utf8');
}

/**
 * Every `PROPS_READ_ELSEWHERE` entry gone stale: its key names no exported part of a documented
 * component, that part's page has no table for it, or an allowed prop is not in that table.
 */
function readElsewhereProblems(
  sources: Record<string, string>,
  components: ComponentItem[],
  readElsewhere: Record<string, ReadElsewhere>,
  sourceOf: (item: ComponentItem) => string = familySource,
): string[] {
  return Object.entries(readElsewhere).flatMap(([part, { props }]) => {
    const owner = components.find(
      (item) => sources[`components/${item.name}`] !== undefined && exportedNames(sourceOf(item)).includes(part),
    );
    if (!owner) return [`${part}: is not an exported part of any documented component`];
    const listed = tableProps(sources[`components/${owner.name}`] ?? '', part);
    if (listed.length === 0) return [`${part}: has no table in its page`];
    return props
      .filter((prop) => !listed.includes(prop))
      .map((prop) => `${part}: allows \`${prop}\`, which its table does not list`);
  });
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

  it("names every registry:example in some page's preview", () => {
    expect(unusedExamples(readPageSources(CONTENT), readExampleNames())).toEqual([]);
  });

  it('reports an example no page previews, naming it in a ComponentSource aside', () => {
    const sources = {
      'components/status-indicator': [
        '<ComponentPreview name="status-indicator-demo" />',
        '<ComponentSource name="status-indicator-tones" />',
      ].join('\n'),
    };

    expect(unusedExamples(sources, ['status-indicator-demo', 'status-indicator-tones'])).toEqual([
      "status-indicator-tones: is named by no page's preview",
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

  it('matches a single- or double-quoted frontmatter description to the item it quotes', () => {
    const items = new Map([
      ['model-info-card', { title: 'Model Info Card', description: 'The detail panel: an identity header.' }],
      ['tool-call-card', { title: 'Tool Call Card', description: "One tool call: the call's status." }],
    ]);
    const sources = {
      // Single-quoted: no quote character of its own to escape.
      'components/model-info-card': [
        '---',
        'title: Model Info Card',
        "description: 'The detail panel: an identity header.'",
        '---',
      ].join('\n'),
      // Double-quoted: its own apostrophe would need doubling inside single quotes, so it quotes with
      // double instead (prettier's own choice - confirmed by running it on a fixture with this text).
      'components/tool-call-card': [
        '---',
        'title: Tool Call Card',
        'description: "One tool call: the call\'s status."',
        '---',
      ].join('\n'),
    };

    expect(unnamedPages(sources, items)).toEqual([]);
  });

  it('reports a quoted frontmatter description that does not match the item', () => {
    const items = new Map([
      ['model-info-card', { title: 'Model Info Card', description: 'The detail panel: an identity header.' }],
    ]);
    const sources = {
      'components/model-info-card': [
        '---',
        'title: Model Info Card',
        "description: 'A different panel: not the item.'",
        '---',
      ].join('\n'),
    };

    expect(unnamedPages(sources, items)).toEqual(["components/model-info-card: description is not the item's"]);
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

  it('reports a page that installs its subject some other way, even where the right line sits in its Manual tab', () => {
    const items = new Map([['status-indicator', { title: 'Status Indicator', description: 'A small dot.' }]]);
    const sources = {
      'components/button':
        '<TabsContent value="cli">\n```bash\npnpm dlx shadcn@latest add button-group\n```\n</TabsContent>',
      'components/status-indicator': [
        '<TabsContent value="cli">',
        '```bash',
        'pnpm dlx shadcn@latest add status-indicator',
        '```',
        '</TabsContent>',
        '<TabsContent value="manual">',
        '```bash',
        'pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json',
        '```',
        '</TabsContent>',
      ].join('\n'),
    };

    expect(missingInstallCommands(sources, items)).toEqual([
      'components/button: has no `pnpm dlx shadcn@latest add button`',
      'components/status-indicator: has no `pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json`',
    ]);
  });

  it('gives every component a page', () => {
    expect(pagelessComponents(readPageSources(CONTENT), readComponentItems())).toEqual([]);
  });

  it('reports a component with no page', () => {
    const components = [
      { name: 'status-indicator', files: [], dependencies: [], registryDependencies: [] },
      { name: 'tag-input', files: [], dependencies: [], registryDependencies: [] },
    ];
    const sources = { 'components/status-indicator': '' };

    expect(pagelessComponents(sources, components)).toEqual(['tag-input: has no page']);
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

  it('reports a missing file, a file titled with the wrong path, a file two blocks name, and the wrong packages', () => {
    const components = [
      {
        name: 'status-indicator',
        files: [
          { path: 'registry/bases/base-ui/components/feedback/status-indicator.tsx', type: 'registry:component' },
          { path: 'registry/bases/base-ui/types/status-tone.ts', type: 'registry:lib' },
        ],
        dependencies: ['lucide-react'],
        registryDependencies: ['@shadcn/utils', 'https://lucide-animated.com/r/circle.json'],
      },
    ];
    const sources = {
      'components/status-indicator': [
        '<ComponentSource name="status-indicator" title="components/status-indicator.tsx" />',
        '<ComponentSource name="status-indicator" title="components/feedback/status-indicator.tsx" />',
        '<TabsContent value="manual">',
        '```bash',
        'pnpm add react',
        '```',
        '```bash',
        'pnpm dlx shadcn@latest add utils',
        '```',
        '</TabsContent>',
      ].join('\n'),
    };

    expect(manualProblems(sources, components)).toEqual([
      'components/status-indicator: titles registry/bases/base-ui/components/feedback/status-indicator.tsx "components/status-indicator.tsx", not "components/feedback/status-indicator.tsx"',
      'components/status-indicator: has no ComponentSource for registry/bases/base-ui/types/status-tone.ts',
      'components/status-indicator: has 2 ComponentSource blocks for registry/bases/base-ui/components/feedback/status-indicator.tsx',
      'components/status-indicator: installs pnpm add react, not pnpm add lucide-react',
      'components/status-indicator: adds pnpm dlx shadcn@latest add utils, not pnpm dlx shadcn@latest add utils https://lucide-animated.com/r/circle.json',
    ]);
  });

  it('documents exactly the parts each component exports, with props each part declares', () => {
    expect(apiProblems(readPageSources(CONTENT), readComponentItems(), familySource, PROPS_READ_ELSEWHERE)).toEqual([]);
  });

  it('reports a missing part, and a prop the part does not declare', () => {
    const item = { name: 'tag-input', files: [], dependencies: [], registryDependencies: [] };
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

  it('reports a hyphenated prop a quoted key does not declare, and takes one that it does', () => {
    const item = { name: 'status-chip', files: [], dependencies: [], registryDependencies: [] };
    const missing = ['interface StatusChipProps {', '  label: string;', '}', 'export { StatusChip };'].join('\n');
    const declared = ['interface StatusChipProps {', "  'aria-label': string;", '}', 'export { StatusChip };'].join(
      '\n',
    );
    const page = [
      '## API reference',
      '',
      '### StatusChip',
      '',
      '| Prop | Type | Default |',
      '| --- | --- | --- |',
      '| `aria-label` | `string` | required |',
    ].join('\n');

    expect(apiProblems({ 'components/status-chip': page }, [item], () => missing, {})).toEqual([
      'components/status-chip: StatusChip has no prop `aria-label`',
    ]);
    expect(apiProblems({ 'components/status-chip': page }, [item], () => declared, {})).toEqual([]);
  });

  it('exempts only the props a PROPS_READ_ELSEWHERE entry lists, not the whole part', () => {
    const item = { name: 'status-chip', files: [], dependencies: [], registryDependencies: [] };
    const code = ['interface StatusChipProps {', '  tone: string;', '}', 'export { StatusChip };'].join('\n');
    const page = [
      '## API reference',
      '',
      '### StatusChip',
      '',
      '| Prop | Type | Default |',
      '| --- | --- | --- |',
      '| `tone` | `string` | required |',
      '| `size` | `string` | required |',
    ].join('\n');
    const readElsewhere = { StatusChip: { props: ['size'], reason: 'test fixture' } };

    expect(apiProblems({ 'components/status-chip': page }, [item], () => code, readElsewhere)).toEqual([]);

    const withoutTone = ['interface StatusChipProps {', '}', 'export { StatusChip };'].join('\n');
    expect(apiProblems({ 'components/status-chip': page }, [item], () => withoutTone, readElsewhere)).toEqual([
      'components/status-chip: StatusChip has no prop `tone`',
    ]);
  });

  it('allows every PROPS_READ_ELSEWHERE entry, each a real part with a table listing every allowed prop', () => {
    expect(readElsewhereProblems(readPageSources(CONTENT), readComponentItems(), PROPS_READ_ELSEWHERE)).toEqual([]);
  });

  it('reports an allowed prop its table drops, a part with no table, and an entry for no documented part', () => {
    const item = { name: 'status-chip', files: [], dependencies: [], registryDependencies: [] };
    const code = ['export { StatusChip, StatusChipIcon };'].join('\n');
    const sources = {
      'components/status-chip': [
        '## API reference',
        '',
        '### StatusChip',
        '',
        '| Prop | Type | Default |',
        '| --- | --- | --- |',
        '| `tone` | `string` | required |',
        '',
        '### StatusChipIcon',
      ].join('\n'),
    };
    const readElsewhere = {
      StatusChip: { props: ['tone', 'size'], reason: 'test fixture' },
      StatusChipIcon: { props: ['tone'], reason: 'test fixture' },
      Nonexistent: { props: [], reason: 'test fixture' },
    };

    expect(readElsewhereProblems(sources, [item], readElsewhere, () => code)).toEqual([
      'StatusChip: allows `size`, which its table does not list',
      'StatusChipIcon: has no table in its page',
      'Nonexistent: is not an exported part of any documented component',
    ]);
  });

  it('names an aliased export by the name it exports as, skips a type export, and keeps a lowercase export', () => {
    const item = { name: 'markdown-view', files: [], dependencies: [], registryDependencies: [] };
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
