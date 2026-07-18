## Why

The authored components and hooks across the workspace - everything except the
vendored shadcn primitives in `components/ui/*` and the ~787 leaf brand/material
icons - have drifted from the shadcn convention (`components.json` + the `shadcn`
skill) and from each other. Concrete drift found while scoping:

- **No `cn()` in `editor`** - components hand-join classes with
  `[...].filter(Boolean).join(' ')` (`editor-toolbar`, `slash-menu`,
  `floating-shell`), so a passed `className` can't tailwind-merge/override. `ui`
  always uses `cn()`.
- **`data-slot` not followed** - editor menus use bespoke `data-block-menu` /
  `data-bubble-menu` / `data-slash-menu`; shadcn is `data-slot="<kebab>"`.
- **Duplicated/drifting surface tokens** - the popover surface is declared in
  `FloatingShell` (`shadow-md`) and re-declared in `editor-toolbar` (`shadow-sm`).
- **Mixed icon sources** - lucide vs a raw unicode `.` glyph vs emoji.
- **Look-alikes + naming/grouping/filename inconsistency** - a `tree-row` beside
  `tree-item`; `chat/` and `layouts/` subgroups vs flat files; per-component
  ad-hoc sizing.

The result is a design system that is unpredictable to consume (import paths,
prop shapes, slots differ per component) and costly to maintain.

(The AI model picker and the related model-hover correction are a **separate
change**, `add-model-picker` - see Non-Goals.)

## What Changes

A **phased, cluster-by-cluster** alignment of every authored component + hook (all
packages; excluding shadcn primitives and leaf icons) to the shadcn convention and
to internal consistency. **This proposal is the frame** - each cluster's specifics
(exact renames, groupings, filenames, per-component decisions) are agreed in
discussion before that cluster is touched ("propose first, discuss gradually").

Alignment criteria per component:

- **Styling** - `cn()` everywhere; tokens over ad-hoc; one shared surface
  definition (no re-declared popover look); a consistent spacing/sizing scale.
- **Convention** - `data-slot="<kebab>"` (1:1 kebab of the symbol);
  compound-in-one-file with composable `<Parent><Part>` sub-parts (shadcn "parts,
  not props" - a structural region is a sub-component to compose, not a prop);
  `ui/*` (primitive) vs `components/*` (composed) split; `cva` for variants;
  `export {}` at the end.
- **Naming / grouping / filenames** - kebab role-suffixed files; PascalCase
  symbols; no look-alike components (reuse the shipped primitive - `Item`,
  `Badge` - never a `*Row`/`*Chip` twin); coherent group folders.
- **Shape** - domain-free presentational (data via props/slots/children);
  monochrome tokens (hue only via a scoped `.dark`-aware var).
- **Icons** - one source convention (lucide for UI glyphs; the icon system for
  brand marks).

Included deliverables (each handled in its cluster):

- Clean up **`editor/document`** inconsistencies (the `cn` / `data-slot` /
  surface-token / positioning / icon issues above).
- **No exemption for recently-built components** - `icon-chip`, `model-info-card`,
  `model-list*` are audited under the same criteria and refactored where they
  violate. Known finding: `ModelInfoCard` mixes a **props-driven header**
  (`media`/`name`/`vendor`/`modelId`) with composable `ModelInfoCardSection` parts
  - a splitting inconsistency vs shadcn's "parts, not props" to resolve. (The model
  **picker** + **hover** correction stay in `add-model-picker`.)
- **Re-organize Storybook** - the `*.stories.tsx` titles/navigation follow the new
  component grouping (the Storybook nav mirrors the folder groups), and each
  component's story uses a consistent structure.

## Success Criteria

- Every audited authored component uses `cn()` and `data-slot="<kebab>"`; no
  hand-joined className, no bespoke `data-*` menu attributes.
- The popover/surface look is defined once and reused; no drifting
  `shadow-sm`/`shadow-md` duplicates.
- No look-alike components remain (an icon+label+value line is the shipped `Item`,
  etc.); naming/filenames are role-consistent and kebab; groups are coherent.
- Components are domain-free and monochrome (hue only via a scoped var).
- `nx run-many -t lint build test` green; Storybook builds; no regression in
  `editor` (which consumes `ui`).
- Storybook navigation is grouped to mirror the component grouping; every
  component's story sits in its group with a consistent story structure.
- Each cluster is reviewed and agreed before merge; any public-surface (subpath
  import) rename is flagged as breaking.

## Non-Goals

- Not redesigning the **shadcn primitives** (`components/ui/*`) - they are the
  design **foundation** the composed layer is built **from** (a composed component
  composes these primitives, never hand-rolls a look-alike). A primitive is touched
  only where a composed refactor strictly needs it, staying shadcn-compatible.
- Not auditing the **~787 leaf brand/material icons** individually - only the icon
  **system** (`ai-provider-icon` + its API).
- Not rewriting **business/engine logic** (editor engine, codecs, stores) - this
  is a presentation/convention pass.
- Not touching the two in-flight changes (`add-editor-chat-composer`,
  `add-model-list`) - they are archived first.
- Not a big-bang rewrite - phased, cluster by cluster, discussed.
- **Not the AI model picker** - the new `ModelPicker` component and the model
  hover-placement correction (hover belongs to the picker's command rows, not
  `ModelListItem`) are a **separate change**, `add-model-picker`.

## Capabilities

### New Capabilities

- `component-conventions`: the workspace design-system convention contract every
  authored component + hook must satisfy - `cn()` usage, `data-slot`, the `ui/*`
  vs `components/*` split, compound-in-one-file, no look-alikes, domain-free
  presentational shape, monochrome tokens, kebab/role naming + filenames +
  grouping, and the publishable subpath surface. Governs the whole phased refactor.

### Modified Capabilities

None. (The `model-info-card` hover-placement change moves to the separate
`add-model-picker` change.)

## Impact

- **Packages**: `@zeroxsolutions/ui` (primary - ~53 composed + 4 hooks),
  `@zeroxsolutions/editor` (45 components + 5 hooks; consumes `ui` in 15+ places -
  refactors must not regress it), `@zeroxsolutions/icons` (icon system only),
  `@zeroxsolutions/fluent-emoji` (2 components + 2 hooks),
  `@zeroxsolutions/storybook` (all `*.stories.tsx` re-titled/grouped to the new
  scheme). Total audit universe: ~89 components + 13 hooks.
- **Consumers**: renaming files/exports changes the `./*` subpath import paths - a
  **breaking (major)** change per `lib-public-exports-and-semver`; batched and
  flagged per cluster.
- **In-flight**: depends on `add-editor-chat-composer` + `add-model-list` being
  archived first (the composer + model clusters overlap them).
- **Specs**: new `component-conventions`. The `model-info-card` modification and a
  new `model-picker` spec live in the separate `add-model-picker` change.
