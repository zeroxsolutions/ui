## Why

`@zeroxsolutions/ui`'s tier-2 composites pile `className` overrides onto design-system
primitives to **re-tune** what the primitive already ships — an invented width
(`min-w-40`), a redundant icon size (`size-4` on a `Button` child the Button already
sizes via `[&_svg]:size-4`), a duplicated token (`text-muted-foreground`,
`font-normal`), or a hand-size that fights a variant the component already declares
(`size="icon-xs"` **+** `size-5`). `LanguageSwitcher` was the flagship — its trigger
was a verbatim copy of a shadcn combobox demo's classes. This drift is invisible to
lint, silently forks the primitives' a11y/dark-mode/spacing, and contradicts the house
`ui-from-design-system` discipline. The library also ships a component that
reimplements a shipped one (`mono-chip` ≈ `Badge`) and orphaned surfaces.

The `ui/` primitives are **vendored shadcn** (`components.json`, regenerated) — editing
them resets — so the fix lives entirely in the composite layer: consume the primitives
at their defaults, and confine `className` to genuine layout the primitive can't express.

## What Changes

- **Codify the discipline** in the `ui-from-design-system` rule (+ session memory):
  "take the primitive's defaults; a `className` override must earn its place" — never
  to re-tune a primitive's built-in size/spacing/icon-size/color/font. *(done)*
- **Strip override-piling** on DS components across `packages/ui` composites: replace
  hand-sizing with the component's own `size` variant (`icon-xs`/`icon-sm`), remove
  `size-*` the parent already applies (`Button` → `size-4`; `Badge` → `[&>svg]:size-3!`),
  drop invented widths / duplicated font & color.
- **Resolve two heavy re-tunes** that fight the component into something else:
  `ai-elements/code-block` (`LanguageSwitcher` jammed into a transparent chip) and
  `tree-item` (a `Button` neutralised to a bare click-target — its own comment admits it).
- **Strip `LanguageSwitcher`'s trigger** to defaults (`className={className}` only). *(done)*
- **Delete reimplementation / orphan components**: `mono-chip` (a hand-built `Badge`),
  and `dirty-dot` / `status-dot` / `tab-close-button`. *(done)*

Layout/sizing on **raw elements** (flex `truncate`, positioning, bare-lucide and asset
sizes) is **not** override-piling and is out of scope — stripping it only breaks layout.

## Success Criteria

- Every `size-*` / width / font / colour `className` on a **design-system component**
  in `packages/ui` composites is, per-site: removed as redundant, replaced by the
  component's own variant, or justified as genuine raw-element layout.
- No `className` remains whose sole effect is re-tuning a primitive's built-in
  size/spacing/icon-size/colour/font.
- The two heavy re-tunes are resolved (a variant, or a non-`Button` element).
- Deleted components are gone with **no dangling references**; `./*` subpath exports
  drop automatically.
- The `ui-from-design-system` rule carries the override-earns-its-place discipline.
- Gate green: `@zeroxsolutions/ui` build + test, `build-storybook`; no visual
  regression on any surface that is kept.

## Non-Goals

- **No edits to `packages/ui/src/components/ui/`** — vendored shadcn primitives reset on
  regeneration; so no new variants ("promote") and no primitive re-tuning.
- **No edits to `packages/editor/**`** — owned by the concurrent `refactor-editor-chrome`
  (different session); this change is `packages/ui`-only to avoid collision.
- **Not** a general "prune every unused component" sweep — only the specific
  reimplementation/orphans named above.
- **Not** touching layout/sizing on raw elements (flex/`truncate`/positioning/asset sizes).

## Capabilities

### New Capabilities

- `ui-composition-defaults`: `@zeroxsolutions/ui`'s own composites consume design-system
  primitives at their defaults — sizing via the primitive's `size` variant, never a
  `className` that re-tunes a built-in property; `className` is confined to genuine
  layout on raw elements; no composite reimplements a shipped primitive.

### Modified Capabilities

<!-- None. The `.agents/rules/ui-from-design-system.md` amendment is a rules change tracked in Impact/tasks, not an OpenSpec spec delta. -->

## Impact

- **Code**: `packages/ui/src/components/*.tsx` and `packages/ui/src/components/ai-elements/*.tsx`
  (composite layer only). No `ui/` primitive edits; no editor edits.
- **Deletions** (already applied): `mono-chip`, `dirty-dot`, `status-dot`,
  `tab-close-button` — each its component + spec + story. These are **public exports**
  of `@zeroxsolutions/ui` (`./*` map) → a breaking surface removal per
  `lib-public-exports-and-semver` (version bump handled separately).
- **Rules**: `.agents/rules/ui-from-design-system.md` amended (override discipline);
  session memory updated.
- **Gate**: `@zeroxsolutions/ui` has no `lint` target; verification is build + test +
  `build-storybook`.
