## Scope

The whole `refactor-composer-trigger-registry` change: build the trigger
descriptor + archetype presets + validation, the generic suggestion menu, the
inline-token node/codec factory, the registry-derived typed payload, migrate
`@mention` / `/command` onto the registry, remove the superseded surfaces, and
gate on review. One cohesive execution block (serial, same-tree).

## Covers

`1.1`-`1.3`, `2.1`-`2.2`, `3.1`-`3.3`, `4.1`-`4.3`, `5.1`-`5.3`, `6.1`-`6.2`,
`7.1`, `8.1`-`8.3`, `9.1`-`9.2`; VF-invocation-contract, VF-cross-token-isolation,
VF-type-gate, VF-browser-render.

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. (red) Spec the descriptor, presets, and validator: defaults applied, override wins, incoherent combo rejected, duplicate char rejected.
2. (green) Implement `trigger-token.ts` (descriptor + `referenceToken`/`invocationToken`/`insertionToken` + validation) until step 1 passes.
3. (red) Spec the inline-token factory: react/HTML round-trip, plain-text = literal slug, no prose reconstruction.
4. (green) Implement `inline-token.tsx` until step 3 passes.
5. (red) Reshape the existing mention/command menu specs onto one `TriggerMenu` contract: select commits + refocuses; sibling menus do not clobber each other's highlight; invocation gate/multiplicity/commit-on-space/backspace-restore.
6. (green) Implement `trigger-menu.tsx` + `trigger-layer.tsx` by extracting the shared menu body, parameterised by the descriptor, until step 5 passes.
7. (spike, then red) Decide the payload type mechanism (inference vs `CustomTypes` augmentation); write a payload spec including a compile-time check that a renamed attribute fails the build.
8. (green) Rewrite `message-payload.ts` + `composer-types.ts` to bucket inline nodes by registered `kind` (registry-derived typed payload) until step 7 passes.
9. (green) Add `mentionToken` (reuse the document mention node) + `commandToken` (via factory); migrate `ChatInputProps` to `triggers`; point `ChatMessageView` at the registry codecs; carry the composer behaviour specs so `@`/`/` are proven unchanged.
10. (refactor) Delete `mention-menu.tsx`, `command-menu.tsx`, hand-written `command-node.tsx`; fix the public barrel; re-express Storybook stories against `triggers`; optionally register `#channel` as the three-trigger proof.
11. (validate) `nx run-many -t lint build test` green; browser-verify the migrated pills; rule-audit the diff.
12. (review) Run the `code-reviewer` subagent over the registry files + payload logic; resolve findings.

## Validation Per Step

1. New specs run red (no implementation yet).
2. `nx test @zeroxsolutions/editor` green for the descriptor/preset/validator specs.
3. Factory specs run red.
4. `nx test @zeroxsolutions/editor` green for the factory specs.
5. Menu specs run red against the not-yet-built `TriggerMenu`.
6. `nx test @zeroxsolutions/editor` green for the menu + layer specs.
7. Payload spec runs red; the intended rename-fails-build check is captured.
8. Payload specs green; a deliberate attribute rename fails `nx build @zeroxsolutions/editor` (VF-type-gate).
9. Carried composer specs green - invocation contract + cross-token isolation hold (VF-invocation-contract, VF-cross-token-isolation).
10. Editor + Storybook build green with the old files removed; no dangling exports.
11. `lint build test` all green; Storybook-via-Playwright confirms `@`/`/` behaviour + pill styling in light and dark (VF-browser-render); rule-audit result stated.
12. Review findings each dispositioned (accepted/deferred/rejected with reason).

## Files / Owners

- `packages/editor/src/composer/triggers/trigger-token.ts`
- `packages/editor/src/composer/triggers/inline-token.tsx`
- `packages/editor/src/composer/triggers/trigger-menu.tsx`
- `packages/editor/src/composer/triggers/trigger-layer.tsx`
- `packages/editor/src/composer/triggers/emoji-menu.tsx` (scaffold, deferred)
- `packages/editor/src/composer/message-payload.ts`
- `packages/editor/src/composer/composer-types.ts`
- `packages/editor/src/composer/chat-input.tsx`
- `packages/editor/src/composer/chat-message-view.tsx`
- co-located `*.spec.tsx` for each above
- `apps/storybook/src/**/*composer*.stories.tsx`
- removed: `mention-menu.tsx`, `command-menu.tsx`, `command-node.tsx`

## Completion Checkpoint

Adding a trigger is one registered token object; `@mention` / `/command` behave
exactly as before through the registry; the payload exposes each kind as a typed
collection and a renamed attribute fails the build; the two old menus and the
hand-written command node are gone; `lint build test` are green.

## Completion Verification

Verification Mode is retained-recommended, so retain evidence beyond green tests:
a Storybook-via-Playwright run (or equivalent) driving the migrated `@` and `/`
flows - insert, commit (Tab/Enter/space), backspace-restore, mid-line `/` stays
literal - plus a light + dark render of the pills, recorded in a verification
companion note. Build + unit green alone does not close this change.

## Review Follow-Up

none yet - populated after step 12 with any accepted finding that changed the
implementation or the completion evidence.

## Delegation Units

Optional single implementer subagent may own the full block (serial, same-tree);
it self-loads the repo rules and framework skills and writes results back here.
The requested review is a separate `code-reviewer` unit over the scope in
`review.md`; its findings feed `Review Follow-Up`.

## Execution Notes

Emoji (`insertion`) is scaffolded only; its `:name:` grammar and virtualised
grid menu are a separate follow-up change and must not distort the
reference/invocation core here.
