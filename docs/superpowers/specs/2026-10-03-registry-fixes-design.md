# Spec (c6): bring every registry item up to its requirements

Date: 2026-10-03. Follows spec (c5) (`2026-10-02-docs-motion-design.md`). The rules of spec (c2)
(`2026-09-30-rebuild-on-nova-design.md`) hold for every file this spec touches.

## Why

Two audits of the 42 components and the one block (2026-10-02) found 41 defects in 26 items: 15 in
the code (behaviour, accessibility, a CSS injection, reduced motion, structure, tests) and 26 that
anyone sees (colour, size, style), each tied to a screenshot and a source line. One of them, the
Command Menu demo opening its modal on load, keeps `ci.yml`'s e2e job red on `master`.

## Rules for every fix

1. **A primitive is used as its recipe draws it.** No fix passes a class that changes a vendored
   primitive's size, padding, radius, colour or state styling, and nothing under `ui/` is edited. Where
   the obvious fix would (a ghost `Button`'s `aria-expanded` fill, an `Item`'s height), the item changes
   which primitive it composes, or how, following upstream shadcn's published example for that pattern.
2. **One role, one drawing.** A code surface, a toggle group, a tree row and a status tone each look
   the same in every item that draws them.
3. **The registry composes itself.** A tone shown next to text is a `StatusIndicator`, not coloured text.
4. **Every animation in an item honours reduced motion**, and the state it animates still changes.
5. Every part keeps its own `data-slot`; copy stays sentence case and plain ASCII; a changed part's
   docs page (its API reference, its `data-*` list) changes with it.

## The defects, and what each item must do after

### Behaviour, accessibility and security

| Item                       | After the fix                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| command-menu (demo)        | The page loads with the menu closed; a button in the demo and Ctrl/Cmd+K open it; the docs page's h1 is in the accessibility tree on load.                         |
| number-field               | Escape while editing restores the field's current value and commits nothing.                                                                                       |
| resize-handle              | The handle is focusable with a visible nova focus ring, has `role="separator"` with its orientation and value, resizes with the arrow keys and toggles with Enter. |
| collapsible-card           | `CollapsibleCardTrigger` with text children is named by that text; only the icon-only trigger falls back to a name, and that name says what it toggles.            |
| font-preview               | A `src` or `format` holding quotes, parentheses or braces cannot end the `@font-face` rule: it is escaped or rejected, and the page's other styles are untouched.  |
| ai-provider-picker (block) | An entry with no `meta` renders no footer.                                                                                                                         |

### Reduced motion

The chevrons of `tool-call-card`, `collapsible-card` and `reasoning-collapsible`, the streaming pulse
of `reasoning-collapsible`, and the swatch hover scale of `avatar-picker` stop under
`prefers-reduced-motion: reduce`; the chevron still ends in its open or closed position.

### Structure, demos, tests and docs

| Item                                          | After the fix                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reasoning-collapsible                         | `useReasoningCollapsible` is no longer exported from the family's file (kept internal, as `command-menu` keeps `useCommandMenu`), or it moves to `hooks/` with its context; the page's API reference follows. |
| tool-call-card (demos)                        | Both demos fit the 390px preview.                                                                                                                                                                             |
| font-preview, image-preview, highlighted-code | Each has its own behaviour spec beside it.                                                                                                                                                                    |
| emoji-appearance-toggle-group                 | The docblock states the swatch size the class draws.                                                                                                                                                          |

### What anyone sees

| Item                                                 | Seen today                                                                      | After the fix                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ai-provider-card                                     | amber and green 12px text under 4.5:1                                           | the label in `text-muted-foreground`, the tone on a `StatusIndicator` beside it                            |
| avatar-picker                                        | 36px swatches, a 2px offset ring, a hover scale                                 | swatches at nova's control size, nova's focus ring, the selection marked without an offset ring or a scale |
| code-block                                           | cut off at 390px instead of scrolling on its own rail                           | long lines scroll inside the block at any width; this also fixes `tool-call-card` at 390px                 |
| code-block, highlighted-code                         | two greys and two paddings for one code surface                                 | one fill and one padding                                                                                   |
| collapsible-card                                     | `muted` corners 8px against `default` 14px; content pressed against its divider | one radius for both variants; content spaced as nova's Card spaces its body                                |
| data-table-column-header                             | a sortable header at 12.8px beside 14px plain headers                           | the sortable header at the plain header's size, as upstream's data table draws it                          |
| emoji-appearance-toggle-group                        | the Mono glyph invisible in dark; the row overflows at 390px                    | Mono visible in both themes; the group fits 390px                                                          |
| emoji-appearance-toggle-group, language-toggle-group | detached pills in one, a joined bar in the other                                | both at nova's default spacing                                                                             |
| emoji-picker                                         | group labels show as grey bands outside a popover; the demo overflows at 390px  | labels paint the surface the picker sits on; the demo fits 390px                                           |
| file-tree, avatar-picker                             | focus rings thinner than nova's                                                 | nova's focus ring                                                                                          |
| floating-toolbar                                     | 6px corners and a heavy shadow                                                  | the corners and shadow of nova's floating surfaces                                                         |
| font-preview                                         | the specimen runs off the preview with no ellipsis                              | the specimen truncates within its width                                                                    |
| icon-label (demo), resize-handle (demo)              | overflow, and a covered label, at 390px                                         | both fit 390px with every label readable                                                                   |
| markdown-view                                        | GFM task items as the browser's own checkbox after a bullet                     | the nova `Checkbox`, read-only, with no bullet                                                             |
| model-info-card (demo)                               | one bar invisible in light and another in dark                                  | every bar visible in both themes                                                                           |
| model-list                                           | header inset 4px against rows inset 12px                                        | the header aligned with the rows                                                                           |
| status-indicator                                     | the offline dot nearly invisible                                                | offline visible as a shape in both themes                                                                  |
| tool-call-card                                       | an open card's header stays filled grey                                         | an open header looks like a closed one at rest, with nova's hover                                          |
| tree-item, file-tree                                 | rows 42px against 28px; an expanded chevron stays filled                        | one row height for both trees; no filled chevron at rest                                                   |

The audits' reports and screenshots are in the session scratchpad (`c6-audit-*.md`,
`c6-visual-audit.md`, `c6-visual/`); the plan carries each finding's file and line.

## Checks

**Unit (behaviour only).** Each row of "Behaviour, accessibility and security" gets a case written to
fail first: Escape restores; the handle answers the keyboard; the trigger's accessible name is its text;
a hostile `src` leaves a sentinel element's computed style unchanged; no footer without `meta`. The
three new specs cover what their items render. No case asserts a class.

**E2e.** `component-pages.spec.ts` also asserts, on every component page at 390 wide, that no
preview stage scrolls sideways (`scrollWidth` within `clientWidth`), which today's page-level check
misses because the stage scrolls itself. The full suite passes in the three browsers, `component-pages`
included.

**Visual.** For each item in "What anyone sees", a before and after PNG at 1440 and 390, light and dark,
in the session scratchpad, for the user to review.

**Gate.** `lint typecheck test build` cold, `shadcn build`, and `ci.yml` green on `master` after merge.

## Order of work

1. The Command Menu demo, so `ci.yml` turns green first.
2. Data display: ai-provider-card, code-block, data-table-column-header, file-tree, font-preview,
   highlighted-code, image-preview, markdown-view, model-info-card, tree-item.
3. Data entry: avatar-picker, emoji-appearance-toggle-group, emoji-picker, language-toggle-group,
   number-field, resize-handle, plus the icon-label demo.
4. Feedback, layout, navigation and the block: collapsible-card, floating-toolbar, model-list,
   reasoning-collapsible, status-indicator, tool-call-card, ai-provider-picker.
5. The stage overflow check in `component-pages.spec.ts`, the cold gate, the full e2e and the PNGs.

## Out of scope

- New items, and changing the preset.
- The 17 items both audits passed.
- The deploy (spec c7).
