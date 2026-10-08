# Logo, home page and c2 carry-over Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the docs site its logo and a researched home page, and finish what spec c2 left open.

**Architecture:** The site's code-block and preview adapters are recomposed first, because the home
page builds on them. Then the logo enters the header, the icons and the share image. The home page
comes next, with its shader as a lazy client component. The small carry-over fixes follow. A fresh
audit then runs against `writing-a-component` as it now reads, over everything the earlier tasks
leave, and its rows are fixed.

**Tech Stack:** Next 16.3.7 (App Router, Turbopack), fumadocs-mdx 15.4.5, shadcn base-nova on Base UI,
Tailwind v4, `@zeroxsolutions/routing` 0.0.7 (`isMatch` over path-to-regexp), WebGL 1, Vitest +
Testing Library, Playwright on the worker preview (port 8787), nx, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-01-logo-home-and-carry-over-design.md`

## Global Constraints

- c2's rules 1-7 hold for every line written (spec c2, "Rules"):
  - primitives are used as they come, and a class on one carries layout only;
  - colours are theme tokens;
  - no arbitrary values outside a shell's declared layout variables;
  - a missing primitive is added with `shadcn add`;
  - an overflow scroller is a `ScrollArea`;
  - icons are `@lucide-animated` where it has the glyph;
  - UI copy is sentence case, and a name keeps its own case (`ZeroXSolutions UI`).
- Every part of a family carries `data-slot`: `"<root>"` on the root and `"<root>-<part>"` on each
  part. A state `data-*` exists only if a recipe or a spec reads it.
- One file is one family, named for its root. Components are plain `function` declarations, with one
  `export { }` at the foot.
- Content arrives as children or parts. No boolean or mode prop decides which elements render.
- The wordmark is always `ZeroXSolutions UI`, never `ZeroX` alone. The mark draws no `0` or `x`
  glyph.
- No shader or animation library is added. The shader is hand-written WebGL 1.
- The unit runner is jsdom. A browser fact (layout, a media query, WebGL, animation frames) is asserted
  in the e2e on the worker, never by patching a global inside a unit spec.
- Tests hold behaviour a user or caller meets, located role first. No test asserts a class string or
  a `data-slot`. An e2e locates a code block by its slot only because a code block has no role.
- Never `--no-verify` or `HUSKY=0`. Each commit passes the pre-commit hook (lint, typecheck, build,
  test).
- Never delete `apps/registry-ui/.next` or a cache in the main checkout. Port 3000 is the user's
  `next dev`. The e2e owns 8787. A task that needs a dev server uses the port its dispatch names and
  stops it after.
- Load each file's gundam skill with the Skill tool before writing it:
  - `writing-a-component` for a component;
  - `choosing-what-to-test` and `writing-component-tests` for a spec;
  - `writing-e2e-tests` for an e2e;
  - `writing-comments` for a docblock;
  - `naming-a-declaration` for a new name;
  - `landing-a-change` before a commit.
- Commit messages are conventional and end with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A browser with WebGL disabled, or a context lost mid-animation.** The hero shows the static
   poster, and nothing throws. Task 6's e2e runs a context with WebGL unavailable and listens for page errors.
2. **A narrow screen, 390 wide.** The hero, the command block and the item grid fit with no sideways
   page scroll, and the command scrolls inside its block. Task 5's e2e asserts it.
3. **Dark mode.** The mark and the shader take the dark tokens, and the favicon has a dark variant.
   Task 4's e2e loads `icon.svg` and finds the dark rule. Task 6 reads the colour from the computed
   token, not from a constant.
4. **Keyboard.** The logo link, both hero actions, the copy button and each card's link are reachable
   by Tab in reading order. Task 5's e2e focuses `Browse components`, presses Tab, and expects `Get started` to hold focus.
5. **A docs page with a nested route** (`/docs/components/status-indicator`). Exactly one header link
   is current, and it is `Components`, not `Docs`. Task 3's unit spec asserts it.

---

### Task 1: Compose the site's source blocks from parts

The audit found `SourceCodeBlock` and `ComponentSource` deciding with `collapsible` and `copyable`
which parts render. After this task, every caller composes the parts.

**Files:**

- Modify: `apps/registry-ui/src/components/data-display/source-code-block.tsx` (whole file)
- Modify: `apps/registry-ui/src/components/data-display/component-source.tsx` (whole file)
- Modify: `apps/registry-ui/src/components/data-display/component-source.spec.tsx`
- Modify: `apps/registry-ui/src/mdx-components.tsx` (`pre` entry, `ComponentSource` entry)
- Modify: `apps/registry-ui/src/components/data-display/example-preview.tsx` (the source half)
- Modify: `apps/registry-ui/src/app/(app)/page.tsx` (its one `SourceCodeBlock`)

**Interfaces:**

- Produces, from `source-code-block.tsx` (`'use client'`), the registry's parts under one family
  name:
  - `SourceCodeBlock`, which is `CodeBlock` and takes `code`, `language` and `lines`;
  - `SourceCodeBlockHeader`, `SourceCodeBlockTitle`, `SourceCodeBlockActions` and
    `SourceCodeBlockTrigger`, the `CollapsibleCard` header parts;
  - `SourceCodeBlockLanguage`, `SourceCodeBlockCopy`, `SourceCodeBlockContent`,
    `SourceCodeBlockLineNumbers` and `SourceCodeBlockCode`, the `CodeBlock` parts;
  - `SourceCodeBlockFile`, a new `span` that holds a file's name.
  - The aliased parts are the registry's parts, so they keep the registry's slots (`code-block-*`,
    `collapsible-card-*`). Only `SourceCodeBlockFile`, the one part declared here, carries
    `source-code-block-file`.
- Produces `ComponentSource({ name, file?, code?, language?, lines?, maxLines?, ...CodeBlock props,
  children })`. It reads and cuts the source and renders `SourceCodeBlock` around its `children`.

- [ ] **Step 1: Write the failing spec**

Replace the body of `component-source.spec.tsx` with what a caller meets.

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ComponentSource } from './component-source';
import { SourceCodeBlockCode, SourceCodeBlockContent, SourceCodeBlockCopy } from './source-code-block';

afterEach(cleanup);

const CODE = 'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;';

describe('ComponentSource', () => {
  it('shows the parts its caller composes, and nothing else', () => {
    render(
      <ComponentSource name="x" code={CODE} language="ts">
        <SourceCodeBlockContent>
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </ComponentSource>,
    );
    expect(screen.getByText(/const d = 4;/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('cuts the source to its first lines when asked', () => {
    render(
      <ComponentSource name="x" code={CODE} language="ts" maxLines={2}>
        <SourceCodeBlockCopy />
        <SourceCodeBlockContent>
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </ComponentSource>,
    );
    expect(screen.getByText(/const b = 2;/)).toBeTruthy();
    expect(screen.queryByText(/const c = 3;/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('throws outside a docs page, where nothing read its source', () => {
    expect(() => render(<ComponentSource name="x" />)).toThrow(/has no source/);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/components/data-display/component-source.spec.tsx`
Expected: FAIL. `SourceCodeBlockContent` is not exported, and the first case renders a copy button.

- [ ] **Step 3: Rewrite `source-code-block.tsx`**

```tsx
'use client';

import type { ComponentProps, ReactNode } from 'react';

import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockCopy,
  CodeBlockLanguage,
  CodeBlockLineNumbers,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { cn } from '@/registry/bases/base-ui/lib/utils';

// The registry's code block and its header parts, across the client boundary their hooks need on a
// server-rendered page. A page composes them: header (title: language, file; actions: copy, trigger),
// then content (line numbers, code).

/** A file's name in a source block's title, beside its language; it truncates when the header is narrow. */
function SourceCodeBlockFile({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return <span data-slot="source-code-block-file" className={cn('min-w-0 truncate font-mono', className)} {...props} />;
}

export {
  CodeBlock as SourceCodeBlock,
  CollapsibleCardHeader as SourceCodeBlockHeader,
  CollapsibleCardTitle as SourceCodeBlockTitle,
  CodeBlockLanguage as SourceCodeBlockLanguage,
  SourceCodeBlockFile,
  CollapsibleCardActions as SourceCodeBlockActions,
  CodeBlockCopy as SourceCodeBlockCopy,
  CollapsibleCardTrigger as SourceCodeBlockTrigger,
  CodeBlockContent as SourceCodeBlockContent,
  CodeBlockLineNumbers as SourceCodeBlockLineNumbers,
  CodeBlockCode as SourceCodeBlockCode,
};
```

- [ ] **Step 4: Rewrite `component-source.tsx`**

```tsx
import type { ComponentProps, ReactNode } from 'react';

import { SourceCodeBlock } from '@/components/data-display/source-code-block';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

interface ComponentSourceProps extends Omit<ComponentProps<typeof SourceCodeBlock>, 'code' | 'language' | 'lines'> {
  /** A demo or registry item name in the examples index. */
  name: string;
  /** One of the files the item ships, when it is not the first; `rehypeDocsCode` reads it, not this component. */
  file?: string;
  /** The file's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
  /** Shows only the first this many lines. */
  maxLines?: number;
}

/**
 * A source file of a demo or registry item, as a `SourceCodeBlock` its children compose: its first
 * file, or the one `file` names. Its source and highlighting are read as the docs page compiles, so it
 * works only inside a docs page; anywhere else it throws.
 */
function ComponentSource({
  name,
  file: _file,
  code,
  language,
  lines,
  maxLines,
  ...props
}: ComponentSourceProps): ReactNode {
  if (code === undefined) throw new Error(`ComponentSource: "${name}" has no source; only a docs page reads it`);
  const highlighted = lines ? (JSON.parse(lines) as HighlightLine[] | null) : null;

  return (
    <SourceCodeBlock
      code={maxLines ? code.split('\n').slice(0, maxLines).join('\n') : code}
      language={language}
      lines={maxLines ? (highlighted?.slice(0, maxLines) ?? null) : highlighted}
      {...props}
    />
  );
}

export { ComponentSource };
```

- [ ] **Step 5: Run the spec and see it pass**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/components/data-display/component-source.spec.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Recompose the callers**

In `mdx-components.tsx`, the `pre` entry becomes:

```tsx
  pre: ({ children, title, lines }: ComponentProps<'pre'> & { lines?: string }) => {
    const code = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children.props : {};
    const language = /language-(\S+)/.exec(code.className ?? '')?.[1];

    return (
      <SourceCodeBlock
        code={nodeText(code.children).replace(/\n$/, '')}
        language={language}
        lines={lines ? (JSON.parse(lines) as HighlightLine[] | null) : null}
        className="mt-6"
      >
        <SourceCodeBlockHeader>
          <SourceCodeBlockTitle>
            <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
            {title ? <SourceCodeBlockFile>{title}</SourceCodeBlockFile> : null}
          </SourceCodeBlockTitle>
          <SourceCodeBlockActions>
            <SourceCodeBlockCopy />
          </SourceCodeBlockActions>
        </SourceCodeBlockHeader>
        <SourceCodeBlockContent>
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </SourceCodeBlock>
    );
  },
```

Its `ComponentSource` entry becomes an adapter that composes the item-page shape: the file's name,
copy and fold, and numbered lines.

```tsx
  ComponentSource: ({ file, ...props }: ComponentProps<typeof ComponentSource>) => (
    <ComponentSource file={file} className="mt-6" {...props}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{props.language}</SourceCodeBlockLanguage>
          {file ? <SourceCodeBlockFile>{file.split('/').pop()}</SourceCodeBlockFile> : null}
        </SourceCodeBlockTitle>
        <SourceCodeBlockActions>
          <SourceCodeBlockCopy />
          <SourceCodeBlockTrigger />
        </SourceCodeBlockActions>
      </SourceCodeBlockHeader>
      <SourceCodeBlockContent>
        <SourceCodeBlockLineNumbers />
        <SourceCodeBlockCode />
      </SourceCodeBlockContent>
    </ComponentSource>
  ),
```

In `example-preview.tsx`, the excerpt and the full source compose their own headers. Both keep the
language label, as the user requires. Only the full source carries the copy button.

```tsx
<ComponentPreviewSource>
  <ComponentPreviewExcerpt>
    <ComponentSource {...source} maxLines={EXCERPT_LINES}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
        </SourceCodeBlockTitle>
      </SourceCodeBlockHeader>
      <SourceCodeBlockContent>
        <SourceCodeBlockLineNumbers />
        <SourceCodeBlockCode />
      </SourceCodeBlockContent>
    </ComponentSource>
  </ComponentPreviewExcerpt>
  <ComponentPreviewCode>
    <ComponentSource {...source}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
        </SourceCodeBlockTitle>
        <SourceCodeBlockActions>
          <SourceCodeBlockCopy />
        </SourceCodeBlockActions>
      </SourceCodeBlockHeader>
      <SourceCodeBlockContent>
        <SourceCodeBlockLineNumbers />
        <SourceCodeBlockCode />
      </SourceCodeBlockContent>
    </ComponentSource>
  </ComponentPreviewCode>
</ComponentPreviewSource>
```

Here `source` is `{ name, code, language, lines, variant: 'flush' } as const`, without the two
flags.

In `src/app/(app)/page.tsx`, compose the install command the way the `pre` entry composes a fence,
with `language="bash"`, `lines={null}` and no file. Task 5 replaces the page; this step only keeps it
building.

- [ ] **Step 7: Run the gate and the e2e**

Run: `pnpm nx run-many -t lint typecheck build test`
Expected: `Successfully ran targets lint, typecheck, build, test for 5 projects`.

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e`
Expected: all pass. `component-page.spec.ts` still finds the `tsx` and `bash` labels, and no copy
button sits over code.

- [ ] **Step 8: Commit**

```bash
git add apps/registry-ui/src/components/data-display/source-code-block.tsx \
  apps/registry-ui/src/components/data-display/component-source.tsx \
  apps/registry-ui/src/components/data-display/component-source.spec.tsx \
  apps/registry-ui/src/mdx-components.tsx \
  apps/registry-ui/src/components/data-display/example-preview.tsx \
  'apps/registry-ui/src/app/(app)/page.tsx'
git commit -F <message file>   # refactor(registry-ui): compose the site's source blocks from parts
```

---

### Task 2: Split the block preview from the demo preview

**Files:**

- Create: `apps/registry-ui/src/components/data-display/example-source.tsx`
- Create: `apps/registry-ui/src/components/data-display/block-preview.tsx`
- Modify: `apps/registry-ui/src/components/data-display/example-preview.tsx`
- Modify: `apps/registry-ui/src/mdx-components.tsx` (map `BlockPreview`)
- Modify: `apps/registry-ui/src/lib/rehype-docs-code.ts:27` (`SOURCE_COMPONENTS`)
- Modify: `apps/registry-ui/src/lib/source.spec.ts:147-165` (`NAMED_SOURCE`, the first-preview rule)
- Modify: `apps/registry-ui/content/docs/blocks/ai-provider-picker.mdx:6`

**Interfaces:**

- Consumes the Task 1 parts.
- Produces:
  - `ExampleSource({ name, code?, language?, lines? })`, the excerpt and the full source as one
    `ComponentPreviewSource`;
  - `ExamplePreview({ name, code?, language?, lines? })`, a demo on a stage with its source;
  - `BlockPreview({ name, block, code?, language?, lines? })`, a block framed edge to edge, with its
    demo's source.

- [ ] **Step 1: Write the failing spec rule**

In `source.spec.ts`, make `NAMED_SOURCE` match `BlockPreview` too, and let either preview open an item
page:

```ts
const NAMED_SOURCE = /<(ComponentPreview|BlockPreview|ComponentSource)\b[^>]*?\bname="([^"]+)"/g;
```

```ts
const first = [...source.matchAll(NAMED_SOURCE)].find(([, component]) => component !== 'ComponentSource');
```

Add a case:

```ts
it('takes a block page whose first preview is a BlockPreview of the demo', () => {
  const pages = {
    'blocks/ai-provider-picker': '<BlockPreview name="ai-provider-picker-demo" block="ai-provider-picker" />',
  };
  expect(misplacedFirstPreviews(pages, new Set(['ai-provider-picker']))).toEqual([]);
});
```

Edit `content/docs/blocks/ai-provider-picker.mdx` line 6 to:

```mdx
<BlockPreview name="ai-provider-picker-demo" block="ai-provider-picker" />
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/source.spec.ts`
Expected: PASS for the new case. But `pnpm nx build @zeroxsolutions/registry-ui` FAILS, because MDX
has no `BlockPreview` and `rehypeDocsCode` sets no `code` on it.

- [ ] **Step 3: Implement**

`example-source.tsx`. This is the source half Task 1 composed in `example-preview.tsx`, moved here
whole and taking `{ name, code, language, lines }`:

```tsx
import type { ReactNode } from 'react';

import {
  ComponentPreviewCode,
  ComponentPreviewExcerpt,
  ComponentPreviewSource,
} from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import {
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockLineNumbers,
  SourceCodeBlockTitle,
} from '@/components/data-display/source-code-block';

/** How many of the source's first lines show before `View code`. */
const EXCERPT_LINES = 3;

interface ExampleSourceProps {
  /** A demo name in the examples index. */
  name: string;
  /** The demo's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
}

/** A demo's source under its preview: its first lines, and the whole file once `View code` opens it. */
function ExampleSource({ name, code, language, lines }: ExampleSourceProps): ReactNode {
  const source = { name, code, language, lines, variant: 'flush' } as const;
  return (
    <ComponentPreviewSource>
      <ComponentPreviewExcerpt>
        <ComponentSource {...source} maxLines={EXCERPT_LINES}>
          <SourceCodeBlockHeader>
            <SourceCodeBlockTitle>
              <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
            </SourceCodeBlockTitle>
          </SourceCodeBlockHeader>
          <SourceCodeBlockContent>
            <SourceCodeBlockLineNumbers />
            <SourceCodeBlockCode />
          </SourceCodeBlockContent>
        </ComponentSource>
      </ComponentPreviewExcerpt>
      <ComponentPreviewCode>
        <ComponentSource {...source}>
          <SourceCodeBlockHeader>
            <SourceCodeBlockTitle>
              <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
            </SourceCodeBlockTitle>
            <SourceCodeBlockActions>
              <SourceCodeBlockCopy />
            </SourceCodeBlockActions>
          </SourceCodeBlockHeader>
          <SourceCodeBlockContent>
            <SourceCodeBlockLineNumbers />
            <SourceCodeBlockCode />
          </SourceCodeBlockContent>
        </ComponentSource>
      </ComponentPreviewCode>
    </ComponentPreviewSource>
  );
}

export { ExampleSource };
```

`example-preview.tsx`:

```tsx
import type { ReactNode } from 'react';

import { ComponentPreview, ComponentPreviewStage } from '@/components/data-display/component-preview';
import { ExampleSource } from '@/components/data-display/example-source';
import { RegistryExample } from '@/components/data-display/registry-example';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

interface ExamplePreviewProps {
  /** A demo name in the examples index. */
  name: string;
  /** The demo's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
}

/** A docs page's `<ComponentPreview name>`: the demo live above its source. Throws for a name the index lacks, so the page fails its build. */
function ExamplePreview({ name, ...source }: ExamplePreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  return (
    <ComponentPreview className="mt-4 mb-12">
      <ComponentPreviewStage>
        <RegistryExample name={name} />
      </ComponentPreviewStage>
      <ExampleSource name={name} {...source} />
    </ComponentPreview>
  );
}

export { ExamplePreview };
```

`block-preview.tsx`:

```tsx
import type { ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import { ComponentPreview } from '@/components/data-display/component-preview';
import { ExampleSource } from '@/components/data-display/example-source';
import { publishedBlocks } from '@/lib/registry';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

interface BlockPreviewProps {
  /** The demo whose source shows under the frame. */
  name: string;
  /** The published block the frame shows, on its own page, so it lays out at the frame's width. */
  block: string;
  code?: string;
  language?: string;
  lines?: string;
}

/** A docs page's `<BlockPreview name block>`: the block framed edge to edge above its demo's source. Throws for a name or a block the registry lacks. */
function BlockPreview({ name, block, ...source }: BlockPreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`BlockPreview: "${name}" is not in the examples index`);
  const item = publishedBlocks.find((entry) => entry.name === block);
  if (!item) throw new Error(`BlockPreview: "${block}" is not a published block`);
  return (
    <ComponentPreview className="mt-4 mb-12">
      <BlockFrame name={item.name} title={item.title} />
      <ExampleSource name={name} {...source} />
    </ComponentPreview>
  );
}

export { BlockPreview };
```

In `mdx-components.tsx`, add `BlockPreview,` beside `ComponentPreview: ExamplePreview`. In
`rehype-docs-code.ts`, use:

```ts
const SOURCE_COMPONENTS = new Set(['ComponentPreview', 'BlockPreview', 'ComponentSource']);
```

Update that file's docblocks, which name `ComponentPreview` or `ComponentSource`, to name all three.

- [ ] **Step 4: Run the gate and the e2e**

Run: `pnpm nx run-many -t lint typecheck build test`, then `pnpm nx e2e @zeroxsolutions/registry-ui-e2e`
Expected: both pass. `view.spec.ts` and the blocks page still frame the block.

- [ ] **Step 5: Commit**

`refactor(registry-ui): split the block preview from the demo preview`, naming every file above.

---

### Task 3: One rule for which header link is current

**Files:**

- Modify: `apps/registry-ui/src/types/site-nav-item.ts`
- Create: `apps/registry-ui/src/lib/site-nav.ts`
- Create: `apps/registry-ui/src/lib/site-nav.spec.ts`
- Modify: `apps/registry-ui/src/components/layout/site-header.tsx` (the `navItems`)
- Modify: `apps/registry-ui/src/components/navigation/main-nav.tsx:25`
- Modify: `apps/registry-ui/src/components/navigation/mobile-nav.tsx:63-64`

**Interfaces:**

- Produces `SiteNavItem { href: string; label: string; pattern: string }`.
- Produces `currentSiteNavItem(items: SiteNavItem[], pathname: string): SiteNavItem | undefined`.

- [ ] **Step 1: Write the failing spec**

```ts
import { describe, expect, it } from 'vitest';

import type { SiteNavItem } from '@/types/site-nav-item';

import { currentSiteNavItem } from './site-nav';

const items: SiteNavItem[] = [
  { href: '/docs', label: 'Docs', pattern: '/docs{/*rest}' },
  { href: '/docs/components', label: 'Components', pattern: '/docs/components{/*rest}' },
  { href: '/blocks', label: 'Blocks', pattern: '/blocks' },
];

describe('currentSiteNavItem', () => {
  it('marks a section on its own page and on every page under it', () => {
    expect(currentSiteNavItem(items, '/docs')?.label).toBe('Docs');
    expect(currentSiteNavItem(items, '/docs/installation')?.label).toBe('Docs');
  });

  it('marks the subsection, not its parent, on a page under both', () => {
    expect(currentSiteNavItem(items, '/docs/components/status-indicator')?.label).toBe('Components');
  });

  it('marks nothing on a page no section covers', () => {
    expect(currentSiteNavItem(items, '/')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/lib/site-nav.spec.ts`
Expected: FAIL, because `./site-nav` does not exist.

- [ ] **Step 3: Implement**

`site-nav-item.ts`:

```ts
/** One of the site's sections, as the header, the mobile menu and the command menu list it. */
export interface SiteNavItem {
  href: string;
  label: string;
  /** The pages the section covers, as a path-to-regexp pattern: `/docs{/*rest}` is `/docs` and every page under it. */
  pattern: string;
}
```

`site-nav.ts`:

```ts
import { isMatch } from '@zeroxsolutions/routing';

import type { SiteNavItem } from '@/types/site-nav-item';

/**
 * The section `pathname` belongs to. Where several patterns match, the one listed last wins, because
 * the header lists a section before its subsections.
 */
export function currentSiteNavItem(items: SiteNavItem[], pathname: string): SiteNavItem | undefined {
  return items.findLast((item) => isMatch(item.pattern, pathname));
}
```

In `site-header.tsx`, each item builds its pattern from the route unit or page URL it already links
to, so no path is spelled twice:

```ts
const components = docsPageUrl(['components']);
const navItems: SiteNavItem[] = [
  { href: homeRoute.build(), label: 'Home', pattern: homeRoute.pathname },
  { href: docsRoute.build(), label: 'Docs', pattern: `${docsRoute.pathname}{/*rest}` },
  { href: components, label: 'Components', pattern: `${components}{/*rest}` },
  { href: blocksRoute.build(), label: 'Blocks', pattern: blocksRoute.pathname },
];
```

The unit spec's literal patterns stand in for these, which is all a spec of the matcher needs.

In `main-nav.tsx`, compute `const current = currentSiteNavItem(items, pathname);` and set
`aria-current={item === current ? 'page' : undefined}`. In `mobile-nav.tsx`, do the same for both
`isActive` and `aria-current`.

- [ ] **Step 4: Run the spec, the gate and the nav specs**

Run: `pnpm nx run-many -t lint typecheck build test`
Expected: pass. `mobile-nav.spec.tsx` still passes; its mock pathname is `/docs`.

- [ ] **Step 5: Commit**

`fix(registry-ui): mark the section a docs page belongs to as current`.

---

### Task 4: The logo in the header, the icons and the share image

**Files:**

- Create: `apps/registry-ui/src/components/general/site-logo.tsx`
- Modify: `apps/registry-ui/src/components/layout/site-header.tsx`
- Create: `apps/registry-ui/src/app/icon.svg`
- Replace: `apps/registry-ui/public/favicon.ico`
- Create: `apps/registry-ui/src/app/apple-icon.png`
- Modify: `apps/registry-ui/src/app/og/docs/[...slug]/route.tsx`
- Modify: `apps/registry-ui-e2e/src/home.spec.ts`

**Interfaces:**

- Produces `SiteLogo(props: ComponentProps<'svg'>)`, which draws in `currentColor` and is
  `aria-hidden` by default.

- [ ] **Step 1: Write the failing e2e**

Append to `home.spec.ts`:

```ts
test('the site carries its logo: the header link home, and the icons', async ({ page, request }) => {
  await page.goto('/docs');
  const home = page.getByRole('banner').getByRole('link', { name: 'ZeroXSolutions UI' });
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/$/);

  const icon = await request.get('/icon.svg');
  expect(icon.ok()).toBe(true);
  const svg = await icon.text();
  expect(svg).toContain('prefers-color-scheme: dark');
  expect(svg.match(/<rect /g)).toHaveLength(6);
  expect((await request.get('/favicon.ico')).ok()).toBe(true);
  expect((await request.get('/apple-icon.png')).ok()).toBe(true);
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/home.spec.ts`
Expected: FAIL. There is no link named `ZeroXSolutions UI` in the banner.

- [ ] **Step 3: Write `SiteLogo`**

```tsx
import type { ComponentProps, ReactNode } from 'react';

/**
 * The ZeroXSolutions UI mark: a 3x3 grid of modules with the centre and the two anti-diagonal corners
 * left out. It draws in the text colour around it, so it follows the theme; it is decorative, and
 * the link or heading around it carries the name.
 */
function SiteLogo(props: ComponentProps<'svg'>): ReactNode {
  return (
    <svg data-slot="site-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="9" width="6" height="6" rx="1" />
      <rect x="16" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="16" width="6" height="6" rx="1" />
      <rect x="16" y="16" width="6" height="6" rx="1" />
    </svg>
  );
}

export { SiteLogo };
```

- [ ] **Step 4: Put it in the header**

In `site-header.tsx`:

- Drop the `Home` item from `navItems`.
- Insert the home link before the `lg:hidden` wrapper. It is a `Link` styled as a ghost button,
  the way `MainNav` styles its links:

```tsx
<Link href={homeRoute.build()} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
  <SiteLogo />
  ZeroXSolutions UI
</Link>
```

The button recipe sizes the `svg`; no class is added to `SiteLogo`. Import `Link` from `next/link`
and `buttonVariants` from `@/registry/bases/base-ui/ui/button`.

- [ ] **Step 5: Write `src/app/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <style>rect { fill: #0a0a0a } @media (prefers-color-scheme: dark) { rect { fill: #fafafa } }</style>
  <rect x="2" y="2" width="6" height="6" rx="1" />
  <rect x="9" y="2" width="6" height="6" rx="1" />
  <rect x="2" y="9" width="6" height="6" rx="1" />
  <rect x="16" y="9" width="6" height="6" rx="1" />
  <rect x="9" y="16" width="6" height="6" rx="1" />
  <rect x="16" y="16" width="6" height="6" rx="1" />
</svg>
```

`#0a0a0a` and `#fafafa` are the light and the dark `--foreground` as hex. The icon file reads no CSS
variables, as the share image's comment already says of its own colours.

- [ ] **Step 6: Generate `favicon.ico` and `apple-icon.png`**

Render the mark with the repo's Playwright, from a scratch script outside the repo:

- the favicon: 32 by 32, `#0a0a0a` on a transparent background;
- the apple icon: 180 by 180, the mark at 120 pixels centred on `#ffffff`.

Wrap the 32-pixel PNG as an ICO. An ICO may hold a PNG: a 6-byte header, then one 16-byte entry with
width 32, height 32, planes 1, bit count 32, the PNG's byte length and offset 22, then the PNG bytes.

```python
import struct, sys
png = open(sys.argv[1], 'rb').read()
open(sys.argv[2], 'wb').write(struct.pack('<HHH', 0, 1, 1) + struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png), 22) + png)
```

Open both files and look at them before going on.

- [ ] **Step 7: Put the mark on the share image**

In `route.tsx`, the first child becomes a row: the mark in `FOREGROUND`, 40 pixels square, then the
site name.

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 32, color: MUTED_FOREGROUND }}>
  <svg width={40} height={40} viewBox="0 0 24 24" fill={FOREGROUND}>
    <rect x="2" y="2" width="6" height="6" rx="1" />
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <rect x="2" y="9" width="6" height="6" rx="1" />
    <rect x="16" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="16" width="6" height="6" rx="1" />
    <rect x="16" y="16" width="6" height="6" rx="1" />
  </svg>
  ZeroXSolutions UI
</div>
```

The renderer draws no React component it cannot inline, so the rects are written out here.

- [ ] **Step 8: Run the e2e and the gate**

Run: `pnpm nx run-many -t lint typecheck build test`, then `pnpm nx e2e @zeroxsolutions/registry-ui-e2e`
Expected: all pass, including the new case. Fetch one share image from the worker and open it.

- [ ] **Step 9: Commit**

`feat(registry-ui): brand the site with its logo`, naming every file, the binary icons included.

---

### Task 5: The home page

**Files:**

- Modify: `apps/registry-ui/src/components/data-display/component-preview.tsx` (add `ComponentPreviewCaption`)
- Modify: `apps/registry-ui/src/app/(app)/page.tsx` (whole file)
- Create: `apps/registry-ui/src/app/(app)/_components/general/home-shader.tsx`, a stub that returns `null`,
  which Task 6 replaces
- Modify: `apps/registry-ui-e2e/src/home.spec.ts`

**Interfaces:**

- Consumes the Task 1 parts, `RegistryExample`, `BlockFrame`, `publishedItems`, `docsPageUrl` and
  `source.getPage`.
- Produces `ComponentPreviewCaption(props: ComponentProps<'div'>)`, a part of the preview family.

- [ ] **Step 1: Write the failing e2e**

Replace the first test in `home.spec.ts`:

```ts
const ITEMS = ['Chat Message', 'Code Block', 'File Tree', 'Tag Input', 'Password Input', 'Status Indicator'];

test('/ says what the registry is, shows its items live, fits a phone, and links on', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth')).toBe(false);

  await page.setViewportSize({ width: 1440, height: 900 });
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Composed React components for shadcn, on Base UI.');
  await expect(main.getByRole('button', { name: 'Copy code' }).first()).toBeVisible();
  for (const item of ITEMS) await expect(main.getByText(item, { exact: true })).toBeVisible();
  await expect(main.getByTitle('AI Provider Picker')).toBeVisible();

  const browse = main.getByRole('link', { name: 'Browse components' });
  await browse.focus();
  await page.keyboard.press('Tab');
  await expect(main.getByRole('link', { name: 'Get started' })).toBeFocused();

  await browse.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeVisible();
});
```

The iframe is located by its title, which is its accessible name; an iframe has no role to locate it
by.

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/home.spec.ts`
Expected: FAIL, because the heading is `ZeroXSolutions UI`.

- [ ] **Step 3: Add the caption part**

In `component-preview.tsx`, add it and export it:

```tsx
/** A line under the stage naming what it shows, split from it by a rule. */
function ComponentPreviewCaption({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="component-preview-caption"
      className={cn(
        'border-foreground/10 flex items-center justify-between gap-2 border-t px-4 py-3 text-sm',
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Write the page**

`src/app/(app)/page.tsx`:

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

import { HomeShader } from './_components/general/home-shader';
import { BlockFrame } from '@/components/data-display/block-frame';
import {
  ComponentPreview,
  ComponentPreviewCaption,
  ComponentPreviewStage,
} from '@/components/data-display/component-preview';
import { RegistryExample } from '@/components/data-display/registry-example';
import {
  SourceCodeBlock,
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockTitle,
} from '@/components/data-display/source-code-block';
import { publishedBlocks, publishedItems, registryHomepage } from '@/lib/registry';
import { docsPageUrl, source } from '@/lib/source';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { blocksRoute } from '@/routes/app-routes';

/** The items the home page shows live, by registry name; each renders its `<name>-demo`. */
const HOME_ITEMS = ['chat-message', 'code-block', 'file-tree', 'tag-input', 'password-input', 'status-indicator'];

/** The shadcn CLI command that installs one registry item from its URL. */
function homePageInstallCommand(name: string): string {
  return `pnpm dlx shadcn@latest add ${new URL(`/r/${name}.json`, registryHomepage).href}`;
}

const INSTALL_STEPS = [
  { title: 'Add an item with the shadcn CLI', language: 'bash', code: homePageInstallCommand('status-indicator') },
  { title: 'The CLI writes it into your app', language: 'text', code: 'components/feedback/status-indicator.tsx' },
  {
    title: 'Import it and compose',
    language: 'tsx',
    code: 'import { StatusIndicator } from \'@/components/feedback/status-indicator\';\n\n<StatusIndicator tone="online" />',
  },
];

/** A short source block: its language, a copy button and the code, unhighlighted (this page is no MDX). */
function HomePageCode({ code, language }: { code: string; language: string }): ReactNode {
  return (
    <SourceCodeBlock code={code} language={language} lines={null}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
        </SourceCodeBlockTitle>
        <SourceCodeBlockActions>
          <SourceCodeBlockCopy />
        </SourceCodeBlockActions>
      </SourceCodeBlockHeader>
      <SourceCodeBlockContent>
        <SourceCodeBlockCode />
      </SourceCodeBlockContent>
    </SourceCodeBlock>
  );
}

export default function HomePage(): ReactNode {
  const items = HOME_ITEMS.map((name) => {
    const item = publishedItems.find((entry) => entry.name === name);
    if (!item) throw new Error(`HomePage: "${name}" is not a published item`);
    const page = source.getPage(['components', name]);
    return { ...item, url: page?.url };
  });
  const block = publishedBlocks.find((entry) => entry.name === 'ai-provider-picker');
  if (!block) throw new Error('HomePage: "ai-provider-picker" is not a published block');

  return (
    <div className="flex flex-col gap-24 pb-24">
      <section className="relative isolate">
        <HomeShader />
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pt-24 pb-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Composed React components for shadcn, on Base UI.
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Install any item with the shadcn CLI from its URL. The code it writes is yours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={docsPageUrl(['components'])} className={buttonVariants()}>
              Browse components
            </Link>
            <Link href={docsPageUrl(['installation'])} className={buttonVariants({ variant: 'outline' })}>
              Get started
            </Link>
          </div>
          <div className="w-full max-w-xl text-left">
            <HomePageCode code={homePageInstallCommand('status-indicator')} language="bash" />
          </div>
        </div>
      </section>

      <section aria-labelledby="home-items" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
        <h2 id="home-items" className="text-2xl font-semibold tracking-tight">
          Components
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ComponentPreview key={item.name}>
              <ComponentPreviewStage>
                <RegistryExample name={`${item.name}-demo`} />
              </ComponentPreviewStage>
              <ComponentPreviewCaption>
                {item.url ? <Link href={item.url}>{item.title}</Link> : <span>{item.title}</span>}
              </ComponentPreviewCaption>
            </ComponentPreview>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-blocks" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="home-blocks" className="text-2xl font-semibold tracking-tight">
            Blocks
          </h2>
          <Link href={blocksRoute.build()} className={buttonVariants({ variant: 'link' })}>
            See the blocks
          </Link>
        </div>
        <ComponentPreview>
          <BlockFrame name={block.name} title={block.title} />
        </ComponentPreview>
      </section>

      <section aria-labelledby="home-install" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6">
        <h2 id="home-install" className="text-2xl font-semibold tracking-tight">
          How it installs
        </h2>
        <ol className="flex flex-col gap-6">
          {INSTALL_STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <h3 className="font-medium">
                {index + 1}. {step.title}
              </h3>
              <HomePageCode code={step.code} language={step.language} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
```

Before writing the page, make two checks:

- Read `publishedItems`' entry type in `src/lib/registry.ts` for the field names the code uses
  (`name`, `title`).
- Read `registry.json` for each `HOME_ITEMS` name's file path, so step 2's path is the real one.

Correct the code to what both say, not the other way round. `HomeShader` comes from Task 6. Until
then, this task renders a stub that returns `null` in `_components/general/home-shader.tsx`, and Task 6
replaces it.

- [ ] **Step 5: Run the e2e and the gate**

Run: `pnpm nx run-many -t lint typecheck build test`, then `pnpm nx e2e @zeroxsolutions/registry-ui-e2e`
Expected: all pass.

Screenshot `/` at 1440 and 390 wide, in light and dark, on the task's dev server port. Open each
screenshot.

- [ ] **Step 6: Commit**

`feat(registry-ui): build the home page from the registry's own items`.

---

### Task 6: The hero shader

**Files:**

- Modify: `apps/registry-ui/src/app/(app)/_components/general/home-shader.tsx` (replace the stub)
- Modify: `apps/registry-ui-e2e/src/home.spec.ts`

**Interfaces:**

- Produces `HomeShader(props: ComponentProps<'div'>)`. It fills its positioned parent and is
  `aria-hidden`.

- [ ] **Step 1: Write the failing e2e**

Every behaviour of the shader depends on the browser: whether reduced motion is set, whether WebGL
exists, whether frames are requested. The unit runner is jsdom, where none of these is real, so the
shader is covered by one e2e on the worker, in three browser contexts. Add to `home.spec.ts`:

```ts
// Counts WebGL contexts and animation frames, and, with `noWebgl`, makes WebGL unavailable.
const instrument = (noWebgl: boolean): string => `(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  window.__contexts = 0; window.__frames = 0;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    if (String(kind).startsWith('webgl')) { window.__contexts++; if (${noWebgl}) return null; }
    return original.call(this, kind, ...rest);
  };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => { window.__frames++; return raf(callback); };
})()`;

test('the hero shader holds still under reduced motion or without WebGL, and otherwise settles', async ({
  browser,
}) => {
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const still = await reduced.newPage();
  await still.addInitScript(instrument(false));
  await still.goto('/');
  await expect(still.getByRole('heading', { level: 1 })).toBeVisible();
  await still.waitForTimeout(1_000);
  expect(await still.evaluate('window.__contexts')).toBe(0);
  await reduced.close();

  const bare = await browser.newContext({ reducedMotion: 'no-preference' });
  const fallback = await bare.newPage();
  const errors: string[] = [];
  fallback.on('pageerror', (error) => errors.push(error.message));
  await fallback.addInitScript(instrument(true));
  await fallback.goto('/');
  // The shader starts once the page is idle; ten seconds covers a cold worker on a shared runner.
  await expect.poll(() => fallback.evaluate('window.__contexts'), { timeout: 10_000 }).toBeGreaterThan(0);
  await expect(fallback.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
  await bare.close();

  const moving = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await moving.newPage();
  await page.addInitScript(instrument(false));
  await page.goto('/');
  await expect.poll(() => page.evaluate('window.__contexts'), { timeout: 10_000 }).toBeGreaterThan(0);
  // Settled is no frame requested across half a second. The field settles within five seconds of
  // starting, and fifteen also covers the start's own wait on a slow runner.
  await expect
    .poll(
      async () => {
        const before = (await page.evaluate('window.__frames')) as number;
        await page.waitForTimeout(500);
        return ((await page.evaluate('window.__frames')) as number) - before;
      },
      { timeout: 15_000 },
    )
    .toBe(0);
  await moving.close();
});
```

The third context needs WebGL, which headless Chromium provides through SwiftShader. A browser in the
suite without it is skipped for that context by name, with the reason beside the skip.

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/home.spec.ts -g "hero shader"`
Expected: FAIL at the second context, because the stub never asks for a context.

- [ ] **Step 3: Implement `home-shader.tsx`**

```tsx
'use client';

import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/** Seconds the field moves for before it settles; motion over five seconds would need a pause control (WCAG 2.2.2). */
const SETTLE_SECONDS = 4.5;
/** Seconds the field takes to appear, from nothing, so the switch from the static background does not show. */
const FADE_IN_SECONDS = 0.6;
/** The loop draws at most this often; the field is slow, so more frames buy nothing. */
const FRAME_MS = 1000 / 30;
/** Above this device pixel ratio the field looks the same and costs more fill. */
const MAX_DPR = 1.5;

const VERTEX_SHADER = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

// A field of square modules on a 28-pixel grid. Each module's opacity drifts on its own phase while
// `amp` is above zero and holds the base opacity once it reaches zero. The field fades out towards the
// centre, so the hero's text sits on the plain background, and `fade` brings the whole field in from
// nothing, so the first frame matches the static background it replaces.
const FRAGMENT_SHADER = `precision mediump float;
uniform vec2 res; uniform float t; uniform float amp; uniform float fade; uniform vec3 ink; uniform float dpr;
float hash(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 px = gl_FragCoord.xy / dpr;
  vec2 cell = floor(px / 28.0);
  vec2 f = fract(px / 28.0);
  float inside = step(0.18, f.x) * step(f.x, 0.82) * step(0.18, f.y) * step(f.y, 0.82);
  float phase = hash(cell) * 6.2831;
  float a = 0.035 + amp * 0.03 * (0.5 + 0.5 * sin(t * 0.8 + phase));
  vec2 uv = gl_FragCoord.xy / res - 0.5;
  float edge = smoothstep(0.18, 0.5, length(uv * vec2(res.x / res.y, 1.0)) * 0.9);
  gl_FragColor = vec4(ink, a * inside * edge * fade);
}`;

/** The text colour as linear 0-1 RGB, read through a 2D canvas so any CSS colour syntax resolves. */
function homeShaderInk(element: HTMLElement): [number, number, number] {
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return [0, 0, 0];
  probe.fillStyle = getComputedStyle(element).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/**
 * The hero's background: a slow field of the logo's modules drawn with WebGL. It starts once the page
 * is idle, settles within five seconds and stops. Under reduced motion, without WebGL or before it
 * starts, it is an empty layer over the page's own background, so nothing moves and nothing breaks.
 */
function HomeShader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const container = host.current;
    if (!element || !container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let stopped = false;
    let visible = true;
    const start = (): void => {
      const gl = element.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
      if (!gl) return;
      const program = gl.createProgram();
      const shader = (type: number, text: string): void => {
        const unit = gl.createShader(type);
        if (!unit || !program) return;
        gl.shaderSource(unit, text);
        gl.compileShader(unit);
        gl.attachShader(program, unit);
      };
      if (!program) return;
      shader(gl.VERTEX_SHADER, VERTEX_SHADER);
      shader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const uniform = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);

      const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      const size = (): void => {
        element.width = Math.round(container.clientWidth * dpr);
        element.height = Math.round(container.clientHeight * dpr);
        gl.viewport(0, 0, element.width, element.height);
      };
      size();
      const began = performance.now();
      let last = 0;
      const draw = (now: number): void => {
        if (stopped) return;
        const seconds = (now - began) / 1000;
        const amp = Math.max(0, 1 - seconds / SETTLE_SECONDS);
        if (now - last >= FRAME_MS && visible) {
          last = now;
          gl.uniform2f(uniform('res'), element.width, element.height);
          gl.uniform1f(uniform('t'), seconds);
          gl.uniform1f(uniform('amp'), amp);
          gl.uniform1f(uniform('fade'), Math.min(1, seconds / FADE_IN_SECONDS));
          gl.uniform1f(uniform('dpr'), dpr);
          gl.uniform3f(uniform('ink'), ...homeShaderInk(container));
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        if (amp > 0) frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };

    let onScreen = true;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      visible = onScreen && document.visibilityState === 'visible';
    });
    observer.observe(container);
    const onVisibility = (): void => {
      visible = onScreen && document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibility);
    const idle = 'requestIdleCallback' in window ? window.requestIdleCallback(start) : window.setTimeout(start, 200);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      data-slot="home-shader"
      className={cn('text-foreground pointer-events-none absolute inset-0 -z-10', className)}
      {...props}
    >
      <canvas ref={canvas} className="size-full" />
    </div>
  );
}

export { HomeShader };
```

The field's opacity peaks at 6.5% of the text colour, and the field fades out towards the centre
where the headline sits. That keeps it inside the spec's contrast budget, which the step below
measures.

- [ ] **Step 4: Run the gate and the e2e**

Run: `pnpm nx run-many -t lint typecheck build test`, then `pnpm nx e2e @zeroxsolutions/registry-ui-e2e`
Expected: all pass.

Then check contrast. On the dev server, screenshot the hero at its brightest frame (about 1 s in) in
light and dark. Measure:

- the sub-headline's pixels against the pixels beside it: at least 4.5:1;
- the outline button's border against its background: at least 3:1.

Write the two ratios in the report.

- [ ] **Step 5: Commit**

`feat(registry-ui): draw the hero's module field with a settling shader`.

---

### Task 7: What c2 left: docblocks, the emoji pane, an icon comment, the status examples

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/tool-call-card.tsx:48`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/feedback/permission-card.tsx:29` and its icon at `:74-79`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/reasoning-collapsible.tsx:52`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/avatar-picker-demo.tsx`, and the avatar
  picker's docblock example in `components/data-entry/avatar-picker.tsx`
- Delete: `apps/registry-ui/registry/bases/base-ui/examples/status-indicator-{online,offline,busy,idle,pulse}.tsx`
- Modify: `apps/registry-ui/registry.json` (the five example entries), `apps/registry-ui/content/docs/components/status-indicator.mdx` (`## Examples` section)

- [ ] **Step 1: The docblocks**

Read each component's current exports first, and keep the imports each docblock names in step with
them. The three lines become:

`tool-call-card.tsx:48`:

```tsx
 *         <CodeBlock code={JSON.stringify(input, null, 2)} language="json">
 *           <CodeBlockContent><CodeBlockCode /></CodeBlockContent>
 *         </CodeBlock>
```

`permission-card.tsx:29`:

```tsx
 *     <CardContent>
 *       <CodeBlock code={command} language="bash"><CodeBlockContent><CodeBlockCode /></CodeBlockContent></CodeBlock>
 *     </CardContent>
```

`reasoning-collapsible.tsx:52`:

```tsx
 *     <ReasoningCollapsibleContent><MarkdownView>{text}</MarkdownView></ReasoningCollapsibleContent>
```

- [ ] **Step 2: The emoji pane's empty line**

In `avatar-picker-demo.tsx`, and in the avatar picker's docblock example, compose
`<EmojiPickerEmpty>No emoji found</EmojiPickerEmpty>` inside `EmojiPickerContent`, as
`emoji-picker-demo.tsx` does.

Add a case to `avatar-picker.spec.tsx`: searching a nonsense term in the emoji pane shows
`No emoji found`. Write it to that spec's existing render helpers.

- [ ] **Step 3: The permission card's icon size**

Above the `CircleCheckIcon` at `:74`, add the reason, in the same words as the tool call card's:

```tsx
{
  /* Badge sizes only its direct svg children; an animated icon's svg sits inside the icon's own div, so `size` gives it the Badge's icon size. */
}
```

- [ ] **Step 4: The status examples**

Delete the five files and their five `registry.json` entries, and the `## Examples` section of
`status-indicator.mdx` with its five previews. Then regenerate and check:

Run: `pnpm nx run-many -t examples-index shadcn-build -p @zeroxsolutions/registry-ui --skip-nx-cache`
Expected: success, with 37 examples in the build output.

Then update the item counts in AGENTS.md if it states them; Task 10 measures again.

- [ ] **Step 5: Gate and commit**

Run: `pnpm nx run-many -t lint typecheck build test`. Commit each family on its own:

- `docs(registry-ui): show the current API in three docblocks`
- `fix(registry-ui): give the avatar picker's emoji pane its empty line`
- `docs(registry-ui): say why the permission card sizes its icon`
- `docs(registry-ui): drop the status indicator examples its demo repeats`

---

### Task 8: A fresh audit against `writing-a-component`

Read-only. The controller dispatches it.

**Files:**

- Create: `.superpowers/sdd/<this plan's workspace>/component-audit.md`

- [ ] **Step 1: Dispatch five read-only auditors in parallel**

Model sonnet, one per scope:

| Auditor | Files                                                                                   |
| ------- | --------------------------------------------------------------------------------------- |
| 1       | registry `components/data-display/`                                                     |
| 2       | registry `components/data-entry/`                                                       |
| 3       | registry `components/layout/` and `components/general/`                                 |
| 4       | registry `components/feedback/`, `components/navigation/` and `blocks/`                 |
| 5       | the site: `src/components/**`, `src/app/**/_components/**` and `src/mdx-components.tsx` |

Each brief copies the c2 audit brief (`scratchpad/audit/brief.md`), with three changes:

- Rule 7 reads: every part carries `data-slot="<root>-<part>"`, the root `data-slot="<root>"`, and a
  state `data-*` is read by a recipe or a spec. A missing slot is a violation; an unread slot is not.
- Rule 11 is added: a docblock example compiles against the component's current exports.
- The site auditor also loads `gundam:structuring-a-frontend-app` with the Skill tool. It reports
  each component under `src/components/` that only one route composes, with the route it moves
  beside. This is spec c3's "components only one route composes move beside that route".

Each auditor loads `gundam:writing-a-component` with the Skill tool, reads its references, and writes
its table to `component-audit.md` under its own heading.

- [ ] **Step 2: Rule on the rows**

The controller reads the table. Each row is fixed, or it is ruled out with its reason written beside
it, the way c2's ledger records rulings.

---

### Task 9: Fix the audit's rows

- [ ] **Step 1: Dispatch the fixes**

Use one worktree per auditor scope with rows to fix, as c2's fix agents ran. Each uses its own dev
server port (3301-3305). Each works from the c2 fix brief (`audit-fix-brief.md`), with its data-slot
line replaced by the rule above. Each commits one family per commit and writes its report beside the
table.

- [ ] **Step 2: Merge and test**

The controller merges the branches into master one by one and resolves conflicts. It then runs
`pnpm nx run-many -t lint typecheck build test` and `pnpm nx e2e @zeroxsolutions/registry-ui-e2e`.
Both must pass before the next merge.

---

### Task 10: Verification

- [ ] **Step 1: The full gate on a cold tree**

Run: `pnpm nx run-many -t lint typecheck build test shadcn-build --skip-nx-cache`
Expected: `Successfully ran targets ... for 5 projects`.

- [ ] **Step 2: The e2e, rebuilding the worker**

Delete `apps/registry-ui/.open-next`, which belongs to the worker build, not `.next`. Then run
`pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache`.
Expected: every case passes, the four this plan adds included.

- [ ] **Step 3: Screenshots**

From the worker on 8787, screenshot at 1440 and 390 wide, in light and dark:

- `/`
- `/docs`
- `/docs/components/status-indicator`
- `/blocks`

Open every one. Compare it with the base-nova preview, and compare `/` with the spec's section list.
List the paths, and what each comparison found, in the final report.

- [ ] **Step 4: The worker's size**

Run: `pnpm --filter @zeroxsolutions/registry-ui exec wrangler deploy --dry-run --env production --outdir <scratch>`
Record the gzipped size, the date and the change from 5220 KiB in AGENTS.md's worker bullet. Commit:
`docs: record the worker's size after the home page`.
