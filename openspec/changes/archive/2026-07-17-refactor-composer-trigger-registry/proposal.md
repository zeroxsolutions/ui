## Why

The chat composer (`@zeroxsolutions/editor/composer`) recognises exactly two
inline trigger tokens today, each hand-written end to end: `@mention` and
`/command`. Their two suggestion menus (`mention-menu.tsx`, `command-menu.tsx`)
are ~85% identical, the `/command` node duplicates the `@mention` node almost
line for line, and the submit payload is a **closed** discriminated union
(`ChatSegment = {text} | {mention} | {command}`) that every consumer switches on.

Adding a third Discord-style trigger (`#channel`, `:emoji:`) therefore costs a
third copy of the menu, a third hand-written node, a new union arm, and edits to
`docToSegments` / `segmentsToDoc` / `segmentsToText` / dedupe - plus a break to
every consumer reading the payload. The interaction layer wants to be one
generic engine; the wire model wants to be typed but generated, not restated.

This change makes triggers a **registry**: adding one is registering a token
object, and the typed submit payload is **derived from that registry** rather
than re-declared. That gives the extensibility of an open system with the type
safety of a closed one - the design the mainstream extensible editors converged
on (Lexical's typed registered nodes over Draft.js's untyped entity `data`).

## What Changes

- Introduce a **trigger token descriptor** and three archetype presets -
  `reference` (`@`, `#`: inline pill, anywhere, many), `invocation` (`/`: inline
  pill, line-start, one-leading, backspace-restore, commit-on-space), and
  `insertion` (`:` emoji: no pill, inserts a native/image node). Each preset
  fills archetype defaults over an open descriptor whose fields stay overridable,
  with validation rejecting incoherent combinations (e.g. line-start + many).
- Collapse the two suggestion menus into **one generic trigger menu** driven by
  the descriptor, and generate each pill's node + codec from **one inline-token
  factory** instead of a hand-written node per trigger.
- Make the submit/stored payload **registry-derived and typed**: `docToPayload`
  buckets inline nodes by their registered `kind`, so a host reads
  `payload.tokens.mention` / `.channel` / `.command` with per-token types
  inferred from the registered triggers - no closed union, no `as` casts.
- Replace `ChatInput`'s `people` / `commands` props with a single `triggers`
  registration surface; the `@mention` / `/command` behaviour is preserved by
  shipping `mentionToken` / `commandToken` built on the presets.

## Success Criteria

- Adding a new trigger type is a single registered token object - no new menu
  file, no hand-written node, no edit to the payload mapping functions.
- `ChatInput` and `ChatMessageView` render every trigger through one shared
  node + codec per token, so the editable and read-only surfaces cannot drift.
- The submit payload exposes each registered token kind as a typed collection
  inferred from the registry; a renamed token attribute fails the build.
- `@mention` and `/command` keep their exact current behaviour (inline pills,
  start-only command, Tab/Enter/space commit, backspace-restore) through the
  new registry, verified by the existing composer tests carried over.
- `lint build test` stay green for `@zeroxsolutions/editor`; a reviewer signs
  off on the code structure and the payload-derivation logic before archive.

## Non-Goals

- Shipping the `#channel` and `:emoji:` triggers as finished features. This
  change delivers the registry plus the `reference` / `invocation` / `insertion`
  archetypes and migrates `@mention` / `/command` onto them; `:emoji:` (its
  `:name:` grammar, virtualised grid menu, native/custom-emoji rendering) is
  called out as the archetype that stresses the model and is deferred to a
  follow-up change.
- A host-defined, runtime-loaded (non-static) trigger type. The registry is
  extensible by static registration; a fully dynamic runtime registry is out of
  scope.
- Any change to the document editor's own `mention()` feature beyond the
  composer reusing its node through a registered token.

## Capabilities

### New Capabilities

- `composer-trigger-registry`: how the chat composer discovers, renders, commits,
  and serialises inline trigger tokens through a registry of token descriptors
  and archetype presets, and how the typed submit payload is derived from that
  registry.

### Modified Capabilities

<!-- None. The base composer capability (add-editor-chat-composer) is still an
     in-flight change, not yet an archived spec under openspec/specs/, so this
     change stands up the trigger behaviour as its own new capability rather than
     a delta on an unarchived one. -->

## Impact

- **Package**: `@zeroxsolutions/editor` (`packages/editor/src/composer/`).
  Breaking public-surface change (SemVer **major**): `ChatInputProps` moves from
  `people` / `commands` to `triggers`, and `ChatMessagePayload` / `ChatSegment`
  become registry-derived typed shapes. New exports: the trigger descriptor type,
  `referenceToken` / `invocationToken` / `insertionToken`, `mentionToken` /
  `commandToken`, and the inline-token factory.
- **Superseded wiring**: the hardcoded `@mention` + `/command` surfaces from the
  in-flight `add-editor-chat-composer` change (`mention-menu.tsx`,
  `command-menu.tsx`, hand-written `command-node.tsx`) are folded into the
  generic menu + factory.
- **Storybook**: the composer stories re-expressed against the `triggers` API.
- **Consumers**: none known outside this repo (the composer shipped this cycle),
  so the payload/API break is low-cost now and deliberately taken before release.
