# Scoping notes - refactor-design-system-conventions

Exploration output retained per the proposal instruction. This is evidence /
context, not the contract (the contract is `proposal.md` + the specs to come).

## Audit universe (authored components + hooks, all packages, EXCLUDING shadcn primitives)

| Package | Composed components | Hooks | Notes |
|---|---|---|---|
| `@zeroxsolutions/ui` | 53 (`components/*` incl `chat/` 4 + `layouts/` 8) | 4 (`useCommandShortcut`, `useIsMobile`, `useReasoning`, `useFrontmatterField`) | EXCLUDES 68 shadcn primitives in `components/ui/*` |
| `@zeroxsolutions/editor` | 45 (`code`, `composer`, `document`, `math`, `mermaid`, `shared`) | 5 (`useCodeEditor`, `useEditorChanges`, `useMathRender`, `useMermaidRender`, `useEditorTheme`) | consumes `ui` in 15+ imports |
| `@zeroxsolutions/icons` | 1 system (`ai-provider-icon`) | 2 (`useFillId`, `useFillIds`, internal) | + ~787 leaf icons (200 brands + 587 material) = NOT audited individually |
| `@zeroxsolutions/fluent-emoji` | 2 (`fluent-emoji`, `style-context`) | 2 (`useFluentEmojiStyle`, `useAmbientFluentEmojiStyle`) | emoji resolver lib |

Total: ~89 components + 13 hooks (icons as one system).

## Design criteria (agreed with user, a-f)

- (a) shadcn convention: `ui/*` vs `components/*` split; compound-in-one-file;
  sub-part `<Parent><Part>`; `data-slot`; kebab files; `export {}` at end; props
  `ComponentProps<'x'>` + `ReactNode` slots. Source: `components.json` + `shadcn` skill.
- (b) domain-free presentational: data via props/slots; no domain type imported.
- (c) no look-alikes: reuse shipped primitives (`Item`, `Badge`); never a
  `*Row`/`*Chip` twin.
- (d) monochrome: grayscale tokens; hue only via a scoped `.dark`-aware var.
- (e) UI design is ours (not a slavish chiselhub copy) but faithful to the source interaction.
- (f) naming/exports per `.agents/rules` (kebab file, PascalCase symbol, `./*` public surface).

## editor/document quick-scan findings (6/45 files read)

Read: `ui/block-menu`, `ui/slash-menu`, `ui/bubble-menu`, `ui/editor-toolbar`,
`ui/floating-shell`, `features/callout/callout`.

Clean: no raw color/hex, no magic arbitrary values (grep). `FloatingShell`
centralizes floating positioning + surface tokens once (bubble + slash share it).

| # | Issue | Evidence | Severity |
|---|---|---|---|
| 1 | No `cn()` anywhere in editor - hand-join `[...].filter(Boolean).join(' ')`; passed `className` can't tailwind-merge | `slash-menu:215`, `editor-toolbar:34`, `floating-shell:92` | HIGH (systemic) |
| 2 | `data-slot` not followed - bespoke `data-block-menu`/`data-bubble-menu`/`data-slash-menu`/`data-editor-toolbar`; only `callout` uses `data-slot` | `block-menu:60`, `bubble-menu:72`, `slash-menu:189`, `callout:57` | HIGH (convention) |
| 3 | Surface look re-declared, drifting elevation - FloatingShell `shadow-md` vs editor-toolbar `shadow-sm` | `floating-shell:93` vs `editor-toolbar:35` | MED |
| 4 | Two floating-position strategies - slash/bubble use `FloatingShell`; block-menu hand-rolls `fixed` + inline `style` + magic `left-28` | `block-menu:52,60` | MED |
| 5 | Mixed icon sources - block-menu handle is a raw unicode glyph in a bare `<button>`; slash/callout use lucide; callout body uses emoji | `block-menu:71-73`, `callout:23-29,165` | MED |
| 6 | Menu row on different primitives - block-menu `DropdownMenuItem`; slash-menu `Item` + hand-rolled keyboard nav/highlight | `block-menu:85`, `slash-menu:149-180,207` | EVALUATE (partly justified: editor owns focus) |
| 7 | Ad-hoc sizing, no shared scale - handle `h-6 w-5`; slash icon `size-8`; group `px-2 pb-1 pt-1.5` | `block-menu:71`, `slash-menu:224,200` | LOW-MED |
| 8 | `TooltipProvider` possibly redundant - Base UI `Tooltip.Root` runs standalone in `ui` | `block-menu:61`, `bubble-menu:75`, `editor-toolbar:41` | LOW (verify) |
| 9 | Docstrings cite removed rule `ui-from-design-system` (shadcn skill replaced it) | `floating-shell:37` (+ scattered) | LOW (doc drift) |
| 10 | Monochrome vs callout color tokens - callout adds `--info/--success/--warning/--danger` keyed on `[data-callout]` | `callout:50-51` | EVALUATE |

Headline: the systemic wins are (1) `cn()` and (2) `data-slot` - both apply to
nearly every editor component, so they are cluster/systemic fixes, not per-file.

## Not yet read (need a pass before the editor clusters are firm)
- features: `table`, `link`, `mention`, `toggle`, `standard-ui` (all 0 ui-import -
  likely most hand-rolled) + `code-block`, `image`, `embed`, `task-item`.
- `math/` + `mermaid/` (most ui-imports: 9/8) - check the two compose alike.
- `composer/` (`chat-input`, `command-menu`, `mention-menu`, `command-node`) -
  overlaps the in-flight `add-editor-chat-composer`.

## Proposed cluster order (to discuss)
1. `ui` model cluster (light audit): `icon-chip`, `model-info-card`,
   `model-list-item`, `model-list`/`skeleton`. NOTE: the new `model-picker` + the
   hover-placement fix are a SEPARATE change (`add-model-picker`), not here.
2. `ui` remaining composed (`chat/`, `layouts/`, buttons, inputs, tree/sidebar, ...).
3. `editor/document/ui` menus+toolbar (systemic `cn` + `data-slot` + shared surface).
4. `editor/document/features/*`.
5. `editor` `math` + `mermaid` + `composer` (after in-flight archived).
6. `icons` system + `fluent-emoji`.
