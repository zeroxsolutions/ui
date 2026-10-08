# House Animated Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The registry owns its 37 animated icons: each lives at `registry/bases/base-ui/icons/<name>-icon.tsx`, is published as the item `<name>-icon` that lands at a consumer's `components/general/<name>-icon.tsx`, renders a `span` wrapper, and starts nothing under reduced motion.

**Architecture:** One scripted move (files, imports, `registry.json`, docs install lines) with asserted counts, then one scripted edit of the icon sources (wrapper, types, reduced-motion guard, licence header) with three icons finished by hand, then the registry build. `registry.spec.ts` derives the house URL for a file under `icons/`, so the declaration check keeps every item honest.

**Tech Stack:** Next.js registry app on nx, shadcn 4.21.0 CLI (`shadcn build`, `shadcn registry validate`), React 19, Motion 12.42.2 (`motion/react`), Vitest with jsdom and Testing Library, Python 3 for the sweeping scripts.

**Spec:** `docs/superpowers/specs/2026-10-06-house-animated-icons-design.md`

## Global Constraints

- Every path below is relative to `apps/registry-ui/` unless it starts with `docs/`.
- The 37 icons are exactly the files in `registry/bases/base-ui/ui/` matching `^export interface \w+IconHandle\b`.
- Item name `<name>-icon`; file `registry/bases/base-ui/icons/<name>-icon.tsx`; file type `registry:ui`; `target` `components/general/<name>-icon.tsx`; item URL `https://ui.zeroxsolutions.com/r/<name>-icon.json`.
- Exports keep upstream's names: `<Name>Icon`, `<Name>IconHandle`.
- Nothing under `registry/bases/base-ui/ui/` is edited; files only leave it.
- Header line in every icon: `// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.`
- Wrapper: `<span data-slot="<name>-icon" className={cn("inline-flex", className)} ...>`, props typed `HTMLAttributes<HTMLSpanElement>`.
- Reduced motion: `useReducedMotion()` from `motion/react`; hover start and handle `startAnimation` return before any `.start(` when it reads true. `stopAnimation` and mouse leave are unchanged.
- Drawing, variants, transitions, default `size` and handle stay byte-for-byte upstream's.
- No item in `registry.json` and no docs page names `lucide-animated.com`.
- A sweeping edit asserts its count before writing (gundam `making-a-sweeping-edit`).
- Text in new files is plain ASCII.

## Review Focus

- A consumer that already has lucide-animated's `components/ui/eye.tsx` adds `password-input`: the house icon must land beside it at `components/general/eye-icon.tsx`, not over it. Pinned in Task 1 by the `target` case in `registry.spec.ts` and in Task 3 by reading `public/r/eye-icon.json`.
- An icon driven through its ref (controlled) under reduced motion: `startAnimation()` must start nothing. Pinned in Task 2's table spec.
- A caller's `className` and `aria-hidden` must reach the `span`, merged after `inline-flex`. Pinned in Task 2's table spec.
- The docs site's own chrome (mode switcher, mobile nav, docs pager) imports icons from the old path: the move must reach `src/`, and its specs must still pass. Pinned in Task 1 by the full `test` target.
- `palette`, `rotate-cw`, `smile`, `sparkles` and `sun-moon` start their controls differently from the other 32: the guard must cover their real entry points. Pinned in Task 2 by the table spec's per-icon cases, which run for all 37.

---

### Task 1: Move the icons into the registry's own folder and publish them

**Files:**

- Move: `registry/bases/base-ui/ui/<name>.tsx` -> `registry/bases/base-ui/icons/<name>-icon.tsx` (37 files)
- Modify: the 34 files holding the 63 imports of the old paths (listed by the script's output)
- Modify: `registry.json` (43 dependency URLs, 37 new items)
- Modify: the 13 `content/docs/components/*.mdx` pages whose manual install line names a lucide-animated URL
- Modify: `registry/registry.spec.ts`
- Modify: `src/lib/source.spec.ts:728,751` (fixture URL)
- Create: `tools/move-animated-icons.py`

**Interfaces:**

- Produces: the module path `@/registry/bases/base-ui/icons/<name>-icon` exporting `<Name>Icon` and `<Name>IconHandle`; the item `<name>-icon` in `registry.json`; in `registry.spec.ts`, `HOUSE_ICON = /^registry\/bases\/base-ui\/icons\/([^/]+)\.tsx$/`.

- [ ] **Step 1: Install and confirm the baseline is green**

Run from the worktree root:

```bash
pnpm install --frozen-lockfile
cd apps/registry-ui && pnpm exec vitest run registry/registry.spec.ts src/lib/source.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Write the failing registry cases**

In `registry/registry.spec.ts`, replace the two constants and the pattern:

```ts
const ITEM_URL = 'https://ui.zeroxsolutions.com/r/';
/** A file under icons/ is an animated icon this registry owns, published as the item of its file name. */
const HOUSE_ICON = /^registry\/bases\/base-ui\/icons\/([^/]+)\.tsx$/;
```

(delete `ANIMATED_ICON_URL` and `ANIMATED_ICON`). Replace `upstreamOf` with:

```ts
/** The upstream item a vendored file is, or undefined for a file this registry owns. */
function upstreamOf(source: string): string | undefined {
  const part = /^registry\/bases\/base-ui\/ui\/([^/]+)\.tsx?$/.exec(source);
  if (part) return `@shadcn/${part[1]}`;
  if (source === `${BASE}/lib/utils.ts`) return '@shadcn/utils';
  if (source === `${BASE}/hooks/use-mobile.ts`) return '@shadcn/use-mobile';
  return undefined;
}
```

In `ownersOf`, also map icon files:

```ts
        .filter(
          (file) =>
            file.path.startsWith(`${BASE}/components/`) ||
            file.path.startsWith(`${BASE}/blocks/`) ||
            HOUSE_ICON.test(file.path),
        )
```

Rewrite the two fixtures that named lucide-animated: in `treeItem` (line 321) use `${ITEM_URL}chevron-right-icon.json`; in the copy-button case (lines 400-411) use `${ITEM_URL}copy-icon.json` and expect `copy-button: registryDependencies lacks ${ITEM_URL}check-icon.json`; rename the two `it(...)` titles at lines 372 and 400 to `names an animated icon by its house item URL` and `names an animated icon by its house item URL, not as a shadcn item`, and the expected string at line 375 to `tree-item: registryDependencies lacks https://ui.zeroxsolutions.com/r/chevron-right-icon.json`.

Add to `describe('registry.json', ...)`:

```ts
it('names no lucide-animated item', () => {
  const named = REGISTRY.items.filter((item) =>
    (item.registryDependencies ?? []).some((dependency) => dependency.includes('lucide-animated.com')),
  );
  expect(named.map((item) => item.name)).toEqual([]);
});

it('publishes each icon under icons/ as the item of its name, landing in the consumer components/general/', () => {
  const icons = readdirSync(join(APP, BASE, 'icons'))
    .filter((file) => file.endsWith('.tsx') && !file.endsWith('.spec.tsx'))
    .map((file) => file.slice(0, -'.tsx'.length))
    .sort();
  expect(icons).toHaveLength(37);
  const problems = icons.flatMap((name) => {
    const item = REGISTRY.items.find((candidate) => candidate.name === name);
    if (item === undefined) return [`${name}: no item`];
    const expected = [
      { path: `${BASE}/icons/${name}.tsx`, type: 'registry:ui', target: `components/general/${name}.tsx` },
    ];
    return [
      ...(item.type === 'registry:ui' ? [] : [`${name}: type ${item.type}`]),
      ...(isDeepStrictEqual(item.files, expected) ? [] : [`${name}: files ${JSON.stringify(item.files)}`]),
    ];
  });
  expect(problems).toEqual([]);
});
```

In `src/lib/source.spec.ts`, change `https://lucide-animated.com/r/circle.json` to `https://ui.zeroxsolutions.com/r/circle-icon.json` at both lines (728 and 751).

- [ ] **Step 3: Run the cases to see them fail**

Run: `pnpm exec vitest run registry/registry.spec.ts`
Expected: FAIL. `names no lucide-animated item` lists 30 or more items; `publishes each icon...` throws ENOENT on `icons`; the declaration case reports `lacks @shadcn/<icon>` for every item that imports an icon.

- [ ] **Step 4: Write the move script**

Create `tools/move-animated-icons.py`:

```python
"""Moves the 37 animated icons into icons/<name>-icon.tsx and repoints every reference, once.

Run from apps/registry-ui. Each rewrite asserts its count before it writes, so a surprise stops the
run at the file that surprised it.
"""
import json
import pathlib
import re
import subprocess

UI = pathlib.Path('registry/bases/base-ui/ui')
ICONS = pathlib.Path('registry/bases/base-ui/icons')
HANDLE = re.compile(r'^export interface \w+IconHandle\b', re.M)

names = sorted(p.stem for p in UI.glob('*.tsx') if HANDLE.search(p.read_text()))
assert len(names) == 37, names

ICONS.mkdir(exist_ok=True)
for name in names:
    subprocess.run(['git', 'mv', str(UI / f'{name}.tsx'), str(ICONS / f'{name}-icon.tsx')], check=True)

alternation = '|'.join(re.escape(n) for n in names)

# Imports: '@/registry/bases/base-ui/ui/<name>' in either quote, in registry/ and src/.
imports = re.compile(r"(['\"])@/registry/bases/base-ui/ui/(" + alternation + r")\1")
sources = [p for root in ('registry', 'src') for p in pathlib.Path(root).rglob('*.ts*') if p.is_file()]
expected_sites = sum(len(imports.findall(p.read_text())) for p in sources)
assert expected_sites == 63, expected_sites
written = 0
for path in sources:
    text = path.read_text()
    new, count = imports.subn(lambda m: f"{m[1]}@/registry/bases/base-ui/icons/{m[2]}-icon{m[1]}", text)
    if count:
        path.write_text(new)
        written += count
assert written == 63, written

# registry.json: dependency URLs, then one item per icon.
registry_path = pathlib.Path('registry.json')
registry = json.loads(registry_path.read_text())
url = re.compile(r'^https://lucide-animated\.com/r/(' + alternation + r')\.json$')
edges = 0
for item in registry['items']:
    deps = item.get('registryDependencies', [])
    for i, dep in enumerate(deps):
        m = url.match(dep)
        if m:
            deps[i] = f'https://ui.zeroxsolutions.com/r/{m[1]}-icon.json'
            edges += 1
    if 'registryDependencies' in item:
        item['registryDependencies'] = sorted(deps)
assert edges == 43, edges
for name in names:
    title = ' '.join(part.capitalize() for part in name.split('-')) + ' Icon'
    registry['items'].append({
        'name': f'{name}-icon',
        'type': 'registry:ui',
        'title': title,
        'description': f'An animated {name} icon, adapted from lucide-animated, that renders phrasing content and stays still under reduced motion.',
        'dependencies': ['motion'],
        'registryDependencies': ['@shadcn/utils'],
        'files': [{
            'path': f'registry/bases/base-ui/icons/{name}-icon.tsx',
            'type': 'registry:ui',
            'target': f'components/general/{name}-icon.tsx',
        }],
    })
registry_path.write_text(json.dumps(registry, indent=2) + '\n')

# Docs: the manual install line of each page that names a lucide-animated URL.
docs_url = re.compile(r'https://lucide-animated\.com/r/(' + alternation + r')\.json')
pages = [p for p in pathlib.Path('content/docs/components').glob('*.mdx') if docs_url.search(p.read_text())]
assert len(pages) == 13, [p.name for p in pages]
for page in pages:
    page.write_text(docs_url.sub(lambda m: f'https://ui.zeroxsolutions.com/r/{m[1]}-icon.json', page.read_text()))

print(f'moved {len(names)} icons, {written} imports, {edges} edges, {len(pages)} pages')
```

- [ ] **Step 5: Run it and read the diff**

```bash
python3 tools/move-animated-icons.py
pnpm exec prettier --write registry.json
git diff --stat
```

Expected output line: `moved 37 icons, 63 imports, 43 edges, 13 pages`. The diff stat shows 37 renames, 34 importers, `registry.json` and 13 pages. Read `git diff registry.json | head -80` and one page diff: each install line now names `https://ui.zeroxsolutions.com/r/<name>-icon.json`. If an install line's URL order differs from what `manualProblems` expects (it compares to `registryDependencies` as listed), the docs case in Step 6 says so; reorder that line to match.

- [ ] **Step 6: Run the registry and docs specs**

Run: `pnpm exec vitest run registry/registry.spec.ts src/lib/source.spec.ts`
Expected: PASS. If `declares exactly the files...` reports `lacks @shadcn/utils` or `lacks motion` for an icon item, its imports differ from the template: add what it names to that item's lists.

- [ ] **Step 7: Run the app's whole test target and typecheck**

```bash
cd ../.. && pnpm nx run @zeroxsolutions/registry-ui:test
cd apps/registry-ui && pnpm exec tsc -p tsconfig.json --noEmit
```

Expected: PASS, no type errors (the `test` target runs `fumadocs-generate` first, which `tsc` needs).

- [ ] **Step 8: Commit**

```bash
git add -A apps/registry-ui
git commit -m "refactor(registry-ui)!: publish the animated icons as items this registry owns

Why: an icon this registry changes must land where no lucide-animated add
can overwrite it; the move comes first so the fix is its own diff.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Render a span and stay still under reduced motion

**Files:**

- Create: `registry/bases/base-ui/icons/animated-icons.spec.tsx`
- Create: `tools/fix-animated-icons.py`
- Modify: the 37 files in `registry/bases/base-ui/icons/`

**Interfaces:**

- Consumes: Task 1's module paths `@/registry/bases/base-ui/icons/<name>-icon`.
- Produces: each icon's wrapper `span[data-slot="<name>-icon"]`.

- [ ] **Step 1: Write the failing table spec**

Create `registry/bases/base-ui/icons/animated-icons.spec.tsx`:

```tsx
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, createRef, forwardRef, type ComponentType, type ReactNode, type Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Motion's hooks are replaced by recording stand-ins: jsdom runs no animation frame, so a case asserts
 * which controls an icon started, not a value it never animates. `motion.<tag>` renders the bare tag
 * with Motion's own props removed.
 */
const motionState = vi.hoisted(() => ({ reduced: false, starts: [] as unknown[][] }));

vi.mock('motion/react', () => {
  const MOTION_PROPS = new Set([
    'animate',
    'initial',
    'variants',
    'transition',
    'custom',
    'exit',
    'whileHover',
    'whileTap',
  ]);
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        forwardRef<Element, Record<string, unknown>>(function MotionStandIn(props, ref) {
          const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));
          return createElement(tag, { ...rest, ref });
        }),
    },
  );
  return {
    motion,
    useAnimation: () => ({
      start: (...args: unknown[]) => {
        motionState.starts.push(args);
        return Promise.resolve();
      },
      stop: () => undefined,
      set: () => undefined,
      mount: () => () => undefined,
    }),
    useReducedMotion: () => motionState.reduced,
  };
});

interface Handle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type AnimatedIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean; ref?: Ref<Handle> }>;

const ICONS = import.meta.glob<Record<string, AnimatedIcon>>('./*-icon.tsx', { eager: true });

const cases = Object.entries(ICONS).map(([path, module]) => {
  const name = path.slice('./'.length, -'.tsx'.length);
  const exported = Object.entries(module).find(([key]) => key.endsWith('Icon'));
  if (exported === undefined) throw new Error(`${path} exports no <Name>Icon`);
  return { name, Icon: exported[1] };
});

function inButton(node: ReactNode) {
  return render(<button type="button">{node}</button>);
}

/** The starts that play something, leaving out the resets an icon makes on leave. */
function playStarts(): unknown[][] {
  return motionState.starts.filter(([variant]) => !['normal', 'initial'].includes(String(variant)));
}

beforeEach(() => {
  motionState.reduced = false;
  motionState.starts = [];
});

afterEach(cleanup);

describe('animated icons', () => {
  it('covers all 37 icons', () => {
    expect(cases).toHaveLength(37);
  });

  describe.each(cases)('$name', ({ name, Icon }) => {
    it('renders a span wrapper carrying its slot, the caller className and aria-hidden', () => {
      const { container } = inButton(<Icon className="size-4" aria-hidden />);
      const wrapper = container.querySelector(`[data-slot="${name}"]`);
      expect(wrapper?.tagName).toBe('SPAN');
      expect(wrapper?.className).toContain('inline-flex');
      expect(wrapper?.className).toContain('size-4');
      expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    });

    it('plays on hover when motion is not reduced', () => {
      const { container } = inButton(<Icon />);
      fireEvent.mouseEnter(container.querySelector(`[data-slot="${name}"]`)!);
      expect(playStarts().length).toBeGreaterThan(0);
    });

    it('starts nothing on hover under reduced motion', () => {
      motionState.reduced = true;
      const { container } = inButton(<Icon />);
      fireEvent.mouseEnter(container.querySelector(`[data-slot="${name}"]`)!);
      expect(playStarts()).toEqual([]);
    });

    it('plays from its handle when motion is not reduced', () => {
      const ref = createRef<Handle>();
      inButton(<Icon ref={ref} />);
      ref.current?.startAnimation();
      expect(playStarts().length).toBeGreaterThan(0);
    });

    it('starts nothing from its handle under reduced motion', () => {
      motionState.reduced = true;
      const ref = createRef<Handle>();
      inButton(<Icon ref={ref} />);
      ref.current?.startAnimation();
      expect(playStarts()).toEqual([]);
    });
  });
});
```

The slot is the file name (`check-icon`), so `data-slot="<name>-icon"` in the constraints and `data-slot="${name}"` here are the same string.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run registry/bases/base-ui/icons/animated-icons.spec.tsx`
Expected: FAIL. Every `renders a span wrapper` case fails with `expected 'DIV' to be 'SPAN'` (or `undefined`, as no slot exists yet), and every `under reduced motion` case lists the starts it made. The `plays ...` cases pass already.

- [ ] **Step 3: Write the fix script**

The icons share one shape but not one indentation, and five start their controls their own way, so the
script matches with patterns that ignore indentation and leaves those five starts to Step 4. A dry run
of these patterns on the 37 found every common edit exactly once in each file; the five listed in
`HOVER_BY_HAND` and `HANDLE_BY_HAND` are the files where the hover or handle pattern found nothing.

Create `tools/fix-animated-icons.py`:

```python
"""Gives each animated icon a span wrapper, a reduced-motion guard and its licence header, once.

Run from apps/registry-ui after the move. Every substitution asserts its count in its file first.
"""
import pathlib
import re

ICONS = pathlib.Path('registry/bases/base-ui/icons')
HEADER = '// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.\n'
HOVER_BY_HAND = {'palette-icon', 'rotate-cw-icon', 'smile-icon', 'sparkles-icon', 'sun-moon-icon'}
HANDLE_BY_HAND = {'palette-icon', 'sparkles-icon', 'sun-moon-icon'}


def sub(pattern: str, repl: str, text: str, count: int, where: str) -> str:
    new, found = re.subn(pattern, repl, text)
    assert found == count, f'{where}: {pattern!r} matched {found}, expected {count}'
    return new


files = sorted(ICONS.glob('*-icon.tsx'))
assert len(files) == 37, len(files)
for path in files:
    name, w, t = path.stem, path.name, path.read_text()
    t = sub(r'^"use client";\n', '"use client";\n\n' + HEADER, t, 1, w)
    t = sub(r'HTMLAttributes<HTMLDivElement>', 'HTMLAttributes<HTMLSpanElement>', t, 1, w)
    t = sub(r'React\.MouseEvent<HTMLDivElement>', 'React.MouseEvent<HTMLSpanElement>', t, 2, w)
    t = sub(r'(\n(\s*))<div\n(\s*)className=\{cn\(', rf'\1<span\n\3data-slot="{name}"\n\3className={{cn(', t, 1, w)
    t = sub(r'className=\{cn\(className\)\}', 'className={cn("inline-flex", className)}', t, 0 if name == 'palette-icon' else 1, w)
    t = sub(r'(\n\s*)</div>\n', r'\1</span>\n', t, 1, w)
    t = sub(r'import \{ motion, useAnimation \} from "motion/react";',
            'import { motion, useAnimation, useReducedMotion } from "motion/react";', t, 1, w)
    t = sub(r'(\n(\s*)const \w+ = useAnimation\(\);\n)', r'\1\2const isMotionReduced = useReducedMotion();\n', t, 1, w) if t.count('useAnimation();') == 1 else \
        sub(r'(\n(\s*)const \w+ = useAnimation\(\);\n)(?![\s\S]*useAnimation\(\);)', r'\1\2const isMotionReduced = useReducedMotion();\n', t, 1, w)
    if name not in HOVER_BY_HAND:
        t = sub(r'\} else \{(\n\s*)controls\.start\("animate"\);', r'} else if (!isMotionReduced) {\1controls.start("animate");', t, 1, w)
        t = sub(r'\[controls, onMouseEnter\]', '[controls, isMotionReduced, onMouseEnter]', t, 1, w)
    if name not in HANDLE_BY_HAND:
        t = sub(r'(\n(\s*))startAnimation: \(\) => controls\.start\("animate"\),',
                r'\1startAnimation: () => {\1  if (!isMotionReduced) controls.start("animate");\1},', t, 1, w)
    path.write_text(t)
print(f'fixed {len(files)} icons; hover by hand: {sorted(HOVER_BY_HAND)}; handle by hand: {sorted(HANDLE_BY_HAND)}')
```

`palette-icon` keeps its own `cn("inline-flex items-center justify-center", className)`, which already
draws an inline box, so its class substitution expects 0 matches. In `sparkles-icon` and `sun-moon-icon`
the guard line goes after the last of their two `useAnimation()` calls.

If an assertion stops the script, the icon it names differs from the dry run's shape in that one spot:
read it, add it to the by-hand set the failing substitution belongs to, restore the tree with
`git checkout -- registry/bases/base-ui/icons`, and run again.

- [ ] **Step 4: Run it and finish the five by hand**

```bash
python3 tools/fix-animated-icons.py
pnpm exec prettier --write registry/bases/base-ui/icons
```

Expected: `fixed 37 icons; hover by hand: ['palette-icon', 'rotate-cw-icon', 'smile-icon', 'sparkles-icon', 'sun-moon-icon']; handle by hand: ['palette-icon', 'sparkles-icon', 'sun-moon-icon']`.

Then guard each start the script left. `isMotionReduced` is already declared in every file.

- `rotate-cw-icon.tsx`, hover:

```tsx
        if (isControlledRef.current) onMouseEnter?.(e);
        else if (!isMotionReduced) controls.start("animate");
      },
      [controls, isMotionReduced, onMouseEnter]
```

- `smile-icon.tsx`, hover:

```tsx
        if (!isControlledRef.current && !isMotionReduced) controls.start("animate");
        onMouseEnter?.(e);
      },
      [controls, isMotionReduced, onMouseEnter]
```

- `sparkles-icon.tsx`, handle and hover:

```tsx
        startAnimation: () => {
          if (isMotionReduced) return;
          sparkleControls.start("hover");
          starControls.start("blink", { delay: 1 });
        },
```

```tsx
        } else if (!isMotionReduced) {
          sparkleControls.start("hover");
          starControls.start("blink", { delay: 1 });
        }
      },
      [isMotionReduced, onMouseEnter, sparkleControls, starControls]
```

- `sun-moon-icon.tsx`, handle and hover:

```tsx
        startAnimation: () => {
          if (isMotionReduced) return;
          sunControls.start("animate");
          moonControls.start("animate");
        },
```

```tsx
        } else if (!isMotionReduced) {
          sunControls.start("animate");
          moonControls.start("animate");
        }
      },
      [sunControls, moonControls, isMotionReduced, onMouseEnter]
```

- `palette-icon.tsx`: its handle and its hover both go through the local `startAnimation`, so guard
  that one function:

```tsx
const startAnimation = useCallback(async () => {
  if (isMotionReduced || isAnimatingRef.current) return;
  isAnimatingRef.current = true;
  try {
    await controls.start('animate');
  } finally {
    isAnimatingRef.current = false;
  }
}, [controls, isMotionReduced]);
```

Confirm nothing was missed:

```bash
grep -c "isMotionReduced" registry/bases/base-ui/icons/*-icon.tsx | grep -E ":(0|1|2)$"
```

Expected: no output; every icon names the guard at least three times (declaration, hover, handle).
`palette-icon` names it three times through its one function (declaration, check, dependency).

- [ ] **Step 5: Run the table spec**

Run: `pnpm exec vitest run registry/bases/base-ui/icons/animated-icons.spec.tsx`
Expected: PASS, 37 x 5 cases plus the count case.

- [ ] **Step 6: Lint, typecheck, and the app's tests**

```bash
pnpm exec eslint registry/bases/base-ui/icons tools
pnpm exec tsc -p tsconfig.json --noEmit
cd ../.. && pnpm nx run @zeroxsolutions/registry-ui:test
```

Expected: no lint errors, no type errors, all specs PASS, including the components' own specs that render icons (`password-input`, `copy-button`, `tool-call-card`).

- [ ] **Step 7: Read the diff of one icon against upstream's shape**

Run: `git diff HEAD -- registry/bases/base-ui/icons/check-icon.tsx`
Expected: only the header, the import, the guard line, the two guarded starts, the two event types, the wrapper tag, its class and its slot. Anything else is a mistake in the script.

- [ ] **Step 8: Commit**

```bash
git add -A apps/registry-ui
git commit -m "fix(registry-ui): render each animated icon in a span and keep it still under reduced motion

Why: a div inside a button is invalid markup, and Motion's root setting
does not stop a path that draws itself in.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Build the registry and read what consumers will receive

**Files:**

- Read only: `public/r/` (build output, never committed by hand)

**Interfaces:**

- Consumes: Tasks 1 and 2.

- [ ] **Step 1: Build and validate**

Run: `cd ../.. && pnpm nx run @zeroxsolutions/registry-ui:shadcn-build`
Expected: the target ends with `shadcn registry validate registry.json` passing.

- [ ] **Step 2: Read the built items**

```bash
cd apps/registry-ui
ls public/r/*-icon.json | wc -l
python3 - <<'EOF'
import json, glob
for path in sorted(glob.glob('public/r/*-icon.json')):
    item = json.load(open(path))
    f = item['files'][0]
    assert f['target'] == f"components/general/{item['name']}.tsx", path
    assert '<span' in f['content'] and '<div' not in f['content'], path
    assert 'useReducedMotion' in f['content'], path
print('ok')
EOF
grep -c "lucide-animated.com" public/r/password-input.json
```

Expected: `37`, `ok`, `0`.

- [ ] **Step 3: Commit if the build changed a tracked file**

Run: `git status --short`
Expected: clean, since `public/r` is build output. If a tracked file changed, read why before committing anything.
