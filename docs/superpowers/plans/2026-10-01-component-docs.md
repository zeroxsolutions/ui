# Component Docs (c4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every one of the registry's 42 components has a hand-written docs page in upstream shadcn's shape, held to its item by checks that read `registry.json` and the item's source.

**Architecture:** The pages are MDX under `apps/registry-ui/content/docs/components/`, written by hand. `src/lib/source.spec.ts` gains the checks that compare each page with what the registry and the source own (files and their install paths, dependencies, exported parts, declared props). A shrinking `UNDOCUMENTED` set lets the checks land first and go green kind by kind; the last content task deletes it. One e2e case walks every component page on the worker.

**Tech Stack:** Next 16 + fumadocs-mdx 15.4.5, vitest (jsdom, plus `// @vitest-environment node` for `source.spec.ts`), Playwright on the worker (port 8787), nx, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-01-component-docs-design.md`

## Global Constraints

- Every page is written by hand; nothing on a page is generated.
- Page shape, in order: frontmatter `title`/`description` (equal to `registry.json`), `<ComponentPreview name="<item>-demo" />`, `## Installation`, `## Usage`, `## Composition` (only for a family of two or more parts), feature sections (only where the demo cannot show a state), `## API reference` with one `### <Part>` per exported part in export order.
- Headings are sentence case (`API reference`, not `API Reference`); an item's or a package's name keeps its own case.
- Installation is `<CodeTabs>` with tabs `Command` and `Manual`, as `content/docs/components/status-indicator.mdx` already has it. Command: `pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<name>.json`.
- Manual is `<Steps>`: (1) `pnpm add <dependencies>` in `registry.json` order, only when the item has dependencies; (2) one `pnpm dlx shadcn@latest add ...` line for its `registryDependencies`, a `@shadcn/<x>` entry written as `<x>`, a URL written as the URL; (3) one `<ComponentSource name="<item>" title="<install path>" />` per file, the first without `file`, every other with `file="<registry path>"`; (4) any step only this item needs; (5) "Update the import paths to match your project."
- Install paths: a `registry:component` file keeps its path from `components/` on; a `registry:lib` file is `lib/<file name>`; a `registry:hook` file is `hooks/<file name>` (the shadcn CLI 4.21.0's own resolution). The facts under each task already give each file's install path.
- API reference: a part with props of its own gets `| Prop | Type | Default |` rows whose first cell is the backticked prop name, each a member of the part's `<Part>Props` in the source; a `|` inside a type is written `\|`. A part that only takes an element's or a primitive's props says so in one line ("Renders a `span` and takes every prop a `span` takes."), linking shadcn's or Base UI's page for a primitive. Each part lists the `data-*` it sets and what they mean.
- Copy is sentence case; every run of text is plain ASCII.
- A feature section is a new `registry:example` with its own `registry.json` entry and its own demo file under `registry/bases/base-ui/examples/`; add one only for a state the existing demo never reaches.
- Load the gundam skill that governs a file with the Skill tool before writing it (`writing-prose` and `cutting-ai-tells` for page prose, `writing-unit-tests` for specs, `writing-e2e-tests` for the e2e case, `writing-a-component` for an example). Never `--no-verify`. Port 3000 is the user's `next dev`; the e2e uses 8787.

## Review Focus

- A long union type in an API table widens the page at 390: the `table` mapping in `mdx-components.tsx` already scrolls a wide table inside the column; the e2e case in Task 9 asserts no sideways scroll on every component page.
- A demo that throws on load (an emoji or file-tree demo reaching for data) leaves a page blank: the Task 9 e2e case fails on any `pageerror`.
- A `|` left unescaped inside a type breaks the table: the `tableProps` check reads rows by their first cell, so a broken row drops its prop and the heading check still passes; Task 9's screenshot review of Data Table and the per-task review read each table.
- A Manual tab that installs the item's own registry dependencies but forgets one: no check covers `registryDependencies`; each task's review compares step 2 with the facts list.
- A page added under `components/` for something that is not a `registry:component`: already caught by `nonComponentPages` in `source.spec.ts`.

---

### Task 1: The checks, the ComponentSource title, and Status Indicator in the new shape

**Files:**

- Modify: `apps/registry-ui/src/lib/source.spec.ts`
- Modify: `apps/registry-ui/src/mdx-components.tsx` (the `ComponentSource` entry)
- Modify: `apps/registry-ui/src/mdx-components.spec.tsx`
- Modify: `apps/registry-ui/content/docs/components/status-indicator.mdx`

**Interfaces:**

- Produces, in `source.spec.ts`: `UNDOCUMENTED` (the set later tasks shrink), `readComponentItems()`, `installTarget(file)`, `pagelessComponents()`, `manualProblems()`, `apiProblems()`, `PROPS_READ_ELSEWHERE` (a part name to the reason its props are not a `<Part>Props` in its own file; later tasks add entries).
- Produces, in MDX: `<ComponentSource name title file? />`, where `title` is the install path shown in the block's header.

- [ ] **Step 1: Write the failing checks**

Add to `source.spec.ts`, after `missingInstallCommands`:

```ts
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
  'ai-provider-card',
  'avatar-picker',
  'center',
  'chat-message',
  'chat-suggestion-item',
  'code-block',
  'collapsible-card',
  'command-menu',
  'copy-button',
  'data-table',
  'data-table-column-header',
  'editor-tab',
  'emoji-appearance-toggle-group',
  'emoji-picker',
  'file-tree',
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

/** The names a family file exports in its last `export { }`, in order, its type exports aside. */
function exportedNames(source: string): string[] {
  const lists = [...source.matchAll(/^export \{([^}]*)\};/gm)];
  return (lists.at(-1)?.[1] ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '' && !name.startsWith('type '));
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
const PROPS_READ_ELSEWHERE: Record<string, string> = {};

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
```

Add inside `describe('content/docs', ...)`:

````ts
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
  expect(installTarget({ path: 'registry/bases/base-ui/hooks/use-controllable-state.ts', type: 'registry:hook' })).toBe(
    'hooks/use-controllable-state.ts',
  );
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
````

- [ ] **Step 2: Run the checks to see what fails**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: the five fixture cases PASS; `installs every component's files and packages as its item lists them` FAILS on `components/status-indicator` (its ComponentSources have no `title`), and `documents exactly the parts ...` FAILS if the Status Indicator page's headings differ from its exports. `gives every component a page ...` PASSES (the 41 are in `UNDOCUMENTED`).

- [ ] **Step 3: Show a ComponentSource's `title` in its header**

Add to `describe` in `mdx-components.spec.tsx` a case for the `ComponentSource` entry, following the file's own `render` + `act` pattern:

```tsx
describe('mdxComponents.ComponentSource', () => {
  it('heads the source with the path its title gives', async () => {
    const { ComponentSource } = mdxComponents;
    render(<ComponentSource name="status-indicator" code="export {};" language="tsx" title="lib/status-tone.ts" />);
    await act(async () => {});

    expect(screen.getByText('lib/status-tone.ts')).toBeTruthy();
  });
});
```

Run it, see it fail (the header shows no title), then change the `ComponentSource` entry in `mdx-components.tsx` to take `title` out of the props and show it, falling back to the file's name:

```tsx
  ComponentSource: ({ file, title, ...props }: ComponentProps<typeof ComponentSource>) => (
    <ComponentSource file={file} className="mt-6" {...props}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{props.language}</SourceCodeBlockLanguage>
          {title || file ? <SourceCodeBlockFile>{title ?? file?.split('/').pop()}</SourceCodeBlockFile> : null}
        </SourceCodeBlockTitle>
```

(the rest of the entry is unchanged; `title` is already in `ComponentSourceProps`, which takes a div's props, so destructuring it keeps it off the element). Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/mdx-components.spec.tsx` - PASS.

- [ ] **Step 4: Move the Status Indicator page to the new shape**

In `content/docs/components/status-indicator.mdx`:

- the first source becomes `<ComponentSource name="status-indicator" title="components/feedback/status-indicator.tsx" />`;
- the second becomes `<ComponentSource name="status-indicator" file="registry/bases/base-ui/types/status-tone.ts" title="lib/status-tone.ts" />`;
- the `utils` step stays as the registryDependencies step: `pnpm dlx shadcn@latest add utils`;
- `## API reference` keeps one `### StatusIndicator` (its file exports only `StatusIndicator`).

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS, every case.

- [ ] **Step 5: Run the gate and commit**

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

```bash
git add apps/registry-ui/src/lib/source.spec.ts apps/registry-ui/src/mdx-components.tsx apps/registry-ui/src/mdx-components.spec.tsx apps/registry-ui/content/docs/components/status-indicator.mdx
git commit -m "test(registry-ui): hold every component page to its item's files, packages and parts"
```

---

### Task 2: Data display, first half

**Files:**

- Create: `apps/registry-ui/content/docs/components/ai-provider-card.mdx`
- Create: `apps/registry-ui/content/docs/components/chat-message.mdx`
- Create: `apps/registry-ui/content/docs/components/code-block.mdx`
- Create: `apps/registry-ui/content/docs/components/data-table.mdx`
- Create: `apps/registry-ui/content/docs/components/data-table-column-header.mdx`
- Create: `apps/registry-ui/content/docs/components/file-tree.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`; `PROPS_READ_ELSEWHERE` if a part needs an entry)

- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **ai-provider-card** - title `AI Provider Card`; demo `ai-provider-card-demo` yes
  - files: `components/data-display/ai-provider-card.tsx` -> `components/data-display/ai-provider-card.tsx`, `types/status-tone.ts` -> `lib/status-tone.ts`
  - dependencies: none
  - registryDependencies: `@shadcn/card`, `@shadcn/utils`
  - parts (export order): `AiProviderCard`, `AiProviderCardAction`, `AiProviderCardDescription`, `AiProviderCardLabel`, `AiProviderCardTrigger`
  - props types: `AiProviderCardProps`
- **chat-message** - title `Chat Message`; demo `chat-message-demo` yes
  - files: `components/data-display/chat-message.tsx` -> `components/data-display/chat-message.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/message`, `@shadcn/utils`
  - parts (export order): `ChatMessage`, `ChatMessageAccent`
  - props types: `ChatMessageProps`
- **code-block** - title `Code Block`; demo `code-block-demo` yes
  - files: `components/data-display/code-block.tsx` -> `components/data-display/code-block.tsx`, `hooks/use-highlighted-lines.ts` -> `hooks/use-highlighted-lines.ts`, `lib/code-language.ts` -> `lib/code-language.ts`, `lib/code-theme.ts` -> `lib/code-theme.ts`, `lib/language-options.tsx` -> `lib/language-options.tsx`, `lib/mermaid-grammar.ts` -> `lib/mermaid-grammar.ts`, `lib/shiki.ts` -> `lib/shiki.ts`, `types/language-option.ts` -> `lib/language-option.ts`
  - dependencies: `@base-ui/react`, `@shikijs/langs`, `@zeroxsolutions/icons`, `shiki`
  - registryDependencies: `@shadcn/scroll-area`, `@shadcn/utils`, `https://ui.zeroxsolutions.com/r/collapsible-card.json`, `https://ui.zeroxsolutions.com/r/copy-button.json`, `https://ui.zeroxsolutions.com/r/highlighted-code.json`
  - parts (export order): `CodeBlock`, `CodeBlockActions`, `CodeBlockContent`, `CodeBlockLineNumbers`, `CodeBlockCode`, `CodeBlockLanguage`, `CodeBlockCopy`
  - props types: `CodeBlockCopyProps`, `CodeBlockProps`, `ComponentProps`, `CopyButtonProps`
- **data-table** - title `Data Table`; demo `data-table-demo` yes
  - files: `components/data-display/data-table.tsx` -> `components/data-display/data-table.tsx`
  - dependencies: `@tanstack/react-table`, `lucide-react`
  - registryDependencies: `@shadcn/button`, `@shadcn/dropdown-menu`, `@shadcn/empty`, `@shadcn/table`, `@shadcn/utils`, `https://lucide-animated.com/r/chevron-left.json`, `https://lucide-animated.com/r/chevron-right.json`
  - parts (export order): `DataTable`, `DataTableToolbar`, `DataTableView`, `DataTableEmpty`, `useDataTable`, `DataTablePagination`, `DataTablePaginationPrevious`, `DataTablePaginationNext`, `DataTableViewOptions`
  - props types: `DataTablePaginationStepProps`, `DataTableProps`
- **data-table-column-header** - title `Data Table Column Header`; demo `data-table-column-header-demo` yes
  - files: `components/data-display/data-table-column-header.tsx` -> `components/data-display/data-table-column-header.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/button`, `@shadcn/dropdown-menu`, `@shadcn/utils`, `https://lucide-animated.com/r/arrow-down.json`, `https://lucide-animated.com/r/arrow-up.json`, `https://lucide-animated.com/r/chevrons-up-down.json`, `https://lucide-animated.com/r/eye-off.json`
  - parts (export order): `DataTableColumnHeader`, `DataTableColumnHeaderTrigger`, `DataTableColumnHeaderContent`, `DataTableColumnHeaderSortAscending`, `DataTableColumnHeaderSortDescending`, `DataTableColumnHeaderHide`
  - props types: `DataTableColumnHeaderProps`
- **file-tree** - title `File Tree`; demo `file-tree-demo` yes
  - files: `components/data-display/file-tree.tsx` -> `components/data-display/file-tree.tsx`, `hooks/use-controllable-state.ts` -> `hooks/use-controllable-state.ts`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`, `https://lucide-animated.com/r/chevron-right.json`
  - parts (export order): `FileTree`, `FileTreeItem`, `FileTreeLabel`, `FileTreeGroup`
  - props types: `FileTreeGroupProps`, `FileTreeItemProps`, `FileTreeLabelProps`, `FileTreeProps`

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `ai-provider-card`, `chat-message`, `code-block`, `data-table`, `data-table-column-header`, `file-tree`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 6: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of ai-provider-card's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts
git commit -m "docs(registry-ui): document the data display components"
```

---

### Task 3: Data display, second half

**Files:**

- Create: `apps/registry-ui/content/docs/components/file-type-icon.mdx`
- Create: `apps/registry-ui/content/docs/components/font-preview.mdx`
- Create: `apps/registry-ui/content/docs/components/highlighted-code.mdx`
- Create: `apps/registry-ui/content/docs/components/image-preview.mdx`
- Create: `apps/registry-ui/content/docs/components/markdown-view.mdx`
- Create: `apps/registry-ui/content/docs/components/model-info-card.mdx`
- Create: `apps/registry-ui/content/docs/components/tree-item.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`; `PROPS_READ_ELSEWHERE` if a part needs an entry)

- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **file-type-icon** - title `File Type Icon`; demo `file-type-icon-demo` yes
  - files: `components/data-display/file-type-icon.tsx` -> `components/data-display/file-type-icon.tsx`, `lib/file-type.ts` -> `lib/file-type.ts`
  - dependencies: `lucide-react`
  - registryDependencies: none
  - parts (export order): `FileTypeIcon`
  - props types: `FileTypeIconProps`
- **font-preview** - title `Font Preview`; demo `font-preview-demo` yes
  - files: `components/data-display/font-preview.tsx` -> `components/data-display/font-preview.tsx`, `lib/font-format.ts` -> `lib/font-format.ts`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `FontPreview`
  - props types: `ComponentProps`, `FontPreviewProps`
- **highlighted-code** - title `Highlighted Code`; demo `highlighted-code-demo` yes
  - files: `components/data-display/highlighted-code.tsx` -> `components/data-display/highlighted-code.tsx`, `lib/code-theme.ts` -> `lib/code-theme.ts`, `lib/mermaid-grammar.ts` -> `lib/mermaid-grammar.ts`, `lib/shiki.ts` -> `lib/shiki.ts`
  - dependencies: `@shikijs/langs`, `shiki`
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `HighlightedCode`
  - props types: `ComponentProps`, `HighlightedCodeProps`
- **image-preview** - title `Image Preview`; demo `image-preview-demo` yes
  - files: `components/data-display/image-preview.tsx` -> `components/data-display/image-preview.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `ImagePreview`, `ImagePreviewImage`
  - props types: none
- **markdown-view** - title `Markdown View`; demo `markdown-view-demo` yes
  - files: `components/data-display/markdown-view.tsx` -> `components/data-display/markdown-view.tsx`, `lib/code-language.ts` -> `lib/code-language.ts`
  - dependencies: `react-markdown`, `remark-gfm`
  - registryDependencies: `@shadcn/table`, `@shadcn/utils`, `https://ui.zeroxsolutions.com/r/code-block.json`, `https://ui.zeroxsolutions.com/r/collapsible-card.json`
  - parts (export order): `MemoizedMarkdownView as MarkdownView`
  - props types: `ComponentProps`, `ExtraProps`, `MarkdownViewProps`
- **model-info-card** - title `Model Info Card`; demo `model-info-card-demo` yes
  - files: `components/data-display/model-info-card.tsx` -> `components/data-display/model-info-card.tsx`
  - dependencies: `class-variance-authority`
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `ModelInfoCard`, `ModelInfoCardIndicator`, `ModelInfoCardSection`
  - props types: `ModelInfoCardIndicatorProps`, `VariantProps`
- **tree-item** - title `Tree Item`; demo `tree-item-demo` yes
  - files: `components/data-display/tree-item.tsx` -> `components/data-display/tree-item.tsx`, `lib/ime.ts` -> `lib/ime.ts`
  - dependencies: none
  - registryDependencies: `@shadcn/button`, `@shadcn/input`, `@shadcn/item`, `@shadcn/utils`, `https://lucide-animated.com/r/chevron-right.json`
  - parts (export order): `TreeItem`, `TreeItemIndent`, `TreeItemTrigger`, `TreeItemLabel`, `TreeItemRenameInput`
  - props types: `TreeItemIndentProps`, `TreeItemProps`, `TreeItemRenameInputProps`

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `file-type-icon`, `font-preview`, `highlighted-code`, `image-preview`, `markdown-view`, `model-info-card`, `tree-item`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 6: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of file-type-icon's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts
git commit -m "docs(registry-ui): document the data display components"
```

---

### Task 4: Data entry, first half

**Files:**

- Create: `apps/registry-ui/content/docs/components/avatar-picker.mdx`
- Create: `apps/registry-ui/content/docs/components/chat-suggestion-item.mdx`
- Create: `apps/registry-ui/content/docs/components/emoji-appearance-toggle-group.mdx`
- Create: `apps/registry-ui/content/docs/components/emoji-picker.mdx`
- Create: `apps/registry-ui/content/docs/components/frontmatter-form.mdx`
- Create: `apps/registry-ui/content/docs/components/language-combobox.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`; `PROPS_READ_ELSEWHERE` if a part needs an entry)

- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **avatar-picker** - title `Avatar Picker`; demo `avatar-picker-demo` yes
  - files: `components/data-entry/avatar-picker.tsx` -> `components/data-entry/avatar-picker.tsx`
  - dependencies: `lucide-react`
  - registryDependencies: `@shadcn/button`, `@shadcn/empty`, `@shadcn/field`, `@shadcn/input`, `@shadcn/popover`, `@shadcn/tabs`, `@shadcn/utils`, `https://ui.zeroxsolutions.com/r/emoji-picker.json`
  - parts (export order): `AvatarPicker`, `AvatarPickerTrigger`, `AvatarPickerContent`, `AvatarPickerRemoveButton`, `AvatarPickerEmojiContent`, `AvatarPickerUploadContent`, `AvatarPickerUploadTrigger`, `AvatarPickerColorContent`, `AvatarPickerColorGroup`, `AvatarPickerColorField`
  - props types: `AvatarPickerColorGroupProps`, `AvatarPickerProps`, `AvatarPickerUploadContentProps`
- **chat-suggestion-item** - title `Chat Suggestion Item`; demo `chat-suggestion-item-demo` yes
  - files: `components/data-entry/chat-suggestion-item.tsx` -> `components/data-entry/chat-suggestion-item.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/item`, `@shadcn/utils`
  - parts (export order): `ChatSuggestionItem`
  - props types: `ChatSuggestionItemProps`
- **emoji-appearance-toggle-group** - title `Emoji Appearance Toggle Group`; demo `emoji-appearance-toggle-group-demo` yes
  - files: `components/data-entry/emoji-appearance-toggle-group.tsx` -> `components/data-entry/emoji-appearance-toggle-group.tsx`
  - dependencies: `@zeroxsolutions/fluent-emoji`
  - registryDependencies: `@shadcn/toggle-group`
  - parts (export order): `EmojiAppearanceToggleGroup`, `EmojiAppearanceToggleGroupItem`
  - props types: `EmojiAppearanceToggleGroupItemProps`, `EmojiAppearanceToggleGroupProps`
- **emoji-picker** - title `Emoji Picker`; demo `emoji-picker-demo` yes
  - files: `components/data-entry/emoji-picker.tsx` -> `components/data-entry/emoji-picker.tsx`
  - dependencies: `@zeroxsolutions/fluent-emoji`, `lucide-react`
  - registryDependencies: `@shadcn/button`, `@shadcn/input-group`, `@shadcn/scroll-area`, `@shadcn/toggle-group`, `@shadcn/utils`, `https://lucide-animated.com/r/clock.json`, `https://lucide-animated.com/r/coffee.json`, `https://lucide-animated.com/r/leaf.json`, `https://lucide-animated.com/r/search.json`, `https://lucide-animated.com/r/smile.json`
  - parts (export order): `EmojiPicker`, `EmojiPickerSearch`, `EmojiPickerContent`, `EmojiPickerEmpty`, `EmojiPickerNav`, `EmojiPickerGroupLabel`
  - props types: `EmojiPickerCellProps`, `EmojiPickerContentProps`, `EmojiPickerProps`, `EmojiPickerSearchProps`
- **frontmatter-form** - title `Frontmatter Form`; demo `frontmatter-form-demo` yes
  - files: `components/data-entry/frontmatter-form.tsx` -> `components/data-entry/frontmatter-form.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/field`
  - parts (export order): `useFrontmatterFormField`, `FrontmatterForm`, `FrontmatterFormField`, `FrontmatterFormFieldLabel`, `FrontmatterFormFieldControl`, `FrontmatterFormFieldError`
  - props types: `FrontmatterFormFieldControlElementProps`, `FrontmatterFormFieldControlProps`, `FrontmatterFormFieldProps`, `FrontmatterFormProps`
- **language-combobox** - title `Language Combobox`; demo `language-combobox-demo` yes
  - files: `components/data-entry/language-combobox.tsx` -> `components/data-entry/language-combobox.tsx`, `hooks/use-language-options.ts` -> `hooks/use-language-options.ts`, `lib/language-options.tsx` -> `lib/language-options.tsx`, `types/language-option.ts` -> `lib/language-option.ts`
  - dependencies: `@base-ui/react`, `@zeroxsolutions/icons`
  - registryDependencies: `@shadcn/combobox`
  - parts (export order): `LanguageCombobox`
  - props types: `LanguageComboboxProps`

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `avatar-picker`, `chat-suggestion-item`, `emoji-appearance-toggle-group`, `emoji-picker`, `frontmatter-form`, `language-combobox`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 6: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of avatar-picker's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts
git commit -m "docs(registry-ui): document the data entry components"
```

---

### Task 5: Data entry, second half

**Files:**

- Create: `apps/registry-ui/content/docs/components/language-toggle-group.mdx`
- Create: `apps/registry-ui/content/docs/components/number-field.mdx`
- Create: `apps/registry-ui/content/docs/components/password-input.mdx`
- Create: `apps/registry-ui/content/docs/components/resize-handle.mdx`
- Create: `apps/registry-ui/content/docs/components/tag-input.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`; `PROPS_READ_ELSEWHERE` if a part needs an entry)

- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **language-toggle-group** - title `Language Toggle Group`; demo `language-toggle-group-demo` yes
  - files: `components/data-entry/language-toggle-group.tsx` -> `components/data-entry/language-toggle-group.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/toggle-group`
  - parts (export order): `LanguageToggleGroup`
  - props types: `LanguageToggleGroupProps`
- **number-field** - title `Number Field`; demo `number-field-demo` yes
  - files: `components/data-entry/number-field.tsx` -> `components/data-entry/number-field.tsx`, `lib/expr-eval.ts` -> `lib/expr-eval.ts`
  - dependencies: none
  - registryDependencies: `@shadcn/input-group`, `@shadcn/utils`
  - parts (export order): `NumberField`, `NumberFieldInput`
  - props types: `NumberFieldInputProps`, `NumberFieldProps`
- **password-input** - title `Password Input`; demo `password-input-demo` yes
  - files: `components/data-entry/password-input.tsx` -> `components/data-entry/password-input.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/input-group`, `https://lucide-animated.com/r/eye.json`, `https://lucide-animated.com/r/eye-off.json`
  - parts (export order): `PasswordInput`, `PasswordInputInput`, `PasswordInputToggle`
  - props types: none
- **resize-handle** - title `Resize Handle`; demo `resize-handle-demo` yes
  - files: `components/data-entry/resize-handle.tsx` -> `components/data-entry/resize-handle.tsx`, `lib/resize-drag.ts` -> `lib/resize-drag.ts`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `ResizeHandle`
  - props types: `ComponentProps`, `ResizeHandleProps`
- **tag-input** - title `Tag Input`; demo `tag-input-demo` yes
  - files: `components/data-entry/tag-input.tsx` -> `components/data-entry/tag-input.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/badge`, `@shadcn/button`, `@shadcn/input`, `@shadcn/utils`, `https://lucide-animated.com/r/x.json`
  - parts (export order): `TagInput`, `TagInputList`, `TagInputTag`, `TagInputTagRemove`, `TagInputInput`
  - props types: `TagInputProps`, `TagInputTagProps`

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `language-toggle-group`, `number-field`, `password-input`, `resize-handle`, `tag-input`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 6: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of language-toggle-group's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts
git commit -m "docs(registry-ui): document the data entry components"
```

---

### Task 6: Feedback

**Files:**

- Create: `apps/registry-ui/content/docs/components/copy-button.mdx`
- Create: `apps/registry-ui/content/docs/components/permission-card.mdx`
- Create: `apps/registry-ui/content/docs/components/tool-call-card.mdx`
- Create: `apps/registry-ui/content/docs/components/unsaved-indicator.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`; `PROPS_READ_ELSEWHERE` if a part needs an entry)

- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **copy-button** - title `Copy Button`; demo `copy-button-demo` yes
  - files: `components/feedback/copy-button.tsx` -> `components/feedback/copy-button.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/button`, `https://lucide-animated.com/r/check.json`, `https://lucide-animated.com/r/copy.json`
  - parts (export order): `CopyButton`
  - props types: `CopyButtonProps`
- **permission-card** - title `Permission Card`; demo `permission-card-demo` yes
  - files: `components/feedback/permission-card.tsx` -> `components/feedback/permission-card.tsx`
  - dependencies: `lucide-react`
  - registryDependencies: `@shadcn/badge`, `@shadcn/card`, `@shadcn/utils`, `https://lucide-animated.com/r/circle-check.json`
  - parts (export order): `PermissionCard`, `PermissionCardTitle`, `PermissionCardStatus`, `PermissionCardActions`, `PermissionCardResolved`
  - props types: `PermissionCardProps`
- **tool-call-card** - title `Tool Call Card`; demo `tool-call-card-demo` yes
  - files: `components/feedback/tool-call-card.tsx` -> `components/feedback/tool-call-card.tsx`
  - dependencies: `lucide-react`
  - registryDependencies: `@shadcn/badge`, `@shadcn/button`, `@shadcn/card`, `@shadcn/collapsible`, `@shadcn/utils`, `https://lucide-animated.com/r/chevron-down.json`, `https://lucide-animated.com/r/circle-check.json`, `https://lucide-animated.com/r/clock.json`
  - parts (export order): `ToolCallCard`, `ToolCallCardTrigger`, `ToolCallCardTitle`, `ToolCallCardDescription`, `ToolCallCardStatus`, `ToolCallCardContent`, `ToolCallCardSection`, `ToolCallCardSectionTitle`
  - props types: `ComponentProps`, `ToolCallCardProps`
- **unsaved-indicator** - title `Unsaved Indicator`; demo `unsaved-indicator-demo` yes
  - files: `components/feedback/unsaved-indicator.tsx` -> `components/feedback/unsaved-indicator.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `UnsavedIndicator`
  - props types: none

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `copy-button`, `permission-card`, `tool-call-card`, `unsaved-indicator`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 6: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of copy-button's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts
git commit -m "docs(registry-ui): document the feedback components"
```

---

### Task 7: General, and Layout's first half

**Files:**

- Create: `apps/registry-ui/content/docs/components/icon-label.mdx`
- Create: `apps/registry-ui/content/docs/components/icon-media.mdx`
- Create: `apps/registry-ui/content/docs/components/center.mdx`
- Create: `apps/registry-ui/content/docs/components/collapsible-card.mdx`
- Create: `apps/registry-ui/content/docs/components/floating-toolbar.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`; `PROPS_READ_ELSEWHERE` if a part needs an entry)

- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **icon-label** - title `Icon Label`; demo `icon-label-demo` yes
  - files: `components/general/icon-label.tsx` -> `components/general/icon-label.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `IconLabel`
  - props types: none
- **icon-media** - title `Icon Media`; demo `icon-media-demo` yes
  - files: `components/general/icon-media.tsx` -> `components/general/icon-media.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `IconMedia`
  - props types: none
- **center** - title `Center`; demo `center-demo` yes
  - files: `components/layout/center.tsx` -> `components/layout/center.tsx`
  - dependencies: `@base-ui/react`, `class-variance-authority`
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `Center`, `centerVariants`
  - props types: `VariantProps`
- **collapsible-card** - title `Collapsible Card`; demo `collapsible-card-demo` yes
  - files: `components/layout/collapsible-card.tsx` -> `components/layout/collapsible-card.tsx`
  - dependencies: `class-variance-authority`
  - registryDependencies: `@shadcn/button`, `@shadcn/collapsible`, `@shadcn/utils`, `https://lucide-animated.com/r/chevron-down.json`
  - parts (export order): `CollapsibleCard`, `CollapsibleCardHeader`, `CollapsibleCardTitle`, `CollapsibleCardActions`, `CollapsibleCardTrigger`, `CollapsibleCardContent`, `collapsibleCardVariants`
  - props types: `CollapsibleCardProps`, `ComponentProps`, `VariantProps`
- **floating-toolbar** - title `Floating Toolbar`; demo `floating-toolbar-demo` yes
  - files: `components/layout/floating-toolbar.tsx` -> `components/layout/floating-toolbar.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `FloatingToolbar`
  - props types: none

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `icon-label`, `icon-media`, `center`, `collapsible-card`, `floating-toolbar`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 6: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of icon-label's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts
git commit -m "docs(registry-ui): document the general / layout components"
```

---

### Task 8: Layout, second half

**Files:**

- Create: `apps/registry-ui/content/docs/components/model-list.mdx`
- Create: `apps/registry-ui/content/docs/components/page-container.mdx`
- Create: `apps/registry-ui/content/docs/components/panel-field-group.mdx`
- Create: `apps/registry-ui/content/docs/components/panel-header.mdx`
- Create: `apps/registry-ui/content/docs/components/panel-row.mdx`
- Create: `apps/registry-ui/content/docs/components/reasoning-collapsible.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`; `PROPS_READ_ELSEWHERE` if a part needs an entry)

- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **model-list** - title `Model List`; demo `model-list-demo` yes
  - files: `components/layout/model-list.tsx` -> `components/layout/model-list.tsx`
  - dependencies: `lucide-react`
  - registryDependencies: `@shadcn/button`, `@shadcn/item`, `@shadcn/scroll-area`, `@shadcn/skeleton`, `@shadcn/utils`
  - parts (export order): `ModelList`, `ModelListAction`, `ModelListContent`, `ModelListHeader`, `ModelListRemoveButton`, `ModelListSkeleton`, `ModelListTitle`
  - props types: `ModelListSkeletonProps`
- **page-container** - title `Page Container`; demo `page-container-demo` yes
  - files: `components/layout/page-container.tsx` -> `components/layout/page-container.tsx`
  - dependencies: `class-variance-authority`
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `PageContainer`, `pageContainerVariants`
  - props types: `PageContainerProps`, `VariantProps`
- **panel-field-group** - title `Panel Field Group`; demo `panel-field-group-demo` yes
  - files: `components/layout/panel-field-group.tsx` -> `components/layout/panel-field-group.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `PanelFieldGroup`
  - props types: `PanelFieldGroupProps`
- **panel-header** - title `Panel Header`; demo `panel-header-demo` yes
  - files: `components/layout/panel-header.tsx` -> `components/layout/panel-header.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `PanelHeader`, `PanelHeaderRow`, `PanelHeaderTitle`, `PanelHeaderActions`
  - props types: none
- **panel-row** - title `Panel Row`; demo `panel-row-demo` yes
  - files: `components/layout/panel-row.tsx` -> `components/layout/panel-row.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/utils`
  - parts (export order): `PanelRow`, `PanelRowAction`
  - props types: none
- **reasoning-collapsible** - title `Reasoning Collapsible`; demo `reasoning-collapsible-demo` yes
  - files: `components/layout/reasoning-collapsible.tsx` -> `components/layout/reasoning-collapsible.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/button`, `@shadcn/collapsible`, `@shadcn/utils`, `https://lucide-animated.com/r/brain.json`, `https://lucide-animated.com/r/chevron-down.json`
  - parts (export order): `useReasoningCollapsible`, `ReasoningCollapsible`, `ReasoningCollapsibleTrigger`, `ReasoningCollapsibleContent`
  - props types: `ComponentProps`, `ReasoningCollapsibleProps`

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `model-list`, `page-container`, `panel-field-group`, `panel-header`, `panel-row`, `reasoning-collapsible`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 6: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of model-list's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts
git commit -m "docs(registry-ui): document the layout components"
```

---

### Task 9: Navigation, and closing the list

**Files:**

- Create: `apps/registry-ui/content/docs/components/command-menu.mdx`
- Create: `apps/registry-ui/content/docs/components/editor-tab.mdx`
- Modify: `apps/registry-ui/content/docs/components/meta.json`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`UNDOCUMENTED`, then remove it; `PROPS_READ_ELSEWHERE` if a part needs an entry)
- Create: `apps/registry-ui-e2e/src/component-pages.spec.ts`
- Create, only for a state a demo never reaches: `apps/registry-ui/registry/bases/base-ui/examples/<item>-<state>.tsx` and its `registry.json` entry

**Interfaces:**

- Consumes: Task 1's checks and the `<ComponentSource name title file? />` form.

**Facts for each item** (from `registry.json` and the item's source; the install path is after the arrow):

- **command-menu** - title `Command Menu`; demo `command-menu-demo` yes
  - files: `components/navigation/command-menu.tsx` -> `components/navigation/command-menu.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/command`
  - parts (export order): `CommandMenu`, `CommandMenuItem`
  - props types: `CommandMenuItemProps`, `CommandMenuProps`
- **editor-tab** - title `Editor Tab`; demo `editor-tab-demo` yes
  - files: `components/navigation/editor-tab.tsx` -> `components/navigation/editor-tab.tsx`
  - dependencies: none
  - registryDependencies: `@shadcn/button`, `@shadcn/item`, `@shadcn/utils`, `https://lucide-animated.com/r/x.json`, `https://ui.zeroxsolutions.com/r/unsaved-indicator.json`
  - parts (export order): `EditorTab`, `EditorTabTitle`, `EditorTabCloseButton`
  - props types: `EditorTabProps`

- [ ] **Step 1: Take this task's items out of `UNDOCUMENTED`**

Delete these names from the set in `source.spec.ts`: `command-menu`, `editor-tab`.

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: FAIL, `<name>: has no page` for each of them.

- [ ] **Step 2: Read each item before writing its page**

For each item, read its family file (the first file above): the root's docblock (its composition example is where Usage and Composition start), each part's docblock, each `<Part>Props`, and the `data-*` each part sets. Read its demo `registry/bases/base-ui/examples/<item>-demo.tsx` to see which states it already shows.

- [ ] **Step 3: Write each page**

One file per item at `content/docs/components/<item>.mdx`, in this shape (values from the facts above; prose from the source):

````mdx
---
title: <title, exactly as in registry.json>
description: <description, exactly as in registry.json, on one line>
---

<ComponentPreview name="<item>-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the packages it uses.</Step> (only when dependencies is not "none")

```bash
pnpm add <dependencies, space-separated, in the order listed>
```

<Step>Add the components it is built from.</Step>

```bash
pnpm dlx shadcn@latest add <each registryDependency: @shadcn/x as x, a URL as the URL>
```

<Step>Copy the component into `<first file's install path>`.</Step>

<ComponentSource name="<item>" title="<first file's install path>" />

<Step>Copy <what the file holds> into `<install path>`.</Step>          (once per further file)

<ComponentSource name="<item>" file="<registry path, from registry/...>" title="<install path>" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { <the parts a reader composes> } from '@/components/<kind>/<item>';
```

```tsx
<the smallest composition that works, taken from the root docblock>
```

<one or two sentences: when to use it, and which item fits better where that is not obvious>

## Composition (only for a family of two or more parts)

```text
<Root>
|-- <Part>
`-- <Part>
```

## API reference

### <Part> (one per exported name, in export order)

<"Renders a `<element>` and takes every prop a `<element>` takes, plus:" or the primitive it renders, linked>

| Prop     | Type         | Default      |
| -------- | ------------ | ------------ | ---------------------------- |
| `<prop>` | `<type, with | written \|>` | `<default>` or required or - |

<The `data-*` it sets and what each means.>
````

The Composition tree uses ASCII (`|--`, `` `-- ``), as upstream's uses box-drawing characters this repo does not allow.

- [ ] **Step 4: List the pages in the sidebar**

Add this task's pages to `content/docs/components/meta.json` under their kind's separator (`---<Kind>---`), separators in the order Data display, Data entry, Feedback, General, Layout, Navigation, pages in name order within each. When every task is done the file reads:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Data display---",
    "ai-provider-card",
    "chat-message",
    "code-block",
    "data-table",
    "data-table-column-header",
    "file-tree",
    "file-type-icon",
    "font-preview",
    "highlighted-code",
    "image-preview",
    "markdown-view",
    "model-info-card",
    "tree-item",
    "---Data entry---",
    "avatar-picker",
    "chat-suggestion-item",
    "emoji-appearance-toggle-group",
    "emoji-picker",
    "frontmatter-form",
    "language-combobox",
    "language-toggle-group",
    "number-field",
    "password-input",
    "resize-handle",
    "tag-input",
    "---Feedback---",
    "copy-button",
    "permission-card",
    "status-indicator",
    "tool-call-card",
    "unsaved-indicator",
    "---General---",
    "icon-label",
    "icon-media",
    "---Layout---",
    "center",
    "collapsible-card",
    "floating-toolbar",
    "model-list",
    "page-container",
    "panel-field-group",
    "panel-header",
    "panel-row",
    "reasoning-collapsible",
    "---Navigation---",
    "command-menu",
    "editor-tab"
  ]
}
```

- [ ] **Step 5: Remove `UNDOCUMENTED`**

With its last names gone the set is empty. Delete the constant and its docblock, and call `pagelessComponents(readPageSources(CONTENT), readComponentItems(), new Set())` in the `it` that used it, so a component added later without a page fails.

- [ ] **Step 6: Write the e2e case for every component page**

Create `apps/registry-ui-e2e/src/component-pages.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('every component page renders its preview, fits a phone, and throws nothing', async ({ page, request }) => {
  // Each page is prerendered, but 42 of them across a cold worker outrun the default deadline.
  test.setTimeout(180_000);
  const registry = (await (await request.get('/r/registry.json')).json()) as {
    items: { name: string; type: string; title: string }[];
  };
  const components = registry.items.filter((item) => item.type === 'registry:component');
  expect(components.length).toBeGreaterThan(0);

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));
  await page.setViewportSize({ width: 390, height: 844 });

  for (const { name, title } of components) {
    await page.goto(`/docs/components/${name}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.locator('[data-slot=component-preview-stage]').first()).toBeVisible();
    await expect
      .poll(() => page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth'), { message: name })
      .toBe(false);
  }
  expect(errors).toEqual([]);
});
```

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/component-pages.spec.ts`
Expected: PASS in chromium, firefox and webkit. If a page fails, fix the page (or the demo's layout, with its own commit), not the case.

- [ ] **Step 7: Run the checks and the gate**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS. A failing `apiProblems` row names the page, the part and the prop; fix the page, or, where a part's props truly live in another file (a primitive's `ComponentProps` it re-exports), add the part to `PROPS_READ_ELSEWHERE` with that reason.

Run: `pnpm nx run-many -t lint test build -p @zeroxsolutions/registry-ui`
Expected: `Successfully ran targets`.

- [ ] **Step 8: Look at one page**

With the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`, port 8787; stop only the process you started) take a 1440 and a 390 screenshot of command-menu's page into the session scratchpad and read them: the preview renders, the tables fit or scroll inside the column, the Manual steps read in order.

- [ ] **Step 9: Commit**

```bash
git add apps/registry-ui/content/docs/components apps/registry-ui/src/lib/source.spec.ts apps/registry-ui-e2e/src/component-pages.spec.ts
git commit -m "docs(registry-ui): document the navigation components"
```

---

### Task 10: Verification

**Files:**

- none changed unless a check fails

- [ ] **Step 1: The gate on a cold tree**

Run: `pnpm nx run-many -t lint test build --skip-nx-cache`
Expected: `Successfully ran targets ... for 5 projects`.

- [ ] **Step 2: The e2e on a rebuilt worker**

Delete `apps/registry-ui/.open-next` (the worker build in this checkout or worktree, never `.next` in the main checkout), then:
Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache`
Expected: every case passes, `component-pages.spec.ts` included.

- [ ] **Step 3: Screenshots**

From the worker on 8787, full-page screenshots of `/docs/components/data-table`, `/docs/components/tag-input` and `/docs/components/permission-card` at 1440 and 390 wide, light and dark, into the session scratchpad. Read every one and list in the final report what each shows: the preview, the Manual steps, the API tables (no table widens the page), the sidebar groups.

- [ ] **Step 4: `shadcn build`**

Run: `pnpm nx run-many -t shadcn-build -p @zeroxsolutions/registry-ui --skip-nx-cache` (it runs `shadcn build -o public/r` and `shadcn registry validate registry.json`)
Expected: success, with any example a task added in `public/r/`.
