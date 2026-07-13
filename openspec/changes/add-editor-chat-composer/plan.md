## Scope

Implement the `composer/` surface in `@zeroxsolutions/editor` — `ChatInput` (contentEditable
chat composer with inline `@` mention and leading `/` command mode) and `ChatMessageView` (the
read-only render of a submitted message) — reusing the existing engine, `mention` node,
`FloatingShell`, and trigger seams. `@ui` is composed forward only.

## Covers

- Tasks `1.1`–`1.2` (engine spike), `2.1`–`2.2` (kit + types), `3.1`–`3.4` (`@` menu),
  `4.1`–`4.4` (`/` command menu), `5.1`–`5.3` (`ChatInput` + payload), `6.1`–`6.2`
  (`ChatMessageView`), `7.1` (public subpaths), `8.1`–`8.3` (stories + verify), `9.1` (release).
- Validation Focus: VF-engine-seam, VF-one-render-path, VF-payload-round-trip,
  VF-menu-exclusivity, VF-browser, VF-boundary.

## Plan Type

full

High-risk (one unverified engine assumption), cross-surface (input ↔ view must not drift), and
validation-intensive (visual behavior only provable in a real browser).

## Execution Strategy

tdd-preferred

Seam-testable logic (menu select/clear, command state, payload extraction, pill identity) is
written test-first; the visual surfaces are proven in a browser, not unit TDD.

## Ordered Steps

1. **Spike the engine (task 1).** Read `core/builder/create-editor.ts` + the TipTap layer;
   prototype a single-textblock schema (`content: "paragraph"`, inline = `text` + `mention`)
   and an `Enter`→submit / `Shift+Enter`→hard-break keymap. Decide: builder-supported vs
   `composerKit`-owns-node-spec fallback. **No further step starts until this is recorded.**
2. **Build `composer-kit.ts` + `composer-types.ts` (task 2).** The minimal kit (single block +
   text + `mention()` + history + placeholder + submit keymap) and the payload types
   (`ChatPerson`, `ChatCommand`, `ChatMention`, `ChatSegment`, `ChatMessagePayload`).
3. **[Parallel A] `mention-menu.tsx` (task 3).** Test-first: select-inserts-pill, empty-state,
   label-not-id. Then implement the `@` menu as a `slash-menu` near-clone (`triggerQuery('@')`,
   `caretRect`, `setSlashDecoration` highlight, delete-range + `insertMention` on select).
4. **[Parallel B] `command-menu.tsx` (task 4).** Test-first: set-mode-on-select,
   clear-on-backspace-at-start, start-only, one-command-max. Then implement `/` detection
   restricted to input start, emitting a command signal (no doc insert) + `deleteRange` of the
   `/query`.
5. **`chat-input.tsx` + payload (task 5).** Test-first: payload `{ command, mentions, segments }`
   from `getJSON()` + `selectedCommand`, submit-clears, null-command. Then assemble the editor
   over `composerKit()`, mount both menus, hold `selectedCommand` state, render the `Badge` chip
   inside the `@ui` `InputGroup`, style the ProseMirror DOM via tokens.
6. **`chat-message-view.tsx` (task 6).** Test-first: the view renders the **same** `MentionPill`
   as the input (one render path) and a leading `Badge` on a command message. Then implement the
   read-only render over the shared codec from `segments` + `command`.
7. **Public subpaths (task 7).** Add each `composer/*` file to `@editor`'s per-file `./*` map;
   assert no `export *`, no `@ui → @editor` edge, no new ProseMirror dep in `@ui`.
8. **Stories + browser verify (task 8).** Add `apps/storybook/src/composer/` stories; run
   `nx run-many -t lint build test` + Storybook build + `test-storybook`; then drive
   `storybook-static` in a real browser for the four visual behaviors.
9. **Release (task 9, user-gated).** Only when the maintainer asks: `nx release` minor on
   `@editor` (additive subpaths). Not part of the build loop; no auto-commit.

## Validation Per Step

1. A written spike note in `design.md`/`Execution Notes`: the exact seam used, or the fallback
   taken — the gate for steps 2+.
2. `composer-kit` builds an editor whose doc is one paragraph; `Enter` fires submit and
   `Shift+Enter` inserts a break (unit).
3. `mention-menu.spec.tsx` green: pill carries `id`, shows `label`, deletes atomically; empty
   query → design-system `Empty`.
4. `command-menu.spec.tsx` green: command set/cleared as state, start-only, exactly one; a
   mid-argument `/` stays literal text.
5. `chat-input.spec.tsx` green: payload matches the spec example (command + mentions + ordered
   segments); submit clears; null-command path.
6. `chat-message-view.spec.tsx` green: identical `MentionPill` instance/path as the input; leading
   `Badge` present iff `command` set.
7. Dependency-graph / grep check: no `@ui → @editor` import, no `@codemirror`/`@tiptap` in
   `@ui`; each composer entry resolves at its own subpath.
8. `lint build test` + `test-storybook` green; browser shows caret-anchored menu, `@query`
   highlight, atomic pill, leading command `Badge`; each visual test shown to discriminate.
9. `nx release --dry-run` shows a minor bump, no removed subpaths.

## Files / Owners

- `packages/editor/src/composer/composer-types.ts` · `composer-kit.ts`
- `packages/editor/src/composer/mention-menu.tsx` (+ `.spec.tsx`)
- `packages/editor/src/composer/command-menu.tsx` (+ `.spec.tsx`)
- `packages/editor/src/composer/chat-input.tsx` (+ `.spec.tsx`)
- `packages/editor/src/composer/chat-message-view.tsx` (+ `.spec.tsx`)
- `packages/editor/package.json` (per-file `./*` subpath map — additive)
- `apps/storybook/src/composer/*.stories.tsx`

## Parallel Units

- **Unit A — `mention-menu`** (task 3): owns `@` detection, highlight, and pill insertion.
- **Unit B — `command-menu`** (task 4): owns `/` detection (start-only) and the command signal.
- Both start only **after step 2**; **step 5 (`chat-input`) is the aggregator** that mounts both
  and reconciles keyboard focus. Steps 6–8 are serial after 5.

## Isolation Boundaries

- Unit A touches only `mention-menu.tsx` (+ spec); Unit B only `command-menu.tsx` (+ spec).
- Both **read** `composer-kit.ts` / `composer-types.ts` (frozen after step 2) and **write**
  neither. Neither edits `chat-input.tsx`.
- Validation is per-file (each unit's own spec); the cross-unit concern — keyboard/menu mutual
  exclusivity (`@` inline vs `/` start-only) — is owned and tested by the aggregator (step 5),
  not either unit.

## Completion Checkpoint

Every scenario in `specs/editor-composer/spec.md` is demonstrable; all co-located vitest specs
pass; `nx run-many -t lint build test` and Storybook build are green; `@ui` carries no
ProseMirror dependency and no `@ui → @editor` edge exists; the mention pill and command badge
each have exactly one render path across input and view.

## Completion Verification

Because Verification Mode is `retained-recommended`, keep a verification note (a
`verification.md` or an equivalent retained record) proving, against `storybook-static` in a
real browser: (1) the `@` menu opens at the caret and selection inserts an atomic pill showing
the label; (2) the `/` menu opens only at the start and selection pins a `Badge`; (3) the
`@query` inline highlight paints; (4) `ChatMessageView` renders the same pill + badge from a
submitted payload. Record that each visual test was shown to discriminate (fails when the
behavior is broken).

## Review Follow-Up

Accepted findings that shaped this plan:
- *Engine-schema unknown* → step 1 is a hard gate before any build step; fallback documented.
- *Render-path drift* → step 6's validation is an explicit same-`MentionPill` identity assertion.
- *jsdom visual gap* → the retained browser verification above is mandatory before "done".
- *`setSlashDecoration` naming* → deferred; reused as-is, not renamed in this change.

## Execution Notes

<!-- Append transient observations during apply; do not overwrite Manual Adjustments. -->
