## 1. Trigger descriptor, presets, and validation

- [x] 1.1 Add `trigger-token.ts`: the `TriggerToken<Kind, Attrs>` descriptor and the `referenceToken` / `invocationToken` / `insertionToken` presets that fill archetype defaults over overridable fields.
- [x] 1.2 Add resolved-behaviour validation that rejects incoherent combinations (e.g. line-start + many, commit-on-space on a non-invocation) and duplicate trigger characters, with an error naming the offending token/fields.
- [x] 1.3 Co-locate specs for the presets and the validator (defaults applied, override wins, incoherent combo rejected, duplicate char rejected).

## 2. Inline-token node + codec factory

- [x] 2.1 Add `inline-token.tsx`: `inlineToken({ kind, char, display, accentClass })` generating the `NodeSpec` + `NodeCodec` (toReact/toHTML/toMarkdown/fromHTML) shared by both surfaces.
- [x] 2.2 Spec the factory: react/HTML round-trip, plain-text form is the literal slug, no reconstruction from arbitrary prose.

## 3. Generic suggestion menu + trigger layer

- [x] 3.1 Add `trigger-menu.tsx` by extracting the shared body of `mention-menu.tsx` + `command-menu.tsx`, parameterised by the descriptor (trigger char, source/filter, gate, multiplicity, commit-on-space, backspace-restore) rather than per-component branches.
- [x] 3.2 Add `trigger-layer.tsx` that mounts one `TriggerMenu` per registered pill token; preserve the non-interfering highlight (a menu clears only the decoration it painted).
- [x] 3.3 Spec the menu contract: select commits + refocuses; sibling menus do not clobber each other's highlight; invocation gate/multiplicity/commit-on-space/backspace-restore behave.

## 4. Registry-derived typed payload

- [x] 4.1 Spike the payload type: inference from the `triggers` tuple vs a `CustomTypes`-style augmentation; pick the simpler one that keeps `payload.tokens.<kind>` typed (record the choice in design.md).
- [x] 4.2 Rewrite `message-payload.ts` (`docToPayload` / `segmentsToDoc`) to bucket inline nodes by registered `kind` and drop the closed union; update `composer-types.ts` to the registry-derived payload type.
- [x] 4.3 Spec: each registered kind is a typed collection in document order; a renamed attribute fails the build (compile-time proof).

## 5. Ship mention/command on the registry; migrate the API

- [x] 5.1 Add `mentionToken` (reference, reusing the existing `document/features/mention` node) and `commandToken` (invocation, via `inlineToken`).
- [x] 5.2 Change `ChatInputProps` from `people` / `commands` to `triggers`; wire `ChatInput` to mount `TriggerLayer`; point `ChatMessageView` at the registry's codecs.
- [x] 5.3 Carry the existing composer specs onto the registry so `@mention` / `/command` behaviour is proven unchanged.

## 6. Remove superseded surfaces and refresh stories

- [x] 6.1 Delete `mention-menu.tsx`, `command-menu.tsx`, and the hand-written `command-node.tsx`; update the composer barrel/public exports to the deliberate new surface.
- [x] 6.2 Re-express the Storybook composer stories against the `triggers` API.

## 7. Optional: `#channel` as the generalisation proof

- [x] 7.1 Register a `channelToken` (reference) and a Storybook story showing three triggers coexisting - proving a new trigger is one registered object (no new menu/node/payload edit). (Emoji `:` is a separate follow-up change.)

## 8. Validation

- [x] 8.1 `nx run-many -t lint build test` green for `@zeroxsolutions/editor` (and Storybook `test-storybook` where affected).
- [x] 8.2 Real-browser verify (Storybook via Playwright): migrated `@`/`/` behaviour and pill styling in light and dark.
- [x] 8.3 Rule-audit the diff against `.agents/rules/*` (public surface, one-file-one-responsibility, naming, plain-ASCII).

## 9. Review and release (gated)

- [x] 9.1 Run the `code-reviewer` subagent over the trigger-registry files and the payload-derivation logic (the maintainer-requested review); resolve findings.
- [ ] 9.2 Release via `nx release` (SemVer major for `@zeroxsolutions/editor`) - only when the maintainer explicitly asks. **Declined for now:** the maintainer opted out of releasing with this change; the breaking surface is committed and awaits a future release cut.
