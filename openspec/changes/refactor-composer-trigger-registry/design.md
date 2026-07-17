## Context

The composer recognises two inline triggers, each hand-written end to end:

- `@mention` - `packages/editor/src/composer/mention-menu.tsx` + the shared
  document `mention()` node.
- `/command` - `command-menu.tsx` + a hand-written `command-node.tsx`.

`mention-menu.tsx` (272 lines) and `command-menu.tsx` (324 lines) are ~85%
identical: the same trigger-detection effect (`triggerQuery(char)` + `caretRect`
+ selection/change/scroll/resize listeners + Esc-dismiss), ghost completion,
non-interfering `setSlashDecoration` paint, keyboard nav, and
`FloatingShell`/`ScrollArea`/`Item` rendering. They differ only in: trigger
char, data source + filter, gate (anywhere vs input-start), multiplicity (many
vs one-leading), the insert command, and two invocation extras (commit-on-space,
backspace-restore).

The submit payload is a closed union - `ChatSegment = {text} | {mention} |
{command}` - and `docToSegments` / `segmentsToDoc` / `segmentsToText` /
`dedupeMentions` / `leadingCommand` all switch on the literal node type. A third
trigger costs a menu copy, a node copy, a union arm, edits to those five
functions, and a break to every consumer.

The engine layer is already trigger-agnostic: `triggerQuery(char)`,
`setSlashDecoration`, the inline-atom node/codec model (`defineFeature`,
`NodeCodec`), and `FloatingShell` know nothing about `@` vs `/`. The duplication
lives entirely in the React menu wrapper and the per-trigger node.

## Goals / Non-Goals

**Goals:**

- Adding a trigger is registering one token object - no new menu, no new node,
  no payload-mapping edit.
- One generic suggestion menu and one node/codec factory replace the two copies.
- The submit payload is typed AND derived from the registry (extensible without
  losing type safety) - not a hand-maintained union, not an untyped bag.
- `@mention` / `/command` behaviour is preserved exactly, on the new registry.

**Non-Goals:**

- Finishing `#channel` / `:emoji:` as features (emoji is deferred; see Risks).
- A runtime-dynamic (server-loaded) trigger registry - static registration only.
- Touching the document editor's `mention()` node beyond reusing it.

## Decisions

### D1: A registry of trigger tokens is the composer's trigger surface

`ChatInput` takes `triggers: TriggerToken[]` and mounts one generic menu per
pill-bearing token via a `TriggerLayer`. The token descriptor is the single
source both the interaction layer and the payload type read from.

```
   triggers = [ mentionToken, channelToken, commandToken, emojiToken ]
                              |
        +---------------------+----------------------+
        v                     v                      v
   node + codec          generic menu           typed payload
   (render pill)         (query -> commit)      (derived from registry)
```

### D2: Three archetype presets over one open descriptor, with validation

The descriptor is open; presets fill archetype defaults, every field overridable
(the "dynamic but with defaults" requirement). A validator rejects incoherent
resolved combinations, so "dynamic" never means "silently broken".

```ts
interface TriggerToken<Kind extends string, Attrs> {
  kind: Kind;               // 'mention' | 'channel' | 'command' | host-defined
  char: string;             // '@' '#' '/' ':'
  archetype: 'reference' | 'invocation' | 'insertion';
  source(query: string): Option<Attrs>[] | Promise<Option<Attrs>[]>;
  node?: InlineTokenSpec<Attrs>;  // pill archetypes; omitted for insertion
  gate?: 'anywhere' | 'line-start';
  multiplicity?: 'many' | 'one-leading';
  commitOnSpace?: boolean;
  backspaceRestore?: boolean;
  accentClass?: string;
}
// referenceToken(kind, char, source, overrides?)   -> anywhere, many
// invocationToken(kind, char, source, overrides?)  -> line-start, one, space, restore
// insertionToken(kind, char, source, overrides?)   -> no pill; inserts a node
```

| archetype | pill | gate | multiplicity | commit-on-space | backspace-restore | maps |
| --- | --- | --- | --- | --- | --- | --- |
| reference | yes | anywhere | many | no | no | `@` `#` |
| invocation | yes | line-start | one-leading | yes | yes | `/` |
| insertion | no | anywhere | many | (n/a) | no | `:` |

### D3: One generic menu + one inline-token factory (dedupe at the third impl)

The 85% shared menu body becomes `TriggerMenu`, parameterised by the descriptor;
gate / multiplicity / commit-on-space / backspace-restore are read from the
token, not branched per component. `inlineToken({ kind, accentClass, renderPill })`
generates the `NodeSpec` + `NodeCodec` (toReact/toHTML/toMarkdown/fromHTML). This
is the rule-of-three: `#` is the third `reference`-shaped menu, so extracting the
shared engine is earned, not speculative.

### D4: The typed payload is DERIVED from the registry (A, not B)

`docToPayload` walks inline nodes and buckets each committed token under its
registered `kind`. The payload's per-kind collections are a mapped type keyed by
the registered tokens' kinds, element type = that token's `Attrs`:

```ts
const triggers = [mentionToken(people), channelToken(channels), commandToken(commands)] as const;
// payload.tokens.mention : ChatMention[]     (inferred, not declared)
// payload.tokens.channel : ChatChannel[]
// payload.tokens.command : ChatCommandRef[]
```

Rationale (the option we rejected and why): an untyped `payload.tokens:
{kind,id,attrs}[]` bag (call it "B") is NOT more extensible than the derived-
typed registry ("A") - both require a host to supply node + codec for a custom
token; B only discards the types. The mainstream extensible editors converged on
A: Lexical uses typed registered nodes, having replaced Draft.js whose untyped
entity `data` was a cited pain; Slate had to add `CustomTypes` module
augmentation to type its open element model. A is a superset of B (A can expose
an untyped view; B can never expose a typed one), so B is strictly dominated.
This mirrors the repo's own `contract-derive-schema` in spirit: one source
(the registry) generates the wire types; they are never re-declared.

### D5: File layout (one responsibility per file)

```
composer/triggers/
  trigger-token.ts       # TriggerToken type + 3 presets + validation
  inline-token.tsx       # inlineToken() node + codec factory
  trigger-menu.tsx       # the one generic menu (reference/invocation)
  emoji-menu.tsx         # insertion-archetype menu (deferred with emoji)
  trigger-layer.tsx      # mounts one menu per registered pill token
composer/
  message-payload.ts     # docToPayload/segmentsToDoc: registry-driven, typed
  composer-types.ts      # token attr types, registry-derived payload type
  chat-input.tsx         # takes triggers[]
  chat-message-view.tsx  # renders via the registry's codecs
```

Reused unchanged: `triggerQuery`, `setSlashDecoration`, `caretRect`,
`FloatingShell`, `Item`/`Empty`/`ScrollArea`, `defineFeature`/`NodeCodec`.
Folded away: `mention-menu.tsx`, `command-menu.tsx`, hand-written
`command-node.tsx`.

### D6: `mention` reuses the existing document node; `command` is factory-made

The `@mention` node is a shared document feature (`document/features/mention`)
also used by the full editor. `mentionToken` therefore points the registry at
that existing node + codec rather than generating a new one; `commandToken`
generates its node via `inlineToken`. The registry only needs a node name plus a
codec, so it accommodates both "reuse an existing node" and "generate a new one".

### D7: SemVer major; cut `people` / `commands`

`ChatInputProps` drops `people` / `commands` for `triggers`; the payload type
changes shape. This is a `@zeroxsolutions/editor` major. Old props are removed
outright (no compatibility sugar): the composer shipped this cycle with no known
external consumers, so the break is cheapest now, taken deliberately before wide
release.

## Risks / Trade-offs

- **Type inference weight**: deriving `payload.tokens.<kind>` from a
  `triggers` tuple leans on `as const` + generic inference and can produce heavy
  or cryptic types. Fallback: a Slate-style `CustomTypes` module-augmentation
  interface the host extends - less ergonomic, far simpler inference. Decide
  during implementation from a real spike, not up front.
- **God-component menu**: folding two menus into one risks a flag-soup. Mitigated
  by expressing divergence as typed capabilities (`gate` enum, `multiplicity`
  enum, two booleans validated together) rather than loose orthogonal flags; the
  coupled invocation pair (one-leading + backspace-restore) stays one capability.
- **Emoji breaks the pill model**: `:emoji:` has a different grammar (closed by a
  second `:`), a huge dataset (async, virtualised grid menu), and commits a
  native char / image, not a deletable-as-one-unit slug. It is the `insertion`
  archetype and is deferred to a follow-up change so it cannot distort the
  reference/invocation core; `insertion` is scaffolded here but not shipped.
- **Accent colour**: each token may carry its own scoped accent var, but the
  recommendation stays one shared `--composer-accent` hue (Discord uses one
  blurple for all interactive tokens, differentiated by glyph, not colour).

## State Model

Trigger detection per token, recomputed on every selection/change/focus:

```
   idle --type char--> querying (typed `char query` highlighted, menu open)
   querying --select / Enter / Tab / (invocation: exact slug + space)--> committed (inline node)
   querying --Esc--> dismissed (suppressed at this position until caret moves)
   querying --gate/multiplicity fails--> idle (char stays literal text)
   committed (invocation, caret after pill) --Backspace--> querying (restored to `char slug` text)
```

- `reference`: `committed` is repeatable (many per line), no backspace-restore.
- `invocation`: at most one `committed` node, and it must lead the line; the
  `Backspace` edge only exists for this archetype.
- `insertion`: `querying -> committed` inserts a terminal node; no restore edge.

## Migration Plan

1. Land the registry, presets, generic menu, inline-token factory, and typed
   payload behind the new `triggers` API.
2. Ship `mentionToken` / `commandToken`; delete `mention-menu.tsx`,
   `command-menu.tsx`, hand-written `command-node.tsx`.
3. Carry the existing composer tests over onto the registry so `@mention` /
   `/command` behaviour is proven unchanged (start-only, one-leading, Tab/Enter/
   space commit, backspace-restore, no cross-menu highlight clobber).
4. Re-express the Storybook composer stories against `triggers`.
5. `#channel` (a second `reference`) MAY land in this change as the proof the
   registry generalises; `:emoji:` is a separate follow-up change.
6. A reviewer reviews the code structure and the payload-derivation logic before
   archive.

## Resolved During Implementation

- **Payload type mechanism (D4): module augmentation, not tuple inference.**
  A global `ComposerTokenRegistry` interface (kind -> ref) that the library
  declares (`mention`, `command`) and a host augments via `declare module`
  (Slate's `CustomTypes` pattern - the exact typed-registry approach cited as
  evidence for "A"). `payload.tokens` is `Partial<ComposerTokens>`. Chosen over
  making `ChatInput` generic over the `triggers` tuple: far simpler types, no
  cryptic inference, and `ChatInput` stays a plain component. The tradeoff -
  `payload.tokens` is typed from the global registry rather than the specific
  triggers passed - is acceptable and is what Slate/Lexical ship.
- **Payload carries `doc`, not `segments`.** The submit payload is
  `{ text, tokens, doc }`: the document JSON is the positional source of truth,
  so `ChatMessageView` renders `payload.doc` directly and `segmentsToDoc` /
  `docToSegments` / the closed `ChatSegment` union are deleted outright.

## Open Questions

- Does `#channel` ship in this change (as the generalisation proof), or does the
  change land with `@`/`/` migrated only? Leaning: include `#channel`.
- Per-token accent var vs one shared hue - leaning one hue.
