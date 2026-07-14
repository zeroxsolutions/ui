## Context

`packages/icons/src/brands/` holds ~130 vendored marks authored in two established
shapes:

- **Monochrome single-path** (the `bitbucket` shape, from Simple Icons CC0): a
  `Base` that paints `fill="currentColor"`, with `.Mono` = `Base`, `.Color` = the
  same path under a fixed brand fill, and `.Avatar` via `makeAvatar(Base, { … })`.
- **lobehub full-variant** (the `anthropic` shape): adds `.Text` / `.Combine`
  wordmark variants where the brand ships a wordmark.

Two shared helpers already exist and are reused as-is:

- `makeAvatar(Icon, { background, color?, iconMultiple? })` — wraps a
  **`currentColor`** icon centered on a filled tile. It only works for a mark that
  has a monochrome silhouette to paint.
- `useFillId` / `useFillIds(namespace, length)` — per-instance unique gradient/clip
  ids (backed by `useId`) so multiple gradient marks on one page never collide.

The public surface is a `./*` → `dist/*` subpath map (no root barrel), so a new
`src/brands/<name>.tsx` becomes `@zeroxsolutions/icons/brands/<name>` with **zero**
config change. The brand smoke test is glob-driven. This change is therefore a pure
content addition: 48 new mark files, plus README + Storybook catalog updates.

## Goals / Non-Goals

**Goals:**

- Add 48 marks across four clusters (social/consumer, workspace/collaboration,
  mail/office, AI-Gateway-gap), each importable at `brands/<name>`.
- Give every mark exactly the variant surface its source artwork supports —
  reusing the existing two authoring shapes and the existing helpers, adding **no**
  new composition module.
- Make `brands/` cover all 24 native Cloudflare AI Gateway providers.

**Non-Goals:**

- No new import-subpath namespace — one flat `brands/`.
- No new avatar/wordmark helper; no `.Text`/`.Combine` for these marks.
- No provider→mark registry or dynamic lookup component.

## Decisions

### D1 — One flat `brands/` category (no `social/` or `workspace/` subpath)

The `icon-library` spec defines a category as an import subpath, and permits
adding categories — but a category split forces a "is Slack social or workspace?"
classification on every ambiguous mark and complicates the consumer import story.
A single flat `brands/` keeps `brands/slack` alongside `brands/openai`, matches the
existing ~130-mark layout, and requires only broadening one spec requirement's
wording. Chosen over separate categories.

### D2 — Mark taxonomy drives the variant surface

Each mark is one of two types, decided by its **source artwork**, not its domain:

| Type | Source artwork | Base | Variants shipped | Helper |
| --- | --- | --- | --- | --- |
| **M** — monochrome single-path | one path, one color (Simple Icons; single-fill gilbarbara like `linkedin`) | mono, `currentColor` | `.Color` (brand fill) · `.Mono` · `.Avatar` | `makeAvatar` |
| **C** — full-color / gradient | multi-path, gradients (`microsoft-teams`, `outlook`, `onedrive`) | the full-color artwork | `.Color` (same artwork) · **no** `.Mono` | `useFillIds` for ids |

Type **C** marks ship **no `.Avatar`**: `makeAvatar` paints a `currentColor`
silhouette, which a full-color mark does not have, and rendering a colored icon on
a colored tile (blue OneDrive on blue) is wrong. Adding a light-tile avatar helper
for exactly three marks fails the simplest-thing / rule-of-three bar — deferred
(see Open Questions). This asymmetry is already sanctioned by the spec's "a variant
is present only when it applies" rule; the delta adds an explicit scenario for it.

The vast majority of the 48 are Type **M** (Simple Icons marks are monochrome by
construction). Only `microsoft-teams`, `outlook`, `onedrive` — and `instagram` **if**
the gradient artwork is chosen — are Type **C**.

### D3 — Sourcing per mark, recorded in README + JSDoc

| Cluster | Default source | Exceptions |
| --- | --- | --- |
| Social / consumer | Simple Icons (CC0) | `linkedin` → gilbarbara/logos (`linkedin-icon.svg`, `#0A66C2`) — Simple Icons removed it |
| Workspace / collab | Simple Icons (CC0) | `microsoft-teams` → gilbarbara/logos |
| Mail / office | Simple Icons (CC0) | `outlook` → svgl (`microsoft-outlook.svg`); `onedrive` → gilbarbara/logos |
| AI Gateway gap | per existing AI-mark convention (`@lobehub/icons` source artwork; Simple Icons where present) | `cartesia`, `parallel` → vendor / official brand SVG (newer, niche); verify `xai` availability at authoring |

gilbarbara/logos and svgl are **already declared sources** for this package
(`hume`, `pinecone`, `heroku`, `twilio`, …), so no new source relationship is
introduced. Each mark's `colorPrimary` comes from the Simple Icons hex or the
source SVG's dominant fill. Every mark carries a one-line JSDoc `/** <Brand> —
vendored from <source> (<license>). */`, matching the existing files.

### D4 — Gradient id isolation

`microsoft-teams`, `outlook`, `onedrive` (and gradient `instagram` if chosen) carry
embedded `<linearGradient>` / `<radialGradient>` ids. Each `.Color` renders its ids
through `useFillIds(namespace, n)` so N instances on one page stay isolated — the
cross-instance requirement the smoke test already asserts.

### D5 — Naming

Kebab subpath → PascalCase + `Mark` symbol, per the existing spec requirement:
`facebook` → `FacebookMark`, `microsoft-teams` → `MicrosoftTeamsMark`, `x` →
`XMark`, `google-meet` → `GoogleMeetMark`. The Microsoft family keeps the
descriptive `microsoft-teams` (not a generic `teams`); `outlook` / `onedrive` stay
bare (unambiguous). Generic English names (`x`, `line`, `signal`, `threads`,
`monday`) are disambiguated by the mandatory `Mark` suffix — exactly the reason the
suffix exists.

### D6 — AI-Gateway umbrella marks are dedicated

Per the confirmed scope, `bedrock`, `vertexai`, `xai` ship as **dedicated** marks
(not left to the `aws` / `gcp` / `grok` umbrellas), alongside the two genuinely
absent `cartesia` and `parallel`. This makes `brands/` cover all 24 providers with
a provider-specific mark for each of the five that lacked one.

## Risks / Trade-offs

- **Trademark exposure.** LinkedIn, the Meta family (Facebook/Instagram/WhatsApp/
  Messenger/Threads), and the Microsoft family are trademark-restrictive; LinkedIn
  is already gone from Simple Icons. Mitigation: source from non-Simple-Icons where
  removed, keep the retained disclaimer (marks identify owners, no
  affiliation/endorsement), and the README notes "follow each owner's brand
  guidelines." The package vendors artwork for identification only — the same
  posture the existing ~130 marks already take.
- **Type C marks are less flexible** (no `.Mono`, no `.Avatar`). Accepted: a
  truthful surface beats a broken monochrome silhouette. Consumers needing a tile
  can wrap `.Color` themselves.
- **Brand-color drift.** `colorPrimary` is a snapshot; brands rebrand. Accepted —
  same as every existing mark; a rebrand is a future patch.
- **Source-artwork viewBox variance.** svgl `outlook` uses a non-zero-origin
  viewBox (`60 90.4 570.02 539.67`); it is preserved verbatim so `size` scaling
  stays correct — do not renormalize.

## State Model

Not a runtime state machine. The only "state" is the per-mark variant surface,
fully determined at authoring time by mark type (D2):

```
Type M  →  Base(mono) · .Color · .Mono · .Avatar
Type C  →  Base(color) · .Color
both    →  (never .Text / .Combine — no wordmark artwork in scope)
```

## Migration Plan

Purely additive; no migration. New `brands/<name>` subpaths are a **minor** SemVer
bump per `lib-public-exports-and-semver`; no existing subpath, symbol, or variant
changes. Build entries and the glob smoke test pick up the new files automatically.
Rollout = ship the marks, the README table rows, and the Storybook catalog entries
in one change; `nx run-many -t lint build test @zeroxsolutions/icons` gates it.

## Open Questions

- **Instagram artwork.** Default is the Simple Icons **flat** glyph (Type M — full
  variant surface, `#E4405F`). The signature **gradient** is available from
  svgl/gilbarbara but is Type C (`.Color` only). Ship flat unless the gradient is
  explicitly wanted?
- **Avatar for Type C marks.** Deferred. If tiles for `microsoft-teams` / `outlook`
  / `onedrive` are later needed, add one light-tile avatar helper (icon on a
  neutral rounded background) rather than bending `makeAvatar` — a follow-up once a
  third consumer justifies it.
- **`cartesia` / `parallel` / `xai` exact source.** To confirm at authoring:
  whether each exists in `@lobehub/icons` / Simple Icons, else vendor the official
  brand SVG. Does not affect the public surface, only the source line.
