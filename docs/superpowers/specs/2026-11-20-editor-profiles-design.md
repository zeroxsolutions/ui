# Editor profiles: email and SMS templates, with typed variables

Decided 2026-11-20 with the owner. First of four projects, in the owner's order: (1) this one, (4) the
native editor on a WebView engine, (2) a block library wider than Notion's, (3) a block-preset add-on.

## Intent

Travel authors its email templates, its mail layout and its SMS templates in an editor it built for
itself: a list of collapsible rows with plain textareas, a drag palette and a separate rendered preview
(`packages/notification-staff-web/src/components/data-entry/block-editor.tsx` and its siblings in the
travel repo). The owner wants that editor removed, and its authoring done by the design system's editor.

The design system's editor becomes ONE editor with several profiles. A profile is the set of blocks a
document may hold, the variables it may print, the rules it is checked against, and the output it is
exported to. This project adds two profiles beside the existing document profile:

- **email**: what an email body (or a mail-layout region) may hold, exported to the block tree the house
  email renderer takes, and through that renderer to email HTML and its plain-text alternative;
- **sms**: plain text with variables, exported to the SMS body text, measured in SMS segments.

Variables are typed placeholders the author inserts and the server fills at send time. The editor never
fills them with real values; it shows sample values in a preview only.

## Goals

1. One editor, one feature system: the email and SMS profiles are feature sets of the existing
   `@zeroxsolutions/editor-core` document editor, and custom features compose into them as into the
   document profile.
2. Typed variables as inline tokens, inserted from a menu or by typing `{{`, exported as `{{name}}`.
3. A validation framework: the editor checks a document against its profile and its declared
   variables while the author types, shows each problem where it is, and hands the same problem list to
   the host so the server can apply the same rules.
4. Bold, italic and links in email text, because travel holds no email data yet: adding them now
   costs a change to the house package; adding them after travel stores templates would also cost a
   migration of every stored text and translation.
5. Exports: the email profile to `EmailBlock[]` (the house renderer's input), to email HTML and its text
   alternative through the house renderer; the SMS profile to a body string. Both import back.
6. Travel can delete its block editor and keep its storage, wire shapes, translation states, drafts,
   publishing and delivery; the one change on its side is the inline markup inside text fields (below).
7. Web first, in this project. The native editor (project 4) reuses every non-rendering part.

## Non-goals

- Locales, translation states, drafts, versions, publishing, previews over HTTP, test sends, permissions:
  they stay in travel. The editor holds one locale's content at a time.
- Filling variables with real values, escaping values, formatting dates or money: the server's, through
  the house template code (`@zeroxsolutions/editor-core/template/*`, below).
- A block library wider than Notion's (project 2) and drag-in block presets (project 3).
- The native editor (project 4).

## Anti-goals

- A second email renderer. The house renderer (`createEmailRenderer` in
  `@zeroxsolutions/editor-core/template/email/index`) is the only one; a preview that renders differently from a send is the failure this avoids.
- A profile that lets the author build what its export cannot carry. A block or a mark the email
  renderer cannot draw is not offered in the email profile at all, rather than refused at export.
- Validation that exists only in the browser: the rules run as pure functions the server can import.

## What exists, read 2026-11-20

### In this repo

- `editor-core` exports a codec registry with an open format set (`Format = 'markdown' | 'html' |
  (string & {})`) and per-format custom serializers (`CodecRegistry.registerNodeSerializer(format,
  nodeType, fn)`); `serialize(doc, format, registry)` walks a document with them.
- A feature (`defineFeature`) declares nodes, marks, commands, input rules, shortcuts, codecs and UI
  contributions (slash, toolbar, bubble, block menu).
- The chat composer's trigger tokens (`editor-core/src/composer/triggers/trigger-token.ts`, the
  registry's `composer/triggers/inline-token.tsx` and `trigger-menu.tsx`) already insert an inline atom
  token from a menu opened by a typed character. Variables build on it.

### In travel and the house template package (`@zeroxsolutions/template` 0.2.0, on npm, peer `zod ^4.3.6`; it moves into `editor-core`, below)

The house package owns the email block shapes, the renderer, the variable token and the SMS measure:

- `.`: `VARIABLE_TYPES` (`string`, `duration`, `url`, `email`), `VARIABLE_TOKEN` (`/\{\{(\w+)\}\}/g`),
  `variableTokens`, `sameVariableTokens`, `displayWidth`, `escapeHtml`, `redactVariables`.
- `./email`: `createEmailRenderer({ theme })`, `EmailBlock`, `RenderedEmail`, `RenderProblemKind`
  (`variable-missing`, `href-not-url-variable`, `href-scheme-refused`, `unknown-block-type`,
  `block-nested-too-deep`), `sameBlockContent`.
- `./sms`: `measureSms`, `fitsOneSmsSegment`, `SMS_SEGMENT_UNITS` (`gsm7: 160`, `ucs2: 70`), `renderSms`.

Travel's email blocks (`packages/notification/src/lib/constants/block-type.ts`, content per locale):

| Kind      | Content               | Attributes (all optional, strict)               |
| --------- | --------------------- | ----------------------------------------------- |
| paragraph | `{ text }`            | `align`, `spaceAfter`, `tone: default or muted` |
| button    | `{ label, href }`     | `align`, `spaceAfter`, `width: inline or full`  |
| code      | `{ code }`            | `align`, `spaceAfter`                           |
| list      | `{ items: string[] }` | `align`, `spaceAfter`                           |
| callout   | `{ text }`            | `align`, `spaceAfter`                           |
| divider   | `{}`                  | `spaceAfter`                                    |
| columns   | `{}`, with `lanes`    | `ratio: 2..4 integers 1..12`, `spaceAfter`      |
| html      | `{ html }`            | `spaceAfter`                                    |

`align` is `left`, `center` or `right`; `spaceAfter` is `small`, `medium` (default) or `large`. Text is
plain: no inline marks. Bounds: every text 1..5000 characters, a list 1..20 items, a button label
1..200 and href 1..2000, at most 50 blocks a version counting lane children, at most 4 lanes, one level
of nesting (a lane never holds `columns`). A button's `href` is exactly one token naming a `url`
variable. A template declares at most 20 variables `{ name (\w+, <=64), type, sampleValue (<=500),
required, sensitive }`; a block printing a `required` variable is itself required and cannot be removed.

The mail layout has `header` and `footer` regions limited to `paragraph`, `list`, `callout`, `divider`
and `columns`, and fixed `string` variables `recipient`, `legal_name`, `legal_address`, which the footer
must print.

SMS templates are a flat `(key, locale, body)`; a body is plain text with `{{name}}` tokens, refused when
a `{{` or `}}` is left after the valid tokens are removed, and refused past one segment (GSM-7 when the
text is ASCII, with `^ { } \ [ ] ~ |` costing two units; UCS-2 otherwise).

A translated locale edits content only: it never adds, removes, moves or retypes a block, and a block
keeps its id across edits, because translations are keyed by block id.

## Design

### Profiles

A profile is a named value from `editor-core`, built from features and options:

```ts
// packages/editor-core: the shape, not the final spelling
interface EditorProfile {
  id: 'document' | 'email' | 'sms' | (string & {});
  features: EditorFeature[]; // the blocks and marks it may hold
  variables?: VariableDeclaration[]; // what it may print; absent: no variable feature
  rules: ProfileRule[]; // pure checks, see Validation
  exports: Format[]; // e.g. ['email-blocks', 'email-html', 'email-text'] or ['sms-text']
}
```

- `emailProfile(options)` composes paragraph, button, code, list, callout, divider, columns and html
  with the email rules. `options.allow` narrows the kinds (the mail layout passes its five), and
  `options.variables` passes the declarations (the layout passes its three fixed ones).
- `smsProfile(options)` composes a single plain-text body with hard line breaks and variables, no other
  block and no mark, with the segment rule (`options.maxSegments`, default 1).
- A host adds its own features to a profile; a custom feature that declares an email codec is allowed in
  the email profile, and one without is refused when the profile is built, naming the feature.
- The slash menu, toolbar and block menu offer only what the profile holds.

### Variables

- A `variable` inline atom node with one attribute, `name`. It renders as a token chip (the registry's
  inline-token pill), labelled with the declaration's label or name and its type icon.
- The host passes declarations `{ name, type, label?, sampleValue?, required? }`, `type` being one of
  the house `VARIABLE_TYPES`. The list may change while the editor is open.
- Inserting: a "Variable" toolbar menu, and typing `{{`, which opens the trigger menu filtered by what
  follows. Pasting or importing text that holds `{{name}}` turns each token into a node.
- Exporting writes `{{name}}`. A node whose name is not declared stays in the document and is a problem
  (below), so nothing an author wrote is dropped silently.
- A button's link is chosen from the declared `url` variables only, as travel's form does.

### Where the email schema lives (call made by the writer)

The email nodes (paragraph with `tone`, button, code, list of single-paragraph items, callout, divider,
columns with lanes, html), the `variable` node, their `email-blocks` and `sms-text` codecs, the profiles and
`validate` are engine-free specs and functions in `editor-core`, like its math and mermaid cores. The
registry adds only their React node views and chrome. The email profile does NOT reuse the document
profile's features: the document list holds rich paragraphs, the email list holds one marked-up string
per item, and a shared node would let the author build what the export cannot carry.

### Validation

`validate(blocks, rules) -> Problem[]` is a pure function in `editor-core` that takes the wire shape
(`EditorEmailBlock[]`, below, or an SMS body string), never a ProseMirror document, so a server imports
it without the editor. The editor converts its document and calls the same function. A problem names a
kind, the block id or client key and, where it applies, the field and the offset:

- checks derived from the declarations, without rendering and without sample values:
  `variable-undeclared` (a token naming no declaration), `href-not-url-variable` (a button href that is
  not one token of a `url` declaration), `required-variable-not-printed`;
- shape checks: `block-not-allowed`, `unknown-block-type`, `block-nested-too-deep`, `lanes-mismatch`,
  `text-empty`, `text-too-long`, `list-too-long`, `too-many-blocks`;
- SMS: `sms-segment-exceeded`, `sms-placeholder-malformed`.

The house renderer's own `variable-missing` and `href-scheme-refused` are render-time problems about
values; they stay where values exist, in the host's preview and the server's send. Travel keeps its own
server-side write checks in this project; adopting `validate` on its server is a later choice.

The bounds come from the house package where it exports them; where it does not (`5000`, `20`), they
are options of the profile with travel's values as defaults.

The editor marks each problem in place (a decoration on the block or the token, with its message on
hover and focus) and reports the list through `onValidate(problems)`. The host decides whether a
problem blocks a save; the editor never refuses an edit because of one.

### Inline marks in email text (decided by the owner 2026-11-20: travel holds no email data yet)

- The email profile offers three marks: bold, italic, and a link whose target is one declared `url`
  variable, chosen from the same url-only picker as a button's. No other mark, no colour, no size.
- They apply to a paragraph's text, a callout's text and each list item. A button label, a code block
  and an html block stay plain. The SMS profile offers no mark.
- On the wire a text field stays a string, holding a small inline markup (call made by the writer):
  `**bold**`, `_italic_`, `[label]({{name}})`, with `\` escaping a literal `*`, `_`, `[`, `]` or `\`.
  A string keeps travel's columns, its 5000-character bound and its translation by field; a structured
  run array would change every wire shape and split a sentence into pieces a translation cannot move.
- The house template code owns the grammar: a parser and a printer for it in `template/index`, and the email
  renderer drawing it as `<strong>`, `<em>` and `<a href>` (the href passing the same scheme check as a
  button's), with the text alternative dropping the markers and printing a link as `label (url)`. Text
  that held a literal `**` before now renders bold, so the release is breaking; its number is read off
  the release's dry run.
- New problem kinds: `markup-malformed` (an unclosed marker, a link whose target is not one `url`
  token) and `link-not-url-variable`. `text-too-long` counts the stored string, markers included, as
  travel's bound does.
- Travel's side: its write checks call the house parser so a malformed text is refused, and its
  translation draft keeps every marker and link target of the source (checked the way
  `sameVariableTokens` checks variables, with a house `sameInlineMarkup`); a draft that drops one is
  discarded as one that drops a variable is.

### Email export and import

- `email-blocks`: the document to `EditorEmailBlock[]`: the house `EmailBlock` shape with `id: string |
  null` and a `key` (a client key the editor gives every block it creates), lanes and attributes. A
  host turns it into its wire shape; travel already sends `id: null` for an added block. Import is the
  inverse, so travel loads a stored version and exports it back equal when nothing was edited
  (round-trip test).
- After a save answers with ids for added blocks, the host calls `editor.assignBlockIds({ [key]: id })`,
  which sets them in place without touching the selection.
- `email-html` and `email-text`: `email-blocks` (ids filled with keys) passed through a renderer the host
  hands the editor, the instance it built with `createEmailRenderer` (its theme and any `extraBlocks`),
  with the declarations' sample values, for the preview. A custom feature's email codec writes a block
  kind that renderer knows through `extraBlocks`. The server renders a send itself from the stored
  blocks, so the editor's HTML is never what is sent.
- The editor reports every change through `onChange` and its focus leaving through `onBlur`; when to
  save is the host's. Travel saves on blur and after one second without an edit, as its rows commit on
  blur today.
- Block attributes (`align`, `spaceAfter`, `tone`, `width`, `ratio`) are edited from the block menu.

### Block ids, required blocks and locked structure

- Every top-level and lane block carries an `id` attribute the host owns: kept across edits and moves,
  `null` on a block the author added, copied never (a duplicated block gets `null`).
- `required` blocks (the host passes their ids) cannot be removed; the remove action is disabled with
  the reason, as travel's is.
- `structure: 'locked'` lets the author edit text and variables only: no insert, remove, move, retype
  or attribute change. A translated locale is edited this way.
- `renderBlockAdornment(id) -> ReactNode` lets the host draw beside a block what only it knows: travel's
  translation standing badge, the provenance line for an `auto` or `stale` text and the "reset to
  machine translation" action for an `edited` one. The editor places it; the host owns what it says and
  does.

### SMS export and import

`sms-text` writes the body with `{{name}}` tokens and line breaks; import parses one. The editor shows a
live meter under the body: units used of the segment limit and the encoding (GSM-7 or UCS-2), from the
house `measureSms`, with tokens counted as their literal text as travel's write check counts them.

### The template code moves into editor-core (decided by the owner 2026-11-21)

`@zeroxsolutions/template` was published from the zeroxsolutions repo. Its inline markup landed there
(zeroxsolutions#103, merged at `5bb8d693`, never published). It moves into this repo's
`@zeroxsolutions/editor-core` as the folder `src/template/`, because the editor and the renderer share
the block kinds, the bounds and the markup grammar and change together: one repo puts both sides of a
change in one pull request, and the editor reads the renderer from the workspace instead of waiting on
a publish.

- **One package, a subpath per entry.** `editor-core`'s entry map is the dist-mirrored wildcard
  (`"./*"`), so the folder's barrels are its entries. Travel's workers load the template alone, so the
  split is earned by load, not by a second package. The old entries map as:

  | `@zeroxsolutions/template` | `@zeroxsolutions/editor-core`  |
  | -------------------------- | ------------------------------ |
  | `.`                        | `template/index`               |
  | `./email`                  | `template/email/index`         |
  | `./email/testing`          | `template/email/testing/index` |
  | `./sms`                    | `template/sms/index`           |

  The names each entry lists do not change.

- **The fence.** `src/template/` imports nothing else of `editor-core` and no package but `zod` and
  `get-east-asian-width`, so a worker importing it never loads the editor's engine, katex or mermaid. A
  spec in that folder fails any other import; the rest of `editor-core` may import the template.
- **The code moves without its history.** It is copied at `5bb8d693` in one commit naming the source;
  its history stays readable in zeroxsolutions. (Call made by the writer: imported history would put
  every past `feat(template)` commit into `editor-core`'s changelog range.)
- **zeroxsolutions removes `packages/template`** once the copy is merged here. Version 0.2.0 stays on
  npm, so travel keeps working until its switch; the npm package is deprecated, pointing at
  `editor-core`, after travel switched (the owner's go).
- **No separate release.** The template ships in the `editor-core` release that carries the profiles;
  its number is read off that release's dry run.

### editor-core's entries

The same change tidies the entries the template joins, by the house rule for a wildcard map ("no root
barrel and never `export *`", every entry a folder's `index`):

- The five barrels that hold only `export {}` are deleted: `src/index.ts`, `src/document/index.ts`,
  `src/math/index.ts`, `src/mermaid/index.ts`, `src/migrate/index.ts`. Nothing imports them.
- `document/core/index.ts` lists the type names of `./types/index.js` instead of `export *`.
- Consumers import an area's `index`, never a file inside it: `document/core/index`,
  `document/serialize/index`, `document/migrate/index`, `document/ui/index`, `math/core/index`,
  `mermaid/core/index`, a new `composer/index`, and `template/*/index`. The engine handles the
  registry's node-view adapter reads (`facadeFor`, `EngineHandle`) join the unstable
  `document/advanced` escape, which is the one entry that is a file. Every old path still resolves,
  so no consumer breaks. A spec fails any other import of an `editor-core` path.
- The wildcard map itself stays: changing it would change the file every existing import resolves.

### Where each part lives

| Part                                                                                                                                                                     | Package                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| The template code: variables, the email renderer, the SMS measure, the inline markup grammar and its rendering to HTML and text                                          | `@zeroxsolutions/editor-core`, `src/template/`, behind the fence          |
| `EditorProfile`, `emailProfile`, `smsProfile`, the engine-free email nodes, the `variable` node, `validate`, the `email-blocks` and `sms-text` codecs                    | `@zeroxsolutions/editor-core`, `src/profiles/`, importing `src/template/` |
| Button and columns node views, the variable chip and menu, the problem decorations, the SMS meter, an `EmailEditor` and an `SmsEditor` composed from the document editor | registry items under `editor/` in `packages/ui`                           |
| Docs pages for both editors, with a live email preview                                                                                                                   | `packages/editor-docs-web`                                                |

### Travel's switch (a follow-up PR in the travel repo, part of this project's acceptance)

Travel replaces `block-editor.tsx`, `block-list.tsx`, `block-item.tsx`, `block-content-form.tsx` and the
SMS textarea with the registry's `EmailEditor` and `SmsEditor`, mapping its stored blocks in and out with
`email-blocks` and its refusal codes onto the editor's problem kinds. It moves every import of
`@zeroxsolutions/template` to the matching `@zeroxsolutions/editor-core/template/*/index` entry and drops
the old dependency, refuses malformed markup on write and keeps markup in translation drafts.
Its API, tables and translation states do not change.

## Left to the builder

- The exact names of the profile API and options, within the shape above.
- How the columns block is drawn while editing, as long as its lanes edit in place.
- The problem messages' wording and the decoration's look, from the design system's own tokens.
- Whether `validate` runs on every transaction or debounced, as long as a problem shows within one
  second of the edit that caused it.

## Testing

- Round trip: every travel default template and the default mail layout import and export to equal
  `EmailBlock[]` (`sameBlockContent`), ids and attributes kept.
- Validation: one case per problem kind, each red before its rule exists.
- Inline markup: parse then print returns the input for every grammar case and escape; the renderer's
  HTML and text for bold, italic, a link and an escaped marker; a draft dropping a marker fails
  `sameInlineMarkup`; the editor's bold, italic and link export to the markup and import back.
- The SMS meter agrees with `measureSms` on ASCII, GSM-7 doubles and UCS-2 text.
- Browser specs for inserting a variable by menu and by `{{`, the button's url-only picker, locked
  structure refusing insert and remove, and a required block's disabled remove.
