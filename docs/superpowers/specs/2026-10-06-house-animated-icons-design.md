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
2. **It never reads the reader's reduced-motion setting.** `MotionConfig reducedMotion="user"` stops
   transform and layout values only (motion-dom 12.42.2, the version this app resolves, and 14.0.0
   alike: `render/utils/keys-position.mjs`), so an icon whose path draws itself in (`check`, `circle-check`,
   `file-text` and others animate `pathLength`) still plays for a reader who asked for reduced motion,
   against WCAG 2.2 SC 2.3.3.

Upstream (`pqoqubbw/icons`) has no issue or pull request for either. The owner decided on 2026-10-06
to take the icons into this registry and fix them here. That overrides the rule in gundam's
`writing-a-component/publishing-a-registry-item.md` that an upstream item is never republished as a
copy; the skill change that records the exception ships separately in agent-plugins.

## What changes

### The icons move to a place the registry owns, in the registry and in every consumer

Once this registry changes an icon, the icon is this registry's, and nothing upstream may overwrite it:
not here, and not in an app that installed it. So the icon's name, its file and the place it lands all
differ from lucide-animated's:

| | lucide-animated | This registry |
| --- | --- | --- |
| item name | `<name>` | `<name>-icon` |
| file in this repository | `registry/bases/base-ui/ui/<name>.tsx` | `registry/bases/base-ui/icons/<name>-icon.tsx` |
| file in a consumer | `components/ui/<name>.tsx` | `components/general/<name>-icon.tsx`, set by the file's `target` |
| export | `<Name>Icon`, `<Name>IconHandle` | unchanged |

An app that later runs `shadcn add` for a lucide-animated item writes `components/ui/<name>.tsx`, which
is not this file, so the fixed icon survives it. `components/general/` is the kind folder
`writing-a-component` gives an atom that is read or clicked. shadcn 4.21.0 places a file at its
`target` for both `registry:ui` and `registry:component` (tried in a scratch app on 2026-10-06).

`ui/` keeps only what shadcn vendors, so its rule (spec c6, rule 1: nothing under `ui/` is edited)
stays true. Every import of `@/registry/bases/base-ui/ui/<icon>` in `registry/` and `src/` becomes
`@/registry/bases/base-ui/icons/<icon>-icon`; the move is a script with an asserted count per file,
run once.

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
  "name": "<name>-icon", "type": "registry:ui",
  "title": "<Name> Icon", "description": "An animated <name> icon, adapted from lucide-animated, that renders phrasing content and stays still under reduced motion.",
  "dependencies": ["motion"],
  "registryDependencies": ["@shadcn/utils"],
  "files": [{
    "path": "registry/bases/base-ui/icons/<name>-icon.tsx", "type": "registry:ui",
    "target": "components/general/<name>-icon.tsx"
  }]
}
```

The type stays `registry:ui`, so the icon is not a family: it needs no demo and no docs page of its
own, and `familyProblems` and `demoProblems`, which read `registry:component` and `registry:block`
items only, leave it alone.

Every item that depended on `https://lucide-animated.com/r/<name>.json` depends on
`https://ui.zeroxsolutions.com/r/<name>-icon.json` instead. A consumer moving to the house icon
changes its import from `@/components/ui/<name>` to `@/components/general/<name>-icon`.

### `registry.spec.ts` derives the new dependency

`upstreamOf` stops naming lucide-animated: a file under `${BASE}/icons/` is owned by the item of its
name, so the expected declaration names `${ITEM_URL}<name>-icon.json` for it. A case asserts each
icon item's file carries `target: components/general/<name>-icon.tsx`. `ANIMATED_ICON_URL` and the
`ANIMATED_ICON` pattern go, and the two fixtures that name lucide-animated URLs name the house URL.
A case asserts that no item in `registry.json` names `lucide-animated.com`.

## Tests

- One table-driven spec, `icons/animated-icons.spec.tsx`, with a case per icon: rendered inside a
  `button`, the icon's wrapper is a `SPAN` carrying `data-slot="<name>-icon"` and the caller's
  `className` and `aria-hidden`; with Motion's reduced-motion hook reading true, neither hovering the
  wrapper nor calling the handle's `startAnimation` starts any of the icon's animation controls, and
  with it reading false, both do. Motion's animation hooks are replaced in that spec by recording
  stand-ins, so the case asserts which controls were started rather than reading a value jsdom never
  animates.
- `registry.spec.ts` as above.
- The build target (`shadcn build` then `shadcn registry validate`) passes, and
  `public/r/<name>-icon.json` exists for each of the 37 with its `target`.

## Out of scope

- Icons the registry does not hold yet. A consumer that needs another animated icon asks for it here,
  and it arrives through the same four rows.
- Reporting the defects upstream: publishing to a third-party repository needs the owner's go-ahead.
- Consumers (travel) moving to the house items: their own change, after this one deploys.
