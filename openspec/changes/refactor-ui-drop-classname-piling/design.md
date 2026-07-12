## Context

`@zeroxsolutions/ui` layers as: vendored shadcn **primitives** in
`src/components/ui/` (68 files, regenerated via `components.json` — edits reset), and
tier-2 **composites** in `src/components/*.tsx` + `ai-elements/*.tsx` (63 files) that
compose the primitives. Only the composites are in scope. The primitives already encode
the house sizing/spacing/colour; the composites drift by adding `className` that re-tunes
those, or by reimplementing a shipped primitive.

**Ground-truth sizing facts (read from source, not memory):**

- `Button` (`ui/button.tsx`): base applies `[&_svg:not([class*='size-'])]:size-4`.
  Size variants — `default` h-9 (svg→4), `sm` h-8, `xs` h-6 (svg→3), `icon` size-9,
  `icon-xs` size-6 (svg→3), `icon-sm` size-8, `icon-lg` size-10. The `:not([class*='size-'])`
  selector means **adding a `size-*` opts the icon out of the Button's sizing.**
- `Badge` (`ui/badge.tsx`): forces `[&>svg]:size-3!` (important) — a child icon is
  always 12px regardless.
- `lucide-react` icons default to **24px** (= `size-6`); house `@zeroxsolutions/icons`
  default to **1em**. `FileTypeIcon` is `return <Icon {...props}/>` → 1em default.

## Goals / Non-Goals

**Goals:**

- Every `className` on a design-system component that only re-tunes a built-in property
  is removed or replaced by the primitive's own `size` variant.
- The two heavy re-tunes (`code-block`, `tree-item`) are resolved with a real API, not a
  class pile.
- Kept surfaces have zero visual regression.

**Non-Goals:**

- No edits to `src/components/ui/` (vendored). No "promote to a new primitive variant".
- No `packages/editor` edits (concurrent `refactor-editor-chrome`, other session).
- No stripping of raw-element layout (flex/`truncate`/positioning/asset & bare-lucide sizes).

## Decisions

**1. One per-site test, two outcomes.** For each `className` token the audit asks a
single question — *is this on a design-system component, or a raw element?*

```
className token on a composite
  ├─ on a DS COMPONENT (Button, Badge, CopyButton, LanguageSwitcher, …)
  │    ├─ duplicates what the primitive already applies  → REMOVE (redundant)
  │    ├─ a non-default size a variant already gives      → USE VARIANT (size="icon-xs"/…)
  │    └─ re-tunes look/shape/width beyond a variant       → HEAVY RE-TUNE (rethink)
  └─ on a RAW element (<span>, <img>, bare lucide, FileTypeIcon, FluentEmoji)
       → KEEP — it is the element's only size/layout spec, not a primitive override
```

**2. Verified inventory (from reading each site).**

| Verdict | Sites |
| --- | --- |
| REMOVE redundant | `tag-input:62` `<X size-3>` (icon-xs → svg-3); `tool:61/64/68/70` status icons `size-3` (Badge `size-3!`) |
| USE VARIANT | `tag-input:59` (icon-xs **+** `size-4` → drop `size-4`); `tree-row:80/83` (icon-xs **+** `size-5`/`size-3.5` → drop both); `conversation:127` (`size="icon"`+`size-8` → `icon-sm`); `code-block:267` (`CopyButton size-6` → `icon-xs`); `avatar-editor:181` (`size-7` → `icon-sm`) |
| HEAVY RE-TUNE | `ai-elements/code-block:259` (LanguageSwitcher → transparent chip); `tree-item:92` (Button neutralised to a click-target) |
| KEEP (raw element) | `reasoning:140`,`tool:115`,`tree-item:112` (`min-w-0 flex-1 truncate`); `binary-file-card:32` (`FileTypeIcon size-12`); `emoji-appearance:74` (`FluentEmoji size-8`); `avatar-editor:271/273` (bare lucide) |
| CONFIRM AT APPLY (read the trigger: Button child → REMOVE; bare → KEEP) | `sidebar-group:60`, `sidebar-menu:73`, `reasoning:139/144`, `tool:112/125`, `icon-label:31`, `file-tree:378`, `split-button:108/119` |

**3. Heavy re-tune resolutions.**

- `tree-item:92` — **Resolved: replace the `<Button>` with a `<div>`**, per the **W3C
  WAI-ARIA tree-view pattern** (verified against the W3C APG, not the repo, which has its own
  bugs). The standard: a tree node is a `div`/`li` with `role="treeitem"`, keyboard is a
  tree-level **roving tabindex** (Enter activates), and the **whole treeitem is the click
  target — not a per-item `<button>`**. So the name-region `<Button>` was an anti-pattern
  causing three faults at once: (a) the ghost variant fought by `hover:bg-transparent` (no
  transparent-no-hover variant exists), (b) a `<button>` invalidly wrapping the rename
  `<input>`, (c) a per-item tab-stop conflicting with any tree roving-tabindex. The div fix
  deletes the className pile at its root and fixes (b)+(c). `tree-row`/`tree-item` are
  unopinionated skeletons whose docstrings already say role/keyboard are caller-owned, so the
  div carries only layout; the consuming tree adds `role="treeitem"` + roving tabindex.
- `code-block:259` — a tiny transparent language control. **Resolved: accept
  `LanguageSwitcher`'s default trigger** (`Button variant="outline" size="sm"`) — remove
  the chip `className` pile entirely; **no new prop**. The header control renders as the
  default small outline dropdown.

**4. Already applied in this change.** Rule + memory amended; `LanguageSwitcher` trigger
stripped to `className={className}`; `mono-chip`/`dirty-dot`/`status-dot`/`tab-close-button`
deleted (component + spec + story), `./*` exports auto-dropped, no dangling refs.

## Risks / Trade-offs

- **Visual regression is the main risk and jsdom cannot catch it** (all
  `getBoundingClientRect` = 0). Every USE-VARIANT and KEEP-adjacent surface must be
  verified in a **real browser** — rebuild dist + `storybook-static`, drive with
  playwright, per `verify-visual-bugs-in-real-browser`.
- USE-VARIANT swaps shift a few px (a 20px toggle → 24px `icon-xs`); accepted as
  snapping to the declared variant, but confirmed visually.
- Deletions already removed **public exports** → breaking surface (`lib-public-exports-and-semver`);
  version bump handled separately.

## State Model

Not applicable — a stateless refactor of static composition.

## Migration Plan

Incremental, per file: apply verdicts → `nx build @zeroxsolutions/ui` + `nx test
@zeroxsolutions/ui` → `nx build-storybook` → browser-verify the visually-affected
stories. No feature flag; the library is pre-consumer for these surfaces in-repo.

## Open Questions

- ~~`code-block:259`: accept `LanguageSwitcher`'s default trigger, or add a `variant`/`size`
  prop?~~ **Resolved — accept the default trigger; no new prop; remove the chip pile.**
- The CONFIRM-AT-APPLY sites resolve by reading each trigger during apply; no guessing.
