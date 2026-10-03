# Registry Fixes (c6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every one of the 41 defects the two audits found in 26 registry items is fixed, each behaviour fix pinned by a unit case written red first, every preview stage fits a 390px phone, and `ci.yml`'s e2e job is green again.

**Architecture:** Fixes land in the registry's own composed items under `apps/registry-ui/registry/bases/base-ui/` (components, blocks, examples, one new hook), their `registry.json` entries and their docs pages under `apps/registry-ui/content/docs/`. No vendored primitive under `ui/` changes: where a fix would have overridden a primitive's recipe, the item composes a different primitive or a different variant of it, and the task names the source read for that decision. One e2e assertion checks every preview stage at 390 wide.

**Tech Stack:** React 19, Base UI, shadcn base-nova primitives, Tailwind v4.3, cva, vitest + Testing Library on jsdom, Playwright on the worker (port 8787), nx, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-03-registry-fixes-design.md`

## Global Constraints

- Work only in the worktree `.worktrees/registry-fixes` on branch `feat/registry-fixes`, cut from `master`. Every path below is relative to that worktree.
- Never edit anything under `apps/registry-ui/registry/bases/base-ui/ui/`. No fix passes a class that changes a vendored primitive's size, padding, radius, colour or state styling.
- One role, one drawing: a code surface, a toggle group, a tree row and a status tone each look the same in every item that draws them. A tone shown next to text is a `StatusIndicator`.
- Every animation in an item this plan touches honours reduced motion, and the state it animates still changes (`motion-safe:` on the animating utility, so the end state applies either way).
- Every part keeps its own `data-slot`; copy stays sentence case; every character written is plain ASCII.
- A part whose API or `data-*` changes has its docs page under `apps/registry-ui/content/docs/` changed in the same task; `src/lib/source.spec.ts` checks pages against `registry.json` and the family files, and `registry/registry.spec.ts` checks `registry.json` against the files' imports.
- Unit cases assert behaviour only: roles, names, attributes, text, call arguments, computed style. No case asserts a class name.
- Unit runs: `pnpm nx test @zeroxsolutions/registry-ui -- <pattern>`. E2e runs: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache -- <spec>`; the `--skip-nx-cache` matters, because a cached `wrangler:build` from another checkout hangs the worker.
- Never `pkill` or `killall` by pattern: the user's `next dev` on :3000 runs `workerd`. Kill only PIDs you started (and their descendants, found with `pgrep -P <pid>`). After any e2e or capture run, confirm `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.
- Never delete `.next` in the main checkout, and never delete shared caches (`node_modules/.vite`, `.nx/cache`, `~/.cache`).
- Commits use conventional messages and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never `--no-verify`, never `HUSKY=0`. The pre-commit hook formats staged files and runs `lint typecheck build test`; a file with unstaged edits beside staged ones stops it, so stage whole files.
- Before writing each file, load the gundam skill that governs it with the Skill tool: `writing-a-component` for a component or demo, `writing-unit-tests` for a spec, `writing-e2e-tests` for the e2e, `writing-prose` and `writing-plain-ascii` for a docs page, `writing-comments` for a docblock, `landing-a-change` before each commit.

## Review Focus

- A long unbroken line (a URL, minified JSON) in a `CodeBlock` placed in any narrow flex parent, not only the docs stage: the block must scroll on its own rail and never widen its parent. Task 6's stage check covers the code-block and tool-call-card pages at 390; Task 3's containment is on the block itself, so it holds in a chat message too.
- A number field the user cancels with Escape and then edits again: the next blur must commit the new draft, not stay cancelled. Task 4 Step 1 pins it.
- A font `src` that is a real data URL (`data:font/woff2;base64,...` with `+`, `/`, `=`) or a URL with a query: escaping must leave it loading the same file. Task 2 Step 1 pins it.
- A resize handle whose caller handles a key itself (`onKeyDown` calling `preventDefault()`): the handle must then skip its own resize or toggle, the same contract its pointer handlers already keep. Task 4 Step 1 pins it.
- A Markdown list that mixes task items and plain bullets: only `[ ]`/`[x]` items become checkboxes, and a plain bullet keeps its bullet. Task 2 Step 1 pins it.

---

### Task 1: The Command Menu demo opens closed

`ci.yml`'s e2e job is red on `master` because `command-menu-demo` opens its modal `CommandDialog` on mount, which hides the docs page's `h1` from the accessibility tree, so `component-pages.spec.ts`'s `getByRole('heading', { level: 1 })` fails on that page. Upstream's own base example (`apps/v4/examples/base/command-dialog.tsx` in shadcn-ui/ui, read for this plan) starts `useState(false)` and opens from a key chord.

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/examples/command-menu-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`
- Modify: `apps/registry-ui/registry.json` (the `command-menu-demo` entry)

**Interfaces:**

- Consumes: `CommandMenu`, `CommandMenuItem` (`components/navigation/command-menu.tsx`), `useCommandShortcut` (`hooks/use-command-shortcut.ts`), `Button` (`ui/button.tsx`), `Kbd`, `KbdGroup` (`ui/kbd.tsx`).
- Produces: nothing later tasks import.

- [ ] **Step 0: Create the worktree and check the baseline**

```bash
cd /Users/tus/ZeroXSolutions/ui-sdk
git worktree add .worktrees/registry-fixes -b feat/registry-fixes master
cd .worktrees/registry-fixes
pnpm install --frozen-lockfile
pnpm nx test @zeroxsolutions/registry-ui
```

Expected: install succeeds; every spec passes. Every later command runs from `.worktrees/registry-fixes`.

- [ ] **Step 1: Write the failing cases**

In `examples.spec.tsx`, add the import beside `PermissionCardDemo`'s, and two cases inside `describe('examples', ...)`, after the permission-card case:

```tsx
import { CommandMenuDemo } from './command-menu-demo';
```

```tsx
it('command-menu-demo loads closed and opens from its button', async () => {
  render(<CommandMenuDemo />);
  await act(async () => {});
  expect(screen.queryByRole('dialog')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  expect(await screen.findByRole('dialog')).toBeTruthy();
});

it('command-menu-demo opens on Ctrl+K', async () => {
  render(<CommandMenuDemo />);
  await act(async () => {});
  expect(screen.queryByRole('dialog')).toBeNull();

  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  expect(await screen.findByRole('dialog')).toBeTruthy();
});
```

The production edit that turns both red is `useState(true)` in the demo.

- [ ] **Step 2: Run them red**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/examples/examples.spec.tsx`
Expected: both new cases FAIL at `expect(screen.queryByRole('dialog')).toBeNull()` (the dialog is open on mount); every other case passes.

- [ ] **Step 3: Open the menu from a button and the chord only**

Replace the whole of `command-menu-demo.tsx` with:

```tsx
'use client';

import { useState, type ReactNode } from 'react';

import { CommandMenu, CommandMenuItem } from '@/registry/bases/base-ui/components/navigation/command-menu';
import { useCommandShortcut } from '@/registry/bases/base-ui/hooks/use-command-shortcut';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { CommandEmpty, CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';
import { Kbd, KbdGroup } from '@/registry/bases/base-ui/ui/kbd';

const FILES = ['SKILL.md', 'scripts/run.py', 'settings.json'] as const;

/** A command palette, opened from its button or by Ctrl/Cmd+K, that reports the chosen file. */
function CommandMenuDemo(): ReactNode {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string>('SKILL.md');
  useCommandShortcut({ key: 'k', onTrigger: () => setOpen(true) });

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open menu
        </Button>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
      <p className="text-muted-foreground text-sm">Picked: {picked}</p>
      <CommandMenu open={open} onOpenChange={setOpen} onValueChange={setPicked}>
        <CommandInput placeholder="Jump to file..." />
        <CommandList>
          <CommandEmpty>No file found.</CommandEmpty>
          {FILES.map((file) => (
            <CommandMenuItem key={file} value={file}>
              {file}
            </CommandMenuItem>
          ))}
        </CommandList>
      </CommandMenu>
    </div>
  );
}

export { CommandMenuDemo };
```

In `registry.json`, the `command-menu-demo` entry becomes:

```json
{
  "name": "command-menu-demo",
  "type": "registry:example",
  "title": "Command Menu Demo",
  "description": "A command palette, opened from its button or by Ctrl/Cmd+K, that reports the chosen file.",
  "categories": ["examples"],
  "registryDependencies": [
    "@shadcn/button",
    "@shadcn/command",
    "@shadcn/kbd",
    "https://ui.zeroxsolutions.com/r/command-menu.json"
  ],
  "files": [
    { "path": "registry/bases/base-ui/examples/command-menu-demo.tsx", "type": "registry:example" },
    { "path": "registry/bases/base-ui/hooks/use-command-shortcut.ts", "type": "registry:hook" }
  ]
}
```

- [ ] **Step 4: Run the unit specs green**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/examples/examples.spec.tsx registry/registry.spec.ts`
Expected: PASS. If `registry.spec.ts` names a dependency, add or drop exactly what it names.

- [ ] **Step 5: Run the page e2e that is red on master**

Run: `lsof -nP -iTCP:8787 -sTCP:LISTEN` (expect nothing), then
`pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache -- src/component-pages.spec.ts`
Expected: PASS in chromium, firefox and webkit (the command-menu page's `h1` is found). Then `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.

- [ ] **Step 6: Commit**

```bash
git add apps/registry-ui/registry/bases/base-ui/examples/command-menu-demo.tsx apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx apps/registry-ui/registry.json
git commit -m "fix(registry-ui): open the command menu demo from a button, not on load

The demo opened its modal on mount, which hid the docs page's h1 and kept
ci.yml's e2e job red.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Data display, behaviour and specs (font-preview, highlighted-code, image-preview, markdown-view, ai-provider-card)

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/font-preview.tsx`
- Create: `apps/registry-ui/registry/bases/base-ui/components/data-display/font-preview.spec.tsx`
- Create: `apps/registry-ui/registry/bases/base-ui/components/data-display/highlighted-code.spec.tsx`
- Create: `apps/registry-ui/registry/bases/base-ui/components/data-display/image-preview.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/markdown-view.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/markdown-view.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/ai-provider-card.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/ai-provider-card.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/ai-provider-card-demo.tsx`
- Modify: `apps/registry-ui/registry.json` (`ai-provider-card`, `markdown-view`)
- Modify: `apps/registry-ui/content/docs/components/ai-provider-card.mdx`
- Modify: `apps/registry-ui/content/docs/components/markdown-view.mdx`

**Interfaces:**

- Consumes: `StatusIndicator` (`components/feedback/status-indicator.tsx`), `StatusTone` (`types/status-tone.ts`), `Checkbox` (`ui/checkbox.tsx`).
- Produces: `AiProviderCardLabel({ tone?: StatusTone, ...span props })` and `AiProviderCardLabelProps`; `AiProviderCard` takes `React.ComponentProps<typeof Card>` only (its `status` prop, `data-status` and `AiProviderCardProps` are gone). Task 5's `ai-provider-picker.tsx` composes `AiProviderCardLabel` without `tone`.

- [ ] **Step 1: Write the failing cases**

Create `font-preview.spec.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FontPreview } from './font-preview';

afterEach(cleanup);

const PANGRAM = 'The quick brown fox jumps over the lazy dog';

function fontFaceText(): string {
  return document.querySelector('[data-slot=font-preview] style')?.textContent ?? '';
}

describe('FontPreview', () => {
  it('draws one specimen per default size, largest first, in the pangram', () => {
    render(<FontPreview src="/fonts/inter.woff2" />);
    expect(screen.getAllByText(PANGRAM).map((specimen) => specimen.style.fontSize)).toEqual([
      '36px',
      '24px',
      '18px',
      '14px',
    ]);
  });

  it('draws the caller text at the sizes it is given, each labelled with its size', () => {
    render(
      <FontPreview src="/fonts/inter.woff2" sizes={[20, 12]}>
        Sphinx of black quartz
      </FontPreview>,
    );
    expect(screen.getAllByText('Sphinx of black quartz')).toHaveLength(2);
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('loads the file under the family its specimens are set in, with the format read off the extension', () => {
    render(<FontPreview src="/fonts/inter.woff2" />);
    const family = screen.getAllByText(PANGRAM)[0].style.fontFamily;
    expect(fontFaceText()).toContain(`font-family: '${family}'`);
    expect(fontFaceText()).toContain('url("/fonts/inter.woff2") format("woff2")');
  });

  it('keeps a data URL intact', () => {
    const src = 'data:font/woff2;base64,d09GMgABAAAAA+/=';
    render(<FontPreview src={src} format="woff2" />);
    expect(fontFaceText()).toContain(`url("${src}") format("woff2")`);
  });

  it('keeps a src or format that tries to close the rule inside its string, leaving the page styles alone', () => {
    render(
      <>
        <div data-testid="sentinel">Sentinel</div>
        <FontPreview
          src={'/x.woff2"); } [data-testid="sentinel"] { display: none; } @font-face { src: url("'}
          format={'woff2") } * { color: red } x { a: ("'}
        />
      </>,
    );
    const style = document.querySelector('[data-slot=font-preview] style') as HTMLStyleElement;
    expect(style.sheet?.cssRules).toHaveLength(1);
    expect(getComputedStyle(screen.getByTestId('sentinel')).display).toBe('block');
  });
});
```

Create `highlighted-code.spec.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HighlightedCode } from './highlighted-code';

afterEach(cleanup);

describe('HighlightedCode', () => {
  it('shows its raw children while it has no lines', () => {
    render(<HighlightedCode lines={null}>const x = 1</HighlightedCode>);
    expect(screen.getByText('const x = 1')).toBeTruthy();
  });

  it('paints each token in its own colour, a newline between lines, in place of the children', () => {
    const { container } = render(
      <HighlightedCode
        lines={[[{ content: 'const', style: { color: 'rgb(1, 2, 3)' } }, { content: ' x' }], [{ content: '}' }]]}
      >
        raw
      </HighlightedCode>,
    );
    expect(container.querySelector('[data-slot=highlighted-code]')?.textContent).toBe('const x\n}');
    expect(screen.getByText('const').style.color).toBe('rgb(1, 2, 3)');
    expect(screen.queryByText('raw')).toBeNull();
  });
});
```

Create `image-preview.spec.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ImagePreview, ImagePreviewImage } from './image-preview';

afterEach(cleanup);

describe('ImagePreview', () => {
  it('shows the image it holds, named by its alt', () => {
    render(
      <ImagePreview>
        <ImagePreviewImage src="/logo.png" alt="Logo" />
      </ImagePreview>,
    );
    expect(screen.getByRole('img', { name: 'Logo' }).getAttribute('src')).toBe('/logo.png');
  });

  it('treats an image with no alt as decorative', () => {
    render(
      <ImagePreview>
        <ImagePreviewImage src="/logo.png" />
      </ImagePreview>,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('presentation').getAttribute('src')).toBe('/logo.png');
  });
});
```

In `markdown-view.spec.tsx`, add `fireEvent` to the Testing Library import and add, inside its `describe`:

```tsx
it('draws each GFM task item as a read-only checkbox in its state', async () => {
  render(<MarkdownView>{'- [x] Ship the parser\n- [ ] Document the API'}</MarkdownView>);
  await settle();
  const [done, open] = screen.getAllByRole('checkbox');
  expect(done.getAttribute('aria-checked')).toBe('true');
  expect(open.getAttribute('aria-checked')).toBe('false');
  expect(open.getAttribute('aria-readonly')).toBe('true');

  fireEvent.click(open);
  expect(open.getAttribute('aria-checked')).toBe('false');
});

it('leaves a plain bullet a bullet beside task items', async () => {
  render(<MarkdownView>{'- [x] Ship the parser\n- Plain note'}</MarkdownView>);
  await settle();
  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  expect(screen.getByText('Plain note').closest('li')?.getAttribute('data-slot')).toBeNull();
});
```

In `ai-provider-card.spec.tsx`, replace the two cases `'carries the status tone on the root for the status note to read'` and `'sets no status when none is given'` (lines 57-74) with:

```tsx
it("draws the label's tone as a status dot before its text", () => {
  const { container } = render(
    <AiProviderCard>
      <CardFooter>
        <AiProviderCardLabel tone="busy">Command failed</AiProviderCardLabel>
      </CardFooter>
    </AiProviderCard>,
  );

  expect(container.querySelector('[data-slot=status-indicator]')?.getAttribute('data-tone')).toBe('busy');
  expect(screen.getByText('Command failed')).toBeTruthy();
});

it('draws no dot on a label given no tone', () => {
  const { container } = render(<AiProviderCardLabel>12 models</AiProviderCardLabel>);

  expect(container.querySelector('[data-slot=status-indicator]')).toBeNull();
});
```

The production edits that turn each red: `font-preview` interpolating `src`/`format` raw (hostile case); `markdown-view` having no `input`/`li` renderer (task cases); `AiProviderCardLabel` taking no `tone` (dot cases). The highlighted-code and image-preview cases pin behaviour that already holds; Step 4 proves each can fail.

- [ ] **Step 2: Run them red**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/data-display`
Expected: FAIL in `font-preview.spec.tsx` (the hostile case: `cssRules` has more than 1 rule, the sentinel's `display` is `none`), in `markdown-view.spec.tsx` (the native checkbox has no `aria-checked`), in `ai-provider-card.spec.tsx` (no `status-indicator` slot). `highlighted-code.spec.tsx` and `image-preview.spec.tsx` PASS.

- [ ] **Step 3: Implement**

`font-preview.tsx`. Replace lines 32-34:

```tsx
const css = `@font-face { font-family: '${family}'; src: url("${src}")${
  fmt ? ` format("${fmt}")` : ''
}; font-display: swap; }`;
```

with:

```tsx
const css = `@font-face { font-family: '${family}'; src: url(${cssString(src)})${
  fmt ? ` format(${cssString(fmt)})` : ''
}; font-display: swap; }`;
```

and add above `function FontPreview`:

```tsx
/**
 * `value` as a double-quoted CSS string. Every character outside the set a URL or a format name uses is
 * written as a CSS hex escape, so no value can close the string, the rule or the `<style>` element.
 */
function cssString(value: string): string {
  return `"${value.replace(/[^\w.~:/?#&=%+,;@!$*'-]/gu, (char) => `\\${char.codePointAt(0)?.toString(16)} `)}"`;
}
```

On line 42, the specimen span gets `min-w-0`, so `truncate` can cut it inside its row (a flex item's minimum width is otherwise its text width):

```tsx
          <span className="text-foreground min-w-0 truncate leading-snug" style={{ fontFamily: family, fontSize: size }}>
```

`markdown-view.tsx`. Add the import `import { Checkbox } from '@/registry/bases/base-ui/ui/checkbox';` beside the `Table` import. Add, after `MarkdownViewTable`:

```tsx
/** A GFM task item: its read-only checkbox and its text on one row, with no bullet before them. */
function MarkdownViewTaskItem({ className, ...props }: ComponentProps<'li'>): ReactNode {
  return (
    <li data-slot="markdown-view-task-item" className={cn('flex list-none items-start gap-2', className)} {...props} />
  );
}
```

In `markdownViewComponents`, after the `td` entry, add:

```tsx
  li: ({ node: _node, className, ...props }) =>
    className?.includes('task-list-item') ? (
      <MarkdownViewTaskItem className={className} {...props} />
    ) : (
      <li className={className} {...props} />
    ),
  // GFM's task marker, as nova's Checkbox: read-only, so the reader sees the state and cannot change it.
  input: ({ node: _node, type, checked, disabled: _disabled, ...props }) =>
    type === 'checkbox' ? <Checkbox checked={checked === true} readOnly className="mt-1" /> : <input type={type} {...props} />,
```

(`mt-1` is placement: it sets the 16px box on the first line of the item's 14px/1.625 text.) Update the `markdownViewComponents` docblock's first sentence to: `The renderers: tables as upstream's \`Table\` parts, GFM task items as a read-only \`Checkbox\`, and fenced code as a \`CodeBlock\`, ...` keeping the rest.

`ai-provider-card.tsx`. Replace lines 1-53 (imports through `AiProviderCardLabel`) with:

```tsx
import * as React from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';
import { Card, CardDescription } from '@/registry/bases/base-ui/ui/card';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { StatusTone } from '@/registry/bases/base-ui/types/status-tone';

/**
 * A tile for one AI provider in an overview grid. The consumer composes
 * `CardHeader` + `CardTitle` (brand mark and name), an `AiProviderCardDescription`,
 * a `CardFooter` holding an `AiProviderCardLabel` and an `AiProviderCardAction`,
 * and, when the tile selects, an `AiProviderCardTrigger` that covers the card.
 * Defaults to the small card size.
 */
function AiProviderCard({ size = 'sm', className, ...props }: React.ComponentProps<typeof Card>): React.ReactNode {
  return (
    <Card
      data-slot="ai-provider-card"
      size={size}
      className={cn('group/ai-provider-card relative h-full', className)}
      {...props}
    />
  );
}

/** The provider blurb, clamped to two lines. */
function AiProviderCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>): React.ReactNode {
  return (
    <CardDescription data-slot="ai-provider-card-description" className={cn('line-clamp-2', className)} {...props} />
  );
}

interface AiProviderCardLabelProps extends React.ComponentProps<'span'> {
  /** The status a dot before the note reports; omit for a note with no dot. */
  tone?: StatusTone;
}

/**
 * The footer note (a model count, or an attention message) in muted text. Given a `tone`, a
 * `StatusIndicator` before it carries the status, so the note stays readable at any tone.
 */
function AiProviderCardLabel({ tone, className, children, ...props }: AiProviderCardLabelProps): React.ReactNode {
  return (
    <span
      data-slot="ai-provider-card-label"
      className={cn('text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs', className)}
      {...props}
    >
      {tone && <StatusIndicator tone={tone} />}
      <span className="truncate">{children}</span>
    </span>
  );
}
```

Replace the last two lines (86-87) with:

```tsx
export { AiProviderCard, AiProviderCardAction, AiProviderCardDescription, AiProviderCardLabel, AiProviderCardTrigger };
export type { AiProviderCardLabelProps };
```

`ai-provider-card-demo.tsx`: line 39 `<AiProviderCard key={provider.name} status={provider.status}>` becomes `<AiProviderCard key={provider.name}>`, and line 45 `<AiProviderCardLabel>{provider.note}</AiProviderCardLabel>` becomes `<AiProviderCardLabel tone={provider.status}>{provider.note}</AiProviderCardLabel>`. Its docblock and `registry.json` description stay.

`registry.json`, `ai-provider-card` entry: description becomes `"A small card for one AI provider in an overview grid, whose footer note carries a status dot and whose covering trigger selects it."`, `registryDependencies` becomes `["@shadcn/card", "@shadcn/utils", "https://ui.zeroxsolutions.com/r/status-indicator.json"]`, and the `cssVars` block is deleted (the card's own file no longer paints `success` or `warning`; `status-indicator` carries them). `markdown-view` entry: `registryDependencies` becomes `["@shadcn/checkbox", "@shadcn/table", "@shadcn/utils", "https://ui.zeroxsolutions.com/r/code-block.json", "https://ui.zeroxsolutions.com/r/collapsible-card.json"]`.

`ai-provider-card.mdx`:

- Frontmatter `description:` becomes the new registry description above.
- Manual step command (line 32) `pnpm dlx shadcn@latest add card utils` becomes `pnpm dlx shadcn@latest add card utils https://ui.zeroxsolutions.com/r/status-indicator.json`.
- Delete the step `<Step>Add the \`success\` and \`warning\` colours, as [Installation](/docs/installation#colours) describes.</Step>` and its blank line.
- Usage snippet: `<AiProviderCard status="online">` becomes `<AiProviderCard>`, and `<AiProviderCardLabel>12 models</AiProviderCardLabel>` becomes `<AiProviderCardLabel tone="online">12 models</AiProviderCardLabel>`.
- `### AiProviderCard`: delete its props table and the sentence about `data-status`; the section reads: `Renders shadcn's [\`Card\`](https://ui.shadcn.com/docs/components/base/card) and takes every prop it takes. It defaults Card's \`size\` to \`sm\`. It sets \`data-slot="ai-provider-card"\`.`
- `### AiProviderCardLabel` becomes:

```md
### AiProviderCardLabel

Renders a `span` and takes every prop a `span` takes, plus:

| Prop   | Type                                        | Default |
| ------ | ------------------------------------------- | ------- |
| `tone` | `'online' \| 'offline' \| 'busy' \| 'idle'` | -       |

A model count or an attention message in muted text. Given a `tone`, a `StatusIndicator` before the text
reports the status; the text itself keeps one colour at every tone. It sets `data-slot="ai-provider-card-label"`.
```

`markdown-view.mdx`: the manual command (line 38) becomes `pnpm dlx shadcn@latest add checkbox table utils https://ui.zeroxsolutions.com/r/code-block.json https://ui.zeroxsolutions.com/r/collapsible-card.json`; in the `### MarkdownView` paragraph, after the sentence ending `stays a muted chip.`, insert: `A GFM task item is an \`li\` with \`data-slot="markdown-view-task-item"\` holding a read-only \`Checkbox\` in its state, with no bullet.`

- [ ] **Step 4: Run them green, and prove the two passing specs can fail**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/data-display registry/bases/base-ui/blocks registry/registry.spec.ts src/lib/source.spec.ts`
Expected: PASS.

Then, one at a time: in `highlighted-code.tsx` change `{i < lines.length - 1 ? '\n' : null}` to `{null}` and rerun `highlighted-code.spec.tsx` (expect the newline case FAIL), and revert; in `image-preview.tsx` change `alt = ''` to `alt = 'image'` and rerun `image-preview.spec.tsx` (expect the decorative case FAIL), and revert. Confirm `git diff` shows neither file changed.

- [ ] **Step 5: Commit**

```bash
git add apps/registry-ui/registry/bases/base-ui/components/data-display apps/registry-ui/registry/bases/base-ui/examples/ai-provider-card-demo.tsx apps/registry-ui/registry.json apps/registry-ui/content/docs/components/ai-provider-card.mdx apps/registry-ui/content/docs/components/markdown-view.mdx
git commit -m "fix(registry-ui): escape font-preview's font-face, draw task items and status dots

A src or format holding a quote could end the @font-face rule and restyle the
page. GFM task items drew the browser's checkbox after a bullet. The provider
card's 12px toned text fell under 4.5:1; the tone now rides on a StatusIndicator.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Data display, what anyone sees (code-block, highlighted-code demo, data-table-column-header, file-tree, model-info-card, tree-item)

Decisions this task carries, each keeping a primitive's recipe untouched:

- **tree-item rows.** `TreeItem` rendered upstream's `Item` at `size="xs"`, whose recipe pads `py-2 px-2.5`; a 24px trigger inside made a 42px row against file-tree's 28px, and a class shortening it would override Item's padding. Upstream's own tree (`apps/v4/examples/base/collapsible-file-tree.tsx` in shadcn-ui/ui, read for this plan) draws its rows at 28px with no Item. So `TreeItem` stops composing `Item` and draws its row as `FileTreeLabel` draws one (`min-h-7`, `rounded-md`, muted hover), the registry's one tree-row drawing.
- **tree-item chevron.** The ghost `Button` recipe (`ui/button.tsx` line 16) fills `aria-expanded:bg-muted`, so an expanded folder's chevron stayed filled. Upstream's file tree draws its file rows with `variant="link"`, and the link variant (line 19) has no expanded fill. `TreeItemTrigger` becomes `variant="link" size="icon-xs"`: same size, nova's focus ring from the base recipe, no fill; the row's own hover is the hover.

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/code-block.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/highlighted-code-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/data-table-column-header.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/file-tree.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/model-info-card-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/model-info-card.tsx` (docblock only)
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/tree-item.tsx`
- Modify: `apps/registry-ui/registry.json` (`tree-item`)
- Modify: `apps/registry-ui/content/docs/components/tree-item.mdx`
- Modify: `apps/registry-ui/content/docs/components/model-info-card.mdx`

**Interfaces:**

- Consumes: nothing new.
- Produces: `TreeItemProps extends React.ComponentProps<'div'>` with `expanded`, `leaf`, `editing` (no Item `size`/`variant`/`render`). The code surface every later task matches: `CollapsibleCard variant="muted"` (Task 5 gives it `rounded-xl`) with the code padded `px-3 pt-2 pb-3`.

- [ ] **Step 1: Confirm the existing behaviour specs before the row changes**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/data-display/tree-item.spec.tsx registry/bases/base-ui/components/data-display/file-tree.spec.tsx registry/bases/base-ui/components/data-display/code-block.spec.tsx`
Expected: PASS. These pin what the row change must keep (ref to the row div, `aria-expanded` from the row, the trigger's click not reaching the row, rename keys). No defect in this task is a behaviour, so no new case is written; Task 6's stage check is the failing test for the code-block overflow.

- [ ] **Step 2: Implement**

`code-block.tsx` line 121. The scroller's min-content was its longest line, so in any shrink-to-fit parent the block grew to that line and the parent scrolled instead of the block. Inline-size containment takes the code out of the block's intrinsic width:

```tsx
      <ScrollAreaPrimitive.Root className="w-full overflow-hidden contain-inline-size">
```

Replace comment line 120 with:

```tsx
{
  /* The pre's bottom padding clears that rail, which Base UI positions over the viewport's bottom edge. */
}
{
  /* Inline-size containment keeps the longest line out of the block's own width, so a narrow parent scrolls the code here instead of widening. */
}
```

`highlighted-code-demo.tsx` line 8. The demo draws the code surface `CodeBlock` draws (the muted collapsible card's fill and the content's padding):

```tsx
    <pre className="bg-muted/50 m-0 rounded-xl px-3 pt-2 pb-3 text-xs leading-relaxed">
```

`data-table-column-header.tsx` line 102. Upstream's base data table (`apps/v4/examples/base/data-table-demo.tsx`, read for this plan) draws its sortable header as a default-size ghost `Button`, the plain header's 14px:

```tsx
      render={<Button variant="ghost" className="-ml-2.5" />}
```

`file-tree.tsx`, in `FileTreeLabel`. Line 351 becomes nova's focus ring width:

```tsx
        'group-focus-visible/file-tree-item:ring-ring/50 group-focus-visible/file-tree-item:ring-3',
```

and the chevron's class (line `className={cn('flex shrink-0 transition-transform', item.expanded && 'rotate-90')}`) becomes:

```tsx
          className={cn('flex shrink-0 motion-safe:transition-transform', item.expanded && 'rotate-90')}
```

`model-info-card-demo.tsx`: line 38 `tone="chart-1"` becomes `tone="chart-2"` and line 49 `tone="chart-4"` becomes `tone="chart-3"`. The preset's chart greys are one value in both themes, and only the middle two clear both backgrounds. `model-info-card.tsx` docblock line 32 and `model-info-card.mdx` line 76: `tone="chart-1"` becomes `tone="chart-2"`.

`tree-item.tsx`. Remove `import { Item } from '@/registry/bases/base-ui/ui/item';`. Replace lines 24-80 (`TreeItemProps` through the end of `TreeItem`) with:

```tsx
interface TreeItemProps extends React.ComponentProps<'div'> {
  /** Whether the node's children are shown; sets `data-expanded` and the trigger's `aria-expanded`. */
  expanded?: boolean;
  /** Whether the node has no children; sets `data-leaf`, which keeps the name aligned with its siblings' names. */
  leaf?: boolean;
  /** Whether the row is being renamed; sets `data-editing`. */
  editing?: boolean;
}

/**
 * One row of a hierarchy tree (a layer tree, a scene outliner, a file tree),
 * drawn as `FileTree` draws its rows: 28px high, rounded, muted on hover, on one
 * line, so a long name truncates instead of dropping the actions onto a second
 * line. It grows to fit a `TreeItemRenameInput` while renaming. The row owns the
 * `group/tree-item` its parts style off. The consumer composes the rest:
 *
 *   <TreeItem expanded={open}>
 *     <TreeItemIndent depth={0}>
 *       <TreeItemTrigger aria-label="Toggle src" onClick={toggle} />
 *     </TreeItemIndent>
 *     <TreeItemLabel><ItemTitle>src</ItemTitle></TreeItemLabel>
 *   </TreeItem>
 *   <TreeItem leaf>
 *     <TreeItemIndent depth={1} />
 *     <TreeItemLabel><ItemTitle>index.ts</ItemTitle></TreeItemLabel>
 *   </TreeItem>
 *
 * A `TreeItemRenameInput` replaces the title while renaming, and `ItemActions`
 * holds trailing actions. Selection state and drag handlers go on the row
 * itself. A context menu wraps the row as `ContextMenuTrigger render={<TreeItem />}`.
 *
 * `ref` reaches the row div - a consumer needs it for `scrollIntoView`, and a
 * wrapping Base UI `render` trigger composes its ref through it.
 */
function TreeItem({
  expanded = false,
  leaf = false,
  editing = false,
  className,
  ...props
}: TreeItemProps): React.ReactNode {
  const context = React.useMemo(() => ({ expanded }), [expanded]);
  return (
    <TreeItemContext.Provider value={context}>
      <div
        data-slot="tree-item"
        data-expanded={expanded || undefined}
        data-leaf={leaf || undefined}
        data-editing={editing || undefined}
        className={cn(
          'group/tree-item text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex min-h-7 w-full min-w-0 items-center gap-1.5 rounded-md ps-1.5 pe-2 text-sm transition-colors outline-none focus-visible:ring-3',
          className,
        )}
        {...props}
      />
    </TreeItemContext.Provider>
  );
}
```

In `TreeItemTrigger`, the docblock's first sentence becomes `The disclosure control of a folder row: upstream's link \`icon-xs\` button, which has no expanded fill, holding a chevron that turns while the row is \`expanded\`, with \`aria-expanded\` from the row.`; `variant="ghost"`becomes`variant="link"`; and the chevron becomes:

```tsx
<ChevronRightIcon ref={iconRef} className="group-data-expanded/tree-item:rotate-90 motion-safe:transition-transform" />
```

`registry.json`, `tree-item` entry: description becomes `"One row of a hierarchy tree, drawn as the file tree's rows, with a depth indent, a disclosure trigger, a clickable label and an inline rename input."` and `registryDependencies` drops `"@shadcn/item"`. The `tree-item-demo` entry keeps `@shadcn/item` (the demo composes `ItemTitle`).

`tree-item.mdx`:

- Frontmatter `description:` becomes the new registry description.
- Manual command (line 32) becomes `pnpm dlx shadcn@latest add button input utils https://lucide-animated.com/r/chevron-right.json`.
- `### TreeItem` first line becomes `Renders a \`div\` and takes every prop a \`div\` takes, plus:`; the paragraph under its table becomes: `The row draws as File Tree's rows do: 28px high, rounded, muted on hover, on one line so a long name truncates; it grows to fit a rename input. It sets \`data-slot="tree-item"\`, \`data-expanded\` while expanded, \`data-leaf\` while a leaf, and \`data-editing\` while being renamed.`
- `### TreeItemTrigger`: `a ghost icon button` becomes `a link icon button, with no fill while expanded,`.

- [ ] **Step 3: Run the specs green**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/data-display registry/bases/base-ui/examples registry/registry.spec.ts src/lib/source.spec.ts`
Expected: PASS. Then `pnpm nx run @zeroxsolutions/registry-ui:typecheck` (a consumer passing Item's `size` to `TreeItem` would fail here; none in the repo does).

- [ ] **Step 4: Commit**

```bash
git add apps/registry-ui/registry/bases/base-ui/components/data-display apps/registry-ui/registry/bases/base-ui/examples/highlighted-code-demo.tsx apps/registry-ui/registry/bases/base-ui/examples/model-info-card-demo.tsx apps/registry-ui/registry.json apps/registry-ui/content/docs/components/tree-item.mdx apps/registry-ui/content/docs/components/model-info-card.mdx
git commit -m "fix(registry-ui): one code surface and one tree row, code that scrolls in place

A long line widened a code block's parent at 390px instead of scrolling on its
own rail. Tree Item rows were 42px against File Tree's 28px, with a filled
chevron while expanded; the sortable header was 12.8px beside 14px headers.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Data entry (avatar-picker, emoji-appearance-toggle-group, emoji-picker, language-toggle-group, number-field, resize-handle, icon-label demo)

Decisions this task carries:

- **avatar-picker swatches** are the registry's own buttons (no primitive draws a colour disc; a `Toggle` would need its recipe's fill overridden by the swatch's colour). They take nova's control size (`size-8`, `ui/button.tsx`'s `icon`), nova's focus ring (`focus-visible:ring-3 focus-visible:ring-ring/50`), and mark the selection the way nova's `Checkbox` marks checked (`ui/checkbox.tsx`): a check icon, no offset ring and no scale.
- **resize-handle focus** uses upstream `ResizableHandle`'s own focus classes (`ui/resizable.tsx` line 37: `ring-offset-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden`), since this handle is that recipe's fork.
- **toggle groups** both take `ToggleGroup`'s default `spacing` (2, `ui/toggle-group.tsx` line 26), so neither passes a spacing.

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/number-field.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/number-field.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/resize-handle.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/resize-handle-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/avatar-picker.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/emoji-picker.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/emoji-picker-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-entry/language-toggle-group.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/icon-label-demo.tsx`
- Modify: `apps/registry-ui/content/docs/components/resize-handle.mdx`
- Modify: `apps/registry-ui/content/docs/components/avatar-picker.mdx`
- Modify: `apps/registry-ui/content/docs/components/emoji-appearance-toggle-group.mdx`
- Modify: `apps/registry-ui/content/docs/components/emoji-picker.mdx`
- Modify: `apps/registry-ui/content/docs/components/language-toggle-group.mdx`
- Modify: `apps/registry-ui/content/docs/components/number-field.mdx`

**Interfaces:**

- Consumes: `cn`, `Check` from `lucide-react`.
- Produces: `ResizeHandleProps` gains `value: number` (required), `min?: number`, `max?: number`, `step?: number` (default 10). The CSS custom property `--emoji-picker-surface`, read by `EmojiPickerGroupLabel`, defaulting to `var(--background)`.

- [ ] **Step 1: Write the failing cases**

`number-field.spec.tsx`: add `act` to the Testing Library import, and add inside `describe('NumberField', ...)`:

```tsx
it('drops the draft on Escape and commits nothing', () => {
  const onValueChange = vi.fn();
  renderField({ value: 5, onValueChange });
  const input = screen.getByRole('textbox') as HTMLInputElement;

  act(() => input.focus());
  fireEvent.change(input, { target: { value: '42' } });
  fireEvent.keyDown(input, { key: 'Escape' });

  expect(onValueChange).not.toHaveBeenCalled();
  expect(input.value).toBe('5');
  expect(document.activeElement).not.toBe(input);
});

it('commits the next edit after an Escape', () => {
  const onValueChange = vi.fn();
  renderField({ value: 5, onValueChange });
  const input = screen.getByRole('textbox') as HTMLInputElement;

  act(() => input.focus());
  fireEvent.change(input, { target: { value: '42' } });
  fireEvent.keyDown(input, { key: 'Escape' });
  act(() => input.focus());
  fireEvent.change(input, { target: { value: '9' } });
  act(() => input.blur());

  expect(onValueChange.mock.calls).toEqual([[9]]);
});
```

`resize-handle.spec.tsx`: add `screen` to the Testing Library import; add `value={200}` to every existing `<ResizeHandle` render (the prop becomes required); add inside `describe('ResizeHandle', ...)`:

```tsx
it('is a focusable vertical separator reporting the width it is given', () => {
  render(
    <ResizeHandle aria-label="Resize panel" value={200} min={120} max={320} onDrag={() => {}} onToggle={() => {}} />,
  );
  const handle = screen.getByRole('separator', { name: 'Resize panel' });

  handle.focus();
  expect(document.activeElement).toBe(handle);
  expect(handle.getAttribute('aria-orientation')).toBe('vertical');
  expect(handle.getAttribute('aria-valuenow')).toBe('200');
  expect(handle.getAttribute('aria-valuemin')).toBe('120');
  expect(handle.getAttribute('aria-valuemax')).toBe('320');
});

it('resizes by its step on the arrow keys and toggles on Enter', () => {
  const onDrag = vi.fn();
  const onToggle = vi.fn();
  render(<ResizeHandle aria-label="Resize panel" value={200} step={16} onDrag={onDrag} onToggle={onToggle} />);
  const handle = screen.getByRole('separator', { name: 'Resize panel' });

  fireEvent.keyDown(handle, { key: 'ArrowRight' });
  fireEvent.keyDown(handle, { key: 'ArrowLeft' });
  fireEvent.keyDown(handle, { key: 'Enter' });

  expect(onDrag.mock.calls).toEqual([[16], [-16]]);
  expect(onToggle).toHaveBeenCalledTimes(1);
});

it('resizes by 10px a press when no step is given', () => {
  const onDrag = vi.fn();
  render(<ResizeHandle aria-label="Resize panel" value={200} onDrag={onDrag} onToggle={() => {}} />);

  fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize panel' }), { key: 'ArrowRight' });

  expect(onDrag).toHaveBeenCalledWith(10);
});

it("skips its own key action when the caller's onKeyDown prevents the default", () => {
  const onDrag = vi.fn();
  const onToggle = vi.fn();
  render(
    <ResizeHandle
      aria-label="Resize panel"
      value={200}
      onDrag={onDrag}
      onToggle={onToggle}
      onKeyDown={(event) => event.preventDefault()}
    />,
  );
  const handle = screen.getByRole('separator', { name: 'Resize panel' });

  fireEvent.keyDown(handle, { key: 'ArrowRight' });
  fireEvent.keyDown(handle, { key: 'Enter' });

  expect(onDrag).not.toHaveBeenCalled();
  expect(onToggle).not.toHaveBeenCalled();
});
```

The production edits that turn each red: `number-field` letting the Escape-triggered blur run `commit()` over the stale draft; `resize-handle` rendering a plain `div` with no role, tab stop or key handler.

- [ ] **Step 2: Run them red**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/data-entry/number-field.spec.tsx registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx`
Expected: FAIL. Number field: `onValueChange` was called with `42`. Resize handle: `Unable to find an accessible element with the role "separator"`. Every existing case passes.

- [ ] **Step 3: Implement the behaviour**

`number-field.tsx`. After line 78 (`const [draft, setDraft] = React.useState('');`) add:

```tsx
// Escape blurs the input to end the edit; this tells the blur's commit that the draft was dropped.
const cancelled = React.useRef(false);
```

`begin` (lines 90-93) becomes:

```tsx
const begin = React.useCallback(() => {
  cancelled.current = false;
  setEditing(true);
  setDraft(mixed || displayText ? '' : String(value));
}, [value, mixed, displayText]);
```

`commit` (lines 103-107) becomes:

```tsx
const commit = React.useCallback(() => {
  setEditing(false);
  if (cancelled.current) return;
  const result = parseRaw ? parseRaw(draft) : evaluateExpression(draft);
  if (result !== null) onValueChange(clamp(result));
}, [draft, parseRaw, onValueChange, clamp]);
```

The Escape branch (lines 113-116) becomes:

```tsx
      } else if (event.key === 'Escape') {
        cancelled.current = true;
        setEditing(false);
        event.currentTarget.blur();
```

`resize-handle.tsx`. `ResizeHandleProps` (lines 14-19) becomes:

```tsx
interface ResizeHandleProps extends Omit<ComponentProps<'div'>, 'onDrag'> {
  /** Width delta in px since the last move or arrow press; apply it to the panel size. */
  onDrag: (dx: number) => void;
  /** Double-click and Enter action (e.g. collapse/expand the panel). */
  onToggle: () => void;
  /** The panel's current width in px, reported as the separator's value. */
  value: number;
  /** The narrowest width the caller allows, reported as the separator's minimum. */
  min?: number;
  /** The widest width the caller allows, reported as the separator's maximum. */
  max?: number;
  /** Pixels one Left or Right arrow press resizes by; 10 when omitted. */
  step?: number;
}
```

In the docblock, replace the paragraph's sentences `The fork is pointer-only: it has neither upstream's focus ring nor its keyboard resizing, and upstream's recipe fixes do not reach it.` with `It answers the keyboard as upstream's handle does: a focusable \`separator\` carrying its orientation and \`value\`, Left and Right resize by \`step\`, Enter fires \`onToggle\`, under upstream's focus ring. Upstream's recipe fixes do not reach it.`, and add to the last paragraph: `A caller's own \`onKeyDown\` runs first too, and \`preventDefault()\` there skips the key's action.`

The parameter list adds `value`, `min`, `max`, `step = 10` and `onKeyDown` after `onToggle`. The returned `div` becomes:

```tsx
    <div
      data-slot="resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      className={cn(
        'bg-border ring-offset-background focus-visible:ring-ring relative flex w-px shrink-0 cursor-col-resize touch-none items-center justify-center select-none after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:outline-hidden',
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          onDrag(event.key === 'ArrowRight' ? step : -step);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          onToggle();
        }
      }}
```

with the pointer and double-click handlers, `{...props}` and the grip child unchanged.

`resize-handle-demo.tsx`. `useState(200)` becomes `useState(160)` (at 390 the panel then leaves the "Canvas" label clear), and the `ResizeHandle` gains:

```tsx
        <ResizeHandle
          aria-label="Resize panel"
          value={collapsed ? COLLAPSED_WIDTH : width}
          min={MIN_WIDTH}
          max={MAX_WIDTH}
          onDrag={(dx) => {
```

`resize-handle.mdx`: the Usage snippet adds `value={width}` and `aria-label="Resize panel"`; the props table becomes:

```md
| Prop       | Type                   | Default  |
| ---------- | ---------------------- | -------- |
| `onDrag`   | `(dx: number) => void` | required |
| `onToggle` | `() => void`           | required |
| `value`    | `number`               | required |
| `min`      | `number`               | -        |
| `max`      | `number`               | -        |
| `step`     | `number`               | `10`     |
```

and before `It sets \`data-slot="resize-handle"\`.`insert:`It is a focusable \`separator\` with \`aria-orientation="vertical"\`, \`aria-valuenow\` from \`value\` and \`aria-valuemin\`/\`aria-valuemax\` from \`min\`/\`max\`; Left and Right call \`onDrag\` with \`-step\`/\`step\`, Enter calls \`onToggle\`, and a caller's \`onKeyDown\` that prevents the default skips both. Give it an \`aria-label\`.`

`number-field.mdx`, `### NumberField` paragraph: after `clamped the same way.` insert ` Escape drops the draft and commits nothing.`

- [ ] **Step 4: Run them green**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/data-entry/number-field.spec.tsx registry/bases/base-ui/components/data-entry/resize-handle.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Implement what anyone sees**

`avatar-picker.tsx`. Line 1 becomes `import { Check, Trash2 } from 'lucide-react';`. The swatch `button` (lines 344-353) becomes:

```tsx
<button
  key={c}
  type="button"
  onClick={() => setColor(c)}
  aria-label={c}
  aria-pressed={value.color === c}
  style={{ backgroundColor: c }}
  className="focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-full text-white outline-none focus-visible:ring-3"
>
  {value.color === c && <Check aria-hidden className="size-4" />}
</button>
```

The `AvatarPickerColorGroupProps.colors` docblock adds: `The pressed swatch carries a white check.` `AvatarPickerEmojiContent` passes the popover surface to the picker's labels:

```tsx
    <TabsContent
      data-slot="avatar-picker-emoji-content"
      value="emoji"
      className={cn('[--emoji-picker-surface:var(--popover)]', className)}
      {...props}
    >
```

(destructure `className` in its parameters). `avatar-picker.mdx`, `### AvatarPickerColorGroup`: after `while it is the avatar's colour;` insert ` the pressed one carries a check;`, and in `### AvatarPickerEmojiContent` add the sentence `It sets \`--emoji-picker-surface\` to the popover colour, so the picker's group labels paint the popover.`

`emoji-picker.tsx`. `EmojiPickerGroupLabel` (docblock and body) becomes:

```tsx
/**
 * Sticky section heading - this is what the frequent row's name / a category name is.
 * Drawn as the preset's own group labels (`ComboboxLabel`, `SelectLabel`), on
 * the surface the picker sits on so rows scrolling under it stay hidden: the
 * page background, or `--emoji-picker-surface` where a container sets it (the
 * avatar picker sets its popover's colour).
 */
function EmojiPickerGroupLabel({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="emoji-picker-group-label"
      className={cn(
        'text-muted-foreground bg-[var(--emoji-picker-surface,var(--background))] px-2 py-1.5 text-xs',
        className,
      )}
      {...props}
    />
  );
}
```

If the Tailwind lint rule asks for the canonical spelling `bg-(--emoji-picker-surface,var(--background))`, take it. `emoji-picker.mdx`, `### EmojiPickerGroupLabel`: `on the popover surface so rows scrolling under it stay hidden` becomes `on the surface the picker sits on, so rows scrolling under it stay hidden: the page background, or \`--emoji-picker-surface\` where a container sets it`.

`emoji-picker-demo.tsx` line 18: `<div className="flex w-72 flex-col gap-2">` becomes `<div className="flex w-full max-w-72 flex-col gap-2">`.

`emoji-appearance-toggle-group.tsx`. Add `import { cn } from '@/registry/bases/base-ui/lib/utils';`. The root's docblock sentence `Outlined and spaced apart unless \`variant\` or \`spacing\` say otherwise.`becomes`Outlined, at the toggle group's default spacing, and wrapping onto further rows when narrower than its swatches.` The function becomes:

```tsx
function EmojiAppearanceToggleGroup({
  value,
  onValueChange,
  className,
  ...props
}: EmojiAppearanceToggleGroupProps): ReactNode {
  return (
    <ToggleGroup
      // Single-select: Base UI's value is an array; bind the lone style and
      // ignore a deselect so a style is always chosen.
      data-slot="emoji-appearance-toggle-group"
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as FluentEmojiStyle | undefined;
        if (picked) onValueChange(picked);
      }}
      variant="outline"
      aria-label="Emoji style"
      className={cn('flex-wrap', className)}
      {...props}
    />
  );
}
```

The item's docblock tail `drawn as large as fits the toggle (h-8) so the styles read apart.` becomes `drawn at \`size-6\` (24px), the largest that leaves the 32px toggle its padding, so the styles read apart. The \`mono\` artwork is black, so it inverts in the dark theme.`The`FluentEmoji` className becomes:

```tsx
        className={cn('size-6 object-contain', value === 'mono' && 'dark:invert')}
```

`emoji-appearance-toggle-group.mdx`: in `### EmojiAppearanceToggleGroup`, `It defaults \`variant\` to \`outline\`, \`spacing\` to \`2\` and \`aria-label\` to \`"Emoji style"\`.`becomes`It defaults \`variant\` to \`outline\` and \`aria-label\` to \`"Emoji style"\`, keeps the toggle group's default spacing, and wraps its swatches onto further rows when narrower than they are.`; in `### EmojiAppearanceToggleGroupItem`, `the preview is drawn as large as fits the toggle (\`h-8\`).`becomes`the preview is drawn at \`size-6\` (24px), and the \`mono\` artwork inverts in the dark theme.`

`language-toggle-group.tsx`: delete line 28 `spacing={0}`; the docblock's `Outlined and joined unless \`variant\` or \`spacing\` say otherwise.`becomes`Outlined, at the toggle group's default spacing, unless \`variant\` or \`spacing\` say otherwise.` `language-toggle-group.mdx`line 77:`defaults \`variant\` to \`outline\` and \`spacing\` to \`0\`.`becomes`defaults \`variant\` to \`outline\` and keeps the toggle group's default spacing.`

`icon-label-demo.tsx` line 14: `<div className="flex items-center gap-4">` becomes `<div className="flex flex-wrap items-center gap-4">`.

- [ ] **Step 6: Run the folder and the doc checks**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/data-entry registry/bases/base-ui/examples registry/registry.spec.ts src/lib/source.spec.ts`
Expected: PASS. The avatar-picker case `'marks the current colour swatch pressed and sets the colour on a click'` still passes (names and `aria-pressed` are unchanged).

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/registry/bases/base-ui/components/data-entry apps/registry-ui/registry/bases/base-ui/examples/resize-handle-demo.tsx apps/registry-ui/registry/bases/base-ui/examples/emoji-picker-demo.tsx apps/registry-ui/registry/bases/base-ui/examples/icon-label-demo.tsx apps/registry-ui/content/docs/components
git commit -m "fix(registry-ui): Escape cancels a number edit, the resize handle takes the keyboard

Escape committed the stale draft through the blur it triggered. The resize
handle had no role, tab stop or keys. Swatches, toggle groups, emoji labels and
three demos now draw at nova's sizes and spacing and fit 390px.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Feedback, layout, navigation and the block (collapsible-card, floating-toolbar, model-list, reasoning-collapsible, status-indicator, tool-call-card, ai-provider-picker)

Decisions this task carries:

- **tool-call-card header.** Its trigger rendered a ghost `Button`, whose recipe fills `aria-expanded:bg-muted` (`ui/button.tsx` line 16), so an open card kept a grey band; overriding that state would rewrite the recipe. The link variant (line 19) has no expanded fill, and upstream's base file tree (`apps/v4/examples/base/collapsible-file-tree.tsx`) composes `variant="link"` buttons for rows. The trigger becomes `variant="link"`: same height and padding, open and closed alike at rest, nova's link hover.
- **reasoning-collapsible hook** moves to `hooks/use-reasoning-collapsible.ts` with its context, because the demo and the docs word the trigger's label with it; kept internal, no consumer could.
- **collapsible-card content spacing** belongs to the consumer, because `CodeBlockContent` composes `CollapsibleCardContent` unpadded and pads its own `pre`; the examples and docs pad a text body `p-3`, the small card's `--card-spacing` (`ui/card.tsx`).

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/collapsible-card.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/collapsible-card.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/data-display/code-block.spec.tsx` (line 113)
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/collapsible-card-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/collapsible-card-variants.tsx`
- Modify: `apps/registry-ui-e2e/src/motion.spec.ts` (line 87)
- Create: `apps/registry-ui/registry/bases/base-ui/hooks/use-reasoning-collapsible.ts`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/reasoning-collapsible.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/reasoning-collapsible.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/reasoning-collapsible-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/blocks/ai-provider-picker.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/blocks/ai-provider-picker.spec.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/feedback/tool-call-card.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/feedback/status-indicator.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/floating-toolbar.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/model-list.tsx`
- Modify: `apps/registry-ui/registry.json` (`reasoning-collapsible`)
- Modify: `apps/registry-ui/content/docs/components/collapsible-card.mdx`
- Modify: `apps/registry-ui/content/docs/components/reasoning-collapsible.mdx`
- Modify: `apps/registry-ui/content/docs/components/tool-call-card.mdx`
- Modify: `apps/registry-ui/content/docs/components/status-indicator.mdx`
- Modify: `apps/registry-ui/content/docs/blocks/ai-provider-picker.mdx`

**Interfaces:**

- Consumes: `AiProviderCardLabel` without `tone` (Task 2).
- Produces: `hooks/use-reasoning-collapsible.ts` exporting `ReasoningCollapsibleContext`, `useReasoningCollapsible(): ReasoningCollapsibleContextValue` and the type `ReasoningCollapsibleContextValue { streaming: boolean; isOpen: boolean; duration: number | undefined }`. `reasoning-collapsible.tsx` exports `ReasoningCollapsible`, `ReasoningCollapsibleTrigger`, `ReasoningCollapsibleContent` only. An icon-only `CollapsibleCardTrigger` is named `Toggle content`.

- [ ] **Step 1: Write the failing cases**

`collapsible-card.spec.tsx`: replace every `{ name: 'Toggle' }` (lines 35, 43, 82, 98) with `{ name: 'Toggle content' }`, and add inside the `describe`:

```tsx
it('names a trigger with text children by that text', () => {
  render(
    <CollapsibleCard>
      <CollapsibleCardTrigger>Layers</CollapsibleCardTrigger>
      <CollapsibleCardContent>Body</CollapsibleCardContent>
    </CollapsibleCard>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Layers' }));
  expect(screen.queryByText('Body')).toBeNull();
});
```

`code-block.spec.tsx` line 113: `{ name: 'Toggle' }` becomes `{ name: 'Toggle content' }`.

`reasoning-collapsible.spec.tsx`: the import block (lines 5-10) becomes:

```tsx
import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
} from './reasoning-collapsible';
import { useReasoningCollapsible } from '../../hooks/use-reasoning-collapsible';
```

`ai-provider-picker.spec.tsx`, inside its `describe`:

```tsx
it('draws a footer only for an entry with a meta note', () => {
  const { container } = render(<AiProviderPicker entries={ENTRIES} />);

  expect(container.querySelectorAll('[data-slot=card-footer]')).toHaveLength(1);
  expect(screen.getByText('12 models')).toBeTruthy();
});
```

The production edits that turn each red: `aria-label="Toggle"` applied ahead of `{...props}` whatever the children; the hook living in the family file; `CardFooter` rendered unconditionally.

- [ ] **Step 2: Run them red**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/layout registry/bases/base-ui/components/data-display/code-block.spec.tsx registry/bases/base-ui/blocks`
Expected: FAIL. collapsible-card and code-block: no button named `Toggle content` / `Layers`. reasoning-collapsible: `Failed to resolve import "../../hooks/use-reasoning-collapsible"`. ai-provider-picker: 2 footers, expected 1.

- [ ] **Step 3: Implement the behaviour and structure**

`collapsible-card.tsx`. The trigger's docblock becomes:

```tsx
/**
 * The ghost icon button that opens and closes the body. With no `children` it
 * shows a chevron that turns over while the body is open and plays while the
 * button is hovered or focused, and is named "Toggle content" unless an
 * `aria-label` is given; `children` replace the chevron and name the button.
 */
```

Line 106 `aria-label="Toggle"` becomes:

```tsx
      aria-label={children === undefined || children === null ? 'Toggle content' : undefined}
```

and the chevron's class (line 131) becomes `motion-safe:transition-transform group-aria-expanded/collapsible-card-trigger:rotate-180`.

Create `hooks/use-reasoning-collapsible.ts`:

```ts
import { createContext, useContext } from 'react';

interface ReasoningCollapsibleContextValue {
  streaming: boolean;
  isOpen: boolean;
  /** Whole seconds the last stream lasted, rounded up; undefined until a stream has ended. */
  duration: number | undefined;
}

const ReasoningCollapsibleContext = createContext<ReasoningCollapsibleContextValue | null>(null);

/**
 * Read the live reasoning state (`streaming`, `isOpen`, `duration`) from inside a
 * `<ReasoningCollapsible>`, for example to word the trigger's label. Throws when
 * used outside `<ReasoningCollapsible>`.
 */
function useReasoningCollapsible(): ReasoningCollapsibleContextValue {
  const ctx = useContext(ReasoningCollapsibleContext);
  if (!ctx) throw new Error('ReasoningCollapsible parts must be used within <ReasoningCollapsible>');
  return ctx;
}

export { ReasoningCollapsibleContext, useReasoningCollapsible };
export type { ReasoningCollapsibleContextValue };
```

`reasoning-collapsible.tsx`: line 1 becomes `import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';`; add `import { ReasoningCollapsibleContext } from '@/registry/bases/base-ui/hooks/use-reasoning-collapsible';` after the `ui/` imports; delete lines 12-30 (the interface, the context and the hook); the label span's class (line 159) becomes `min-w-0 flex-1 truncate text-left group-data-streaming/reasoning-collapsible:motion-safe:animate-pulse`; the chevron's class (line 165) becomes `motion-safe:transition-transform group-aria-expanded/reasoning-collapsible-trigger:rotate-180`; the last export (line 184) becomes `export { ReasoningCollapsible, ReasoningCollapsibleTrigger, ReasoningCollapsibleContent };`. In the root's docblock, `\`useReasoningCollapsible\` hands the label its timing:`becomes`\`useReasoningCollapsible\` (\`hooks/use-reasoning-collapsible\`) hands the label its timing:`.

`reasoning-collapsible-demo.tsx` imports (lines 6-11) become:

```tsx
import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
} from '@/registry/bases/base-ui/components/layout/reasoning-collapsible';
import { useReasoningCollapsible } from '@/registry/bases/base-ui/hooks/use-reasoning-collapsible';
```

`registry.json`, `reasoning-collapsible` entry `files` becomes:

```json
"files": [
  { "path": "registry/bases/base-ui/components/layout/reasoning-collapsible.tsx", "type": "registry:component" },
  { "path": "registry/bases/base-ui/hooks/use-reasoning-collapsible.ts", "type": "registry:hook" }
]
```

`ai-provider-picker.tsx`: the entry docblock (line 24) becomes `/** The muted footer note, such as "12 models"; omitted, the card has no footer. */`, and lines 102-104 become:

```tsx
{
  entry.meta && (
    <CardFooter className="mt-auto">
      <AiProviderCardLabel>{entry.meta}</AiProviderCardLabel>
    </CardFooter>
  );
}
```

- [ ] **Step 4: Run them green**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- registry/bases/base-ui/components/layout registry/bases/base-ui/components/data-display/code-block.spec.tsx registry/bases/base-ui/blocks registry/bases/base-ui/examples`
Expected: PASS.

- [ ] **Step 5: Implement what anyone sees**

`collapsible-card.tsx` line 13: `muted: 'rounded-md bg-muted/50',` becomes `muted: 'rounded-xl bg-muted/50',` (both surfaced variants take the card's radius; `CodeBlock`'s default surface follows).

`collapsible-card-demo.tsx` line 22 and `collapsible-card-variants.tsx` line 26: `className="px-3 pb-3"` becomes `className="p-3"`.

`tool-call-card.tsx`: the trigger docblock's first sentence becomes `The header row that toggles the sections: a full-width link button in the card's flow, which draws the same open or closed, holding the consumer's icon, title, description and status,`; line 97 becomes `render={<Button variant="link" />}`; the chevron's class (line 121) becomes `motion-safe:transition-transform group-aria-expanded/tool-call-card-trigger:rotate-180`.

`status-indicator.tsx` line 27-28 become:

```tsx
        'inline-block size-2 shrink-0 rounded-full data-pulse:motion-safe:animate-pulse',
        'data-[tone=busy]:bg-destructive data-[tone=idle]:bg-warning data-[tone=offline]:ring-muted-foreground data-[tone=online]:bg-success data-[tone=offline]:ring-1 data-[tone=offline]:ring-inset',
```

and the docblock adds: `Offline draws as a hollow ring, so it reads as a shape where a faint fill would vanish.`

`floating-toolbar.tsx` line 19: `rounded-sm` becomes `rounded-lg` and `shadow-lg` becomes `shadow-md`, the corners and shadow of nova's `PopoverContent` (`ui/popover.tsx` line 36).

`model-list.tsx`, `ModelListHeader`: `px-1 pt-1` becomes `px-3 pt-3`, the inset of the `Item size="sm"` rows below (`ui/item.tsx` line 48).

`motion.spec.ts` line 87: `{ name: 'Toggle', exact: true }` becomes `{ name: 'Toggle content', exact: true }`.

Docs:

- `collapsible-card.mdx`: the Usage snippet's `<CollapsibleCardContent>Background, shadow, text</CollapsibleCardContent>` becomes `<CollapsibleCardContent className="p-3">Background, shadow, text</CollapsibleCardContent>`. `### CollapsibleCardTrigger`: `named "Toggle" unless an \`aria-label\` is given. Its default content is a chevron that turns over while the body is open and plays while the button is hovered or focused; \`children\` replace it.`becomes`Its default content is a chevron that turns over while the body is open and plays while the button is hovered or focused, and it is then named "Toggle content" unless an \`aria-label\` is given; \`children\` replace the chevron and name the button.` `### CollapsibleCardContent`adds:`It pads nothing: a text body takes \`p-3\`, the small card's spacing, and a \`CodeBlockContent\` pads its own code.`
- `reasoning-collapsible.mdx`: the manual step list adds, after the component's `ComponentSource`:

```md
<Step>Copy the hook that reads the reasoning state into `hooks/use-reasoning-collapsible.ts`.</Step>

<ComponentSource
  name="reasoning-collapsible"
  file="registry/bases/base-ui/hooks/use-reasoning-collapsible.ts"
  title="hooks/use-reasoning-collapsible.ts"
/>
```

The Usage import block becomes the two imports from the demo (with `@/components/layout/reasoning-collapsible` and `@/hooks/use-reasoning-collapsible`). Delete the `### useReasoningCollapsible` section from the API reference, and append its content to the Usage paragraph that begins `The label and the body are the consumer's`: `\`useReasoningCollapsible()\` returns \`{ streaming, isOpen, duration }\` from inside a \`<ReasoningCollapsible>\`; \`duration\` is the last stream's whole seconds, rounded up, undefined until one has ended, and it throws outside one.`In`### ReasoningCollapsibleTrigger`, `which pulses while the root is streaming` stays.

- `tool-call-card.mdx`, `### ToolCallCardTrigger`: `full-width, left-justified, ghost [\`Button\`]`becomes`full-width, left-justified, link [\`Button\`]`, and after `while the sections are open,`insert` drawing the same open or closed,`.
- `status-indicator.mdx`: in the `### StatusIndicator` paragraph before `It sets`, insert `Offline draws as a hollow ring rather than a fill.`
- `blocks/ai-provider-picker.mdx` line 91: `the muted footer note, such as \`12 models\``becomes`the muted footer note, such as \`12 models\`; omitted, no footer`.

- [ ] **Step 6: Run the unit gate and the motion e2e**

Run: `pnpm nx test @zeroxsolutions/registry-ui`
Expected: PASS, `registry.spec.ts` and `source.spec.ts` included.
Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache -- src/motion.spec.ts`
Expected: PASS in all three browsers. Then `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.

- [ ] **Step 7: Commit**

```bash
git add apps/registry-ui/registry/bases/base-ui apps/registry-ui/registry.json apps/registry-ui/content/docs apps/registry-ui-e2e/src/motion.spec.ts
git commit -m "fix(registry-ui): name the card trigger by its text, draw open headers like closed

A trigger with text children was still named Toggle. An entry with no meta drew
an empty footer. useReasoningCollapsible moves to hooks/ beside its context.
Chevrons and pulses hold still under reduced motion; offline reads as a ring.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Stage overflow check, cold gate, full e2e and the PNGs

**Files:**

- Modify: `apps/registry-ui-e2e/src/component-pages.spec.ts`
- Create (scratchpad, not committed): `/private/tmp/claude-501/-Users-tus-ZeroXSolutions-ui-sdk/46e0d9e5-152f-45bb-a5c0-fa086a4ac035/scratchpad/c6-after/capture.mjs`

**Interfaces:**

- Consumes: every earlier task.
- Produces: the e2e assertion; the after PNGs.

- [ ] **Step 1: Write the stage assertion**

In `component-pages.spec.ts`, after the existing page-level poll (lines 23-25) and before the `networkidle` comment, add:

```ts
// The page itself never scrolls sideways, because each preview stage scrolls its own demo; so a demo
// too wide for a phone shows only as its stage scrolling. A stage's viewport is its direct child.
await expect
  .poll(
    () =>
      page
        .locator('[data-slot=component-preview-stage] > [data-slot=scroll-area-viewport]')
        .evaluateAll((viewports) =>
          viewports
            .filter((viewport) => viewport.scrollWidth > viewport.clientWidth)
            .map((viewport) => `${viewport.scrollWidth} > ${viewport.clientWidth}`),
        ),
    { message: `${name}: a preview stage scrolls sideways` },
  )
  .toEqual([]);
```

Rename the test to `'every component page renders its preview, fits a phone without a stage scrolling sideways, and throws nothing'`.

- [ ] **Step 2: Prove it can fail, then run it green**

Temporarily revert Task 3's `contain-inline-size` in `code-block.tsx` and run:
`pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache -- src/component-pages.spec.ts --project=chromium`
Expected: FAIL with `code-block: a preview stage scrolls sideways`. Restore the class (confirm with `git diff` that `code-block.tsx` is unchanged), then run without `--project`:
`pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache -- src/component-pages.spec.ts`
Expected: PASS in chromium, firefox and webkit. If a page this plan does not name fails, stop and report it with its widths; do not loosen the check. Confirm `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.

- [ ] **Step 3: Commit the assertion**

```bash
git add apps/registry-ui-e2e/src/component-pages.spec.ts
git commit -m "test(registry-ui-e2e): fail a component page whose preview stage scrolls sideways at 390

The page-level check passed while a demo overflowed, because the stage scrolls
itself.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: The cold gate and the registry build**

Run: `pnpm nx run-many -t lint typecheck test build --skip-nx-cache`
Expected: `Successfully ran targets lint, typecheck, test, build` for every project.
Run: `pnpm nx run @zeroxsolutions/registry-ui:shadcn-build --skip-nx-cache`
Expected: exit 0, ending with `shadcn registry validate registry.json` reporting no error.

- [ ] **Step 5: The full e2e suite**

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache`
Expected: every case passes in chromium, firefox and webkit, `component-pages` included. Then `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.

- [ ] **Step 6: Capture the after PNGs**

The before set is `scratchpad/c6-visual/`, captured from `master` at 024e99aa: each preview stage as `<name>[-exN]-<width>-<light|dark>.png`, plus state shots `avatar-picker-open-color-1440-*`, `avatar-picker-open-emoji-1440-*`, `file-tree-focus-1440-*`. The after set uses the same names in `scratchpad/c6-after/`.

Start the worker from the worktree in the background and record its PID:

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN   # expect nothing
pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui --skip-nx-cache   # run_in_background; note the PID
```

Poll `curl -s -o /dev/null -w '%{http_code}' http://localhost:8787/docs` until it prints `200`.

Write the throwaway script `scratchpad/c6-after/capture.mjs` (not committed):

```js
// Throwaway: captures every c6 item's preview stages after the fixes, named as the before set in c6-visual/.
const { chromium } = await import(process.env.PLAYWRIGHT_ENTRY);

const BASE = 'http://localhost:8787';
const OUT =
  '/private/tmp/claude-501/-Users-tus-ZeroXSolutions-ui-sdk/46e0d9e5-152f-45bb-a5c0-fa086a4ac035/scratchpad/c6-after';
const ITEMS = [
  'ai-provider-card',
  'avatar-picker',
  'code-block',
  'collapsible-card',
  'data-table-column-header',
  'emoji-appearance-toggle-group',
  'emoji-picker',
  'file-tree',
  'floating-toolbar',
  'font-preview',
  'highlighted-code',
  'icon-label',
  'language-toggle-group',
  'markdown-view',
  'model-info-card',
  'model-list',
  'resize-handle',
  'status-indicator',
  'tool-call-card',
  'tree-item',
];

const browser = await chromium.launch();
const report = [];
for (const scheme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      colorScheme: scheme,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    for (const name of ITEMS) {
      await page.goto(`${BASE}/docs/components/${name}`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForLoadState('networkidle');
      const stages = page.locator('[data-slot=component-preview-stage]');
      for (let i = 0; i < (await stages.count()); i++) {
        const suffix = i === 0 ? '' : `-ex${i + 1}`;
        await stages
          .nth(i)
          .screenshot({ path: `${OUT}/${name}${suffix}-${width}-${scheme}.png`, animations: 'disabled' });
      }
      // Reduced motion: every motion-safe utility on the page must resolve to no transition and no animation.
      const moving = await page.evaluate(
        () =>
          [...document.querySelectorAll('[class*="motion-safe:"]')].filter((el) => {
            const style = getComputedStyle(el);
            return style.transitionDuration !== '0s' || style.animationName !== 'none';
          }).length,
      );
      report.push(`${name} ${width} ${scheme}: ${moving} element(s) still moving under reduced motion`);
    }
    if (width === 1440) {
      await page.goto(`${BASE}/docs/components/avatar-picker`);
      await page.getByRole('button', { name: 'Edit avatar' }).first().click();
      await page.getByRole('tab', { name: 'Color' }).click();
      await page
        .locator('[data-slot=avatar-picker-content]')
        .screenshot({ path: `${OUT}/avatar-picker-open-color-1440-${scheme}.png` });
      await page.getByRole('tab', { name: 'Emoji' }).click();
      await page
        .locator('[data-slot=avatar-picker-content]')
        .screenshot({ path: `${OUT}/avatar-picker-open-emoji-1440-${scheme}.png` });
      await page.goto(`${BASE}/docs/components/file-tree`);
      await page.locator('[data-slot=file-tree-item]').first().focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
      await page
        .locator('[data-slot=component-preview-stage]')
        .first()
        .screenshot({ path: `${OUT}/file-tree-focus-1440-${scheme}.png` });
    }
    await context.close();
  }
}
await browser.close();
console.log(report.join('\n'));
```

Run it:

```bash
cd /private/tmp/claude-501/-Users-tus-ZeroXSolutions-ui-sdk/46e0d9e5-152f-45bb-a5c0-fa086a4ac035/scratchpad/c6-after
PLAYWRIGHT_ENTRY=$(ls -d /Users/tus/ZeroXSolutions/ui-sdk/.worktrees/registry-fixes/node_modules/.pnpm/playwright@*/node_modules/playwright/index.mjs | head -1) node capture.mjs
```

Expected: every line of the report ends `0 element(s) still moving under reduced motion`. If a demo's tab or button name differs from the script's, read it off the page and fix the script, not the demo.

Stop the worker: kill the recorded PID and its descendants only, then confirm the port is free:

```bash
descendants() { for child in $(pgrep -P "$1"); do descendants "$child"; echo "$child"; done; }
kill $(descendants "$WORKER_PID") "$WORKER_PID"
lsof -nP -iTCP:8787 -sTCP:LISTEN   # expect nothing
```

- [ ] **Step 7: Review the pairs**

Open each before/after pair (`c6-visual/<file>` against `c6-after/<file>`) for every row of the spec's "What anyone sees" table, and write in the report, one line per row, what the after shows against the spec's "After the fix" column: the provider labels muted with a dot; 32px swatches with a check and no ring offset; the code block scrolling in its own rail at 390; one code fill and padding; one radius for default and muted cards with spaced bodies; the sortable header at the plain header's size; Mono visible in dark and the emoji group wrapping at 390; both toggle groups detached; emoji labels painting the page or the popover; file-tree focus at nova's width; the toolbar's corners and shadow; the specimen ending in an ellipsis; icon-label and resize-handle readable at 390; task items as checkboxes; every model-info bar visible; the model-list header aligned; offline as a ring; an open tool-call header unfilled; tree rows at 28px with no filled chevron. Flag any that does not match. Nothing here is committed.
