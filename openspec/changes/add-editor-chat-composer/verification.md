# Verification — add-editor-chat-composer

## Completion Decision

implemented, verified — tasks 1-8 complete; task 9 (release) is user-gated and
intentionally not run (no maintainer request; `commit-conventions`).

## Commands Run

- `nx run @zeroxsolutions/editor:test` — **205 passed** (35 files), incl. the new
  composer specs: `message-payload` (6), `mention-menu` (5), `command-menu` (6),
  `chat-input` (4), `chat-message-view` (4), plus the pre-existing `composer-kit`
  (4) and `create-document-editor` (11, the substrate spec).
- `nx run @zeroxsolutions/editor:typecheck` — **green** (after fixing a rest-param
  type in `message-payload.spec.tsx`).
- `nx run @zeroxsolutions/editor:build` — **green**; the `assert-engine-free-dts`
  guard passes, so every `dist/composer/*.d.ts` is engine-free (no `@tiptap/` /
  `prosemirror-` import in the public surface).
- `nx run @zeroxsolutions/storybook:build-storybook` — **green** (`storybook-static`
  produced).
- `test-storybook` (real Chromium) filtered to `Composer` — **7 passed**; both
  composer stories render without error.

## Manual Checks

Real-browser verification (Playwright 1.61 + Chromium headless against
`storybook-static`, since jsdom cannot measure caret/layout): **23/23 checks
passed**, each paired with a discrimination check that fails when the behavior is
broken:

- **Caret-anchored menu** — the `@` menu opens below the input line
  (`menuTop 462 > inputTop 436`), and its x **follows the caret** (near-start
  `x=227` → far-right `x=506`, a 279px shift) — proving caret anchoring, not
  container anchoring. jsdom cannot show this.
- **Inline highlight** — the typed `@a` / `/im` paints the `.slash-active`
  highlight while the menu is open, and it clears on select.
- **Atomic pill** — selecting a person inserts `@Ada Lovelace`; one `Backspace`
  at the end removes the whole pill.
- **`/` command mode** — opens **only at input start**; a mid-argument `/` opens
  no menu (start-only discrimination); select pins a secondary `Badge` reading
  `Image` and consumes the `/im`; `Backspace` at start clears the Badge.
- **Shared render path** — submitting renders a `ChatMessageView` carrying the
  same mention pill; the view story renders the same `MentionPill` (label, never
  the id) and a leading command `Badge`. A jsdom spec (`chat-message-view.spec`)
  also asserts the view pill's className/data/label are **identical** to the live
  `ChatInput` pill (one render path, no look-alike).

Screenshots (retained in the session scratchpad): `shot-mention-menu.png`,
`shot-command-menu.png`, `shot-badge-pill.png`, `verify-messageview.png`.

## Evidence

- Payload round-trip (`message-payload.spec`): `docToPayload(getJSON(), command)`
  → `{ command, mentions (de-duped), segments (ordered) }`, and `segmentsToDoc`
  round-trips back to the same segments — one shared codec for input and view.
- Boundary: no `@zeroxsolutions/ui → @zeroxsolutions/editor` import edge; no
  TipTap/ProseMirror dependency in `@ui`; no root `export *` barrel; composer
  files resolve additively at `@zeroxsolutions/editor/composer/*` via the existing
  `./*` dist-mirror subpath map.

## Residual Risks

- **Pre-existing, out of scope:** `@zeroxsolutions/storybook:typecheck` fails on
  `pagination.stories.tsx` and `message-scroller.stories.tsx` (missing
  `variant`/`size` on `@ui` primitives). These files are **unmodified** by this
  change and the composer stories are type-clean; not fixed here to avoid scope
  creep.
- The command-in-payload path is proven in a real browser (menu → Badge →
  submit) and by composition (`command-menu.spec` sets the mode; `message-payload`
  carries it); the jsdom `chat-input.spec` also drives it via the menu's keyboard
  commit. No residual gap.
