# Cluster 3 - icons + fluent-emoji (mini-proposal)

Scope: the icon-system and fluent-emoji utility modules whose file name does not match
their primary export (audit section 1a), plus a philosophy pass over the resolvers,
Provider, and setters.

## Decisions

### File name = primary export (kebab), per `design-system-conventions`

Rename the five mismatched modules so each file is the kebab form of its primary export,
updating the file, every in-repo importer, and the package `index.ts` re-exports:

- `packages/icons/src/ai-provider-config.ts` -> `ai-provider-mappings.ts` (primary export
  `aiProviderMappings`).
- `packages/fluent-emoji/src/lib/codepoint.ts` -> `emoji-to-unicode.ts` (primary export
  `emojiToUnicode`).
- `packages/fluent-emoji/src/lib/style-context.tsx` -> `fluent-emoji-style-provider.tsx`
  (primary export `FluentEmojiStyleProvider`).
- `packages/fluent-emoji/src/lib/resolve.ts` -> `fluent-emoji-url.ts` (primary export
  `fluentEmojiUrl`).
- `packages/fluent-emoji/src/lib/emoji-data.ts` -> `emoji-categories.ts` (primary export
  `EMOJI_CATEGORIES`).

These are internal modules (re-exported through each package's barrel), so the rename is
internal - no public subpath change, no breaking bump - unless a package's `exports` maps
the internal path directly (check `packages/icons/package.json` and
`packages/fluent-emoji/package.json` `exports` first; if any internal path is exported,
the rename is breaking and gets the major treatment).

### Philosophy pass (task 3.2)

Walk the resolvers, `FluentEmojiStyleProvider`, and the `setFluentEmoji*` setters against
the shadcn philosophy checklist. Confirmed clean by the earlier audit (no cn/data-slot
violations, no look-alikes, per-instance SVG-id isolation correct). The pass only records
this; no refactor expected.

## Verification

- `nx run-many -t lint build test` green across `icons`, `fluent-emoji`, `ui`, `editor`.
- Each renamed file's kebab matches its primary export; no dangling import of the old
  path; barrels re-export from the new paths.

## Out of scope

The compound-spec deltas (cluster 4), the breaking-rename release bookkeeping (cluster 5,
unless an internal rename turns out to be a published subpath), and the block/page seed.
