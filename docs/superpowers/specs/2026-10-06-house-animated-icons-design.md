# Spec: the registry owns its animated icons

Date: 2026-10-06. The rules of spec (c2) (`2026-09-30-rebuild-on-nova-design.md`) hold for every file
this spec touches.

## Why

The 37 animated icons under `registry/bases/base-ui/ui/` are copies of lucide-animated's items, and 30
of them reach consumers as `https://lucide-animated.com/r/<name>.json` dependencies of 43 item edges
(`password-input`, `copy-button`, `tree-item` and others). Each one has two defects:

1. **It wraps its drawing in a `div`.** A `button`'s content model is phrasing content (HTML Living
   Standard, the `button` element) and a `div` is flow content, so every button and inline link that
   holds one of these icons is invalid markup. Browsers render it, so the defect shows only in a
   validator or an accessibility checker.
2. **It never reads the reader's reduced-motion setting.** Motion 14's `MotionConfig
   reducedMotion="user"` stops transform and layout values only (motion-dom 14.0.0,
   `render/utils/keys-position.mjs`), so an icon whose path draws itself in (`check`, `circle-check`,
   `file-text` and others animate `pathLength`) still plays for a reader who asked for reduced motion,
   against WCAG 2.2 SC 2.3.3.

Upstream (`pqoqubbw/icons`) has no issue or pull request for either. The owner decided on 2026-10-06
to take the icons into this registry and fix them here. That overrides the rule in gundam's
`writing-a-component/publishing-a-registry-item.md` that an upstream item is never republished as a
copy; the skill change that records the exception ships separately in agent-plugins.

## What changes

### The icons move to a folder the registry owns

The 37 files move from `registry/bases/base-ui/ui/<name>.tsx` to `registry/bases/base-ui/icons/<name>.tsx`.
`ui/` keeps only what shadcn vendors, so its rule (spec c6, rule 1: nothing under `ui/` is edited)
stays true. Every import of `@/registry/bases/base-ui/ui/<icon>` in `registry/` and `src/` moves with
them; the move is a script with an asserted count per file, run once.

### Each icon is fixed the same way

| Part | Before | After |
| --- | --- | --- |
| wrapper | `<div>` typed `HTMLAttributes<HTMLDivElement>` | `<span data-slot="<name>-icon">` typed `HTMLAttributes<HTMLSpanElement>`, `inline-flex` so the box is the one the `div` drew |
| hover start | `controls.start("animate")` | returns first when `useReducedMotion()` (Motion) reads true |
| handle `startAnimation` | `controls.start("animate")` | the same check |
| header | none | one comment naming the source and its licence: `Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.` |

Nothing else in an icon changes: its drawing, variants, transitions, default size and handle keep
upstream's values, so a later diff against upstream shows only these four rows.

### Each icon is a published item

`registry.json` gains one item per icon:

```jsonc
{
  "name": "<name>", "type": "registry:ui",
  "title": "<Name> Icon", "description": "An animated <name> icon, adapted from lucide-animated, that renders phrasing content and stays still under reduced motion.",
  "dependencies": ["motion"],
  "registryDependencies": ["@shadcn/utils"],
  "files": [{ "path": "registry/bases/base-ui/icons/<name>.tsx", "type": "registry:ui" }]
}
```

The file type `registry:ui` lands it at the consumer's `components/ui/<name>.tsx`, the path the
lucide-animated item used, so a consumer's imports do not change when it adds the house item over the
upstream one.

Every item that depended on `https://lucide-animated.com/r/<name>.json` depends on
`https://ui.zeroxsolutions.com/r/<name>.json` instead.

### `registry.spec.ts` derives the new dependency

`upstreamOf` stops naming lucide-animated: a file under `${BASE}/icons/` is owned by the item of its
name, so the expected declaration names `${ITEM_URL}<name>.json` for it. `ANIMATED_ICON_URL` and the
`ANIMATED_ICON` pattern go, and the two fixtures that name lucide-animated URLs name the house URL.
A case asserts that no item in `registry.json` names `lucide-animated.com`.

## Tests

- One spec per icon, `icons/<name>.spec.tsx`, generated with the move: the icon rendered inside a
  `button` has a `SPAN` wrapper carrying `data-slot="<name>-icon"`; with `matchMedia` answering
  `(prefers-reduced-motion: reduce)`, neither hovering the wrapper nor calling `startAnimation` changes
  any animated attribute of the drawing.
- `registry.spec.ts` as above.
- The build target (`shadcn build` then `shadcn registry validate`) passes, and `public/r/<name>.json`
  exists for each of the 37.

## Out of scope

- Icons the registry does not hold yet. A consumer that needs another animated icon asks for it here,
  and it arrives through the same four rows.
- Reporting the defects upstream: publishing to a third-party repository needs the owner's go-ahead.
- Consumers (travel) moving to the house items: their own change, after this one deploys.
