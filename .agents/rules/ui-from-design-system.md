## Build Every UI Surface From the House Design System
`[HIGH]` `ui-from-design-system`

Any workspace code that renders UI — a frontend app, **or** a publishable UI library / composite component (an editor, a chart kit) — takes the house design system (its package name, component surface, and import subpaths are the catalog in `CLAUDE.md`) as the **default source for all UI**: compose every surface from it before writing a bespoke component, and add **no competing UI/component library**. It spans low-level primitives through composed surfaces (tables, forms, charts, dialogs, command palettes, popovers, tooltips, empty states, …) on one CSS-variable token set that flips light/dark. The **installed package** — its types plus Storybook — is the authoritative, version-current inventory, never a frozen list. Its components are client components (Base UI hooks / browser APIs), so under an App-Router app import them from a `"use client"` module.

**Compose, don't re-implement.** Never hand-roll a shell that duplicates a component the design system already ships — recreating a popover surface's look (`bg-popover border shadow`) is copying its popover; a hand-built list of `<button>` rows with its own filtering is its command/menu list; a centered "nothing here" `<div>` is its empty state. Reach for the composed component, not a look-alike. The **only** sanctioned bespoke UI is where the design system genuinely cannot express the requirement — a floating surface anchored to a **coordinate or virtual point** rather than a DOM trigger, or a surface whose **keyboard focus is owned by another component** — and even then only that positioning/focus shell is bespoke: everything rendered inside it (buttons, list rows, pressed/toggle states, tooltips, empty states) is still a design-system component, on the design-system tokens.

Wire its **stylesheets through Tailwind**, not a JS side-effect import: the sheets ship as source, so `@import` them from your Tailwind entry CSS. Import **both** sheets — the tokens/dark-variant/font sheet and the scanner-source sheet — when the app owns no tokens of its own; import **only** the source sheet when the app already owns Tailwind and its tokens, so the components ride your tokens. Dark mode is the `dark` variant keyed off a `.dark` class.

Reach for **emoji through the design system's components** (it bundles the house emoji package to back its emoji-picker / avatar-editor surfaces); depend on the emoji package directly only when you need the raw assets.

**Incorrect — a competing library, a re-implemented shell, or a JS side-effect stylesheet import:**
```ts
import { Button } from 'some-other-ui-lib';   // 🔴 a competing component library forks the design system
<div className="bg-popover border shadow" />; // 🔴 a hand-rolled look-alike of the shipped popover surface
import '<design-system>/styles.css';           // 🔴 JS side-effect — Tailwind never scans the lib; classes go missing
```

**Correct — from the design system; a bespoke shell only for positioning/focus:**
```ts
import { Button } from '<design-system>/components/ui/button';   // ✅ house design system
// a caret-anchored menu: only the anchor is bespoke; the contents are the design system's
<Popover anchor={virtualCaret}>{/* CommandItem / Empty / Tooltip — all design-system */}</Popover>
```
```css
@import '<design-system>/styles.css';  /* tokens + dark variant + font */
@import '<design-system>/source.css';  /* points Tailwind's scanner at the lib */
```

**Rules of thumb:**
- Design-system component first; hand-roll only a positioning/focus shell the system can't express (a coordinate/virtual anchor, or foreign keyboard-focus ownership) — never a look-alike of a component it already ships.
- `@import` the source stylesheet(s) from the Tailwind entry CSS — both sheets when the app owns no tokens, only `source.css` when it already owns Tailwind + tokens.
- Emoji through the design system's surfaces; a direct emoji-package dependency only for raw assets.
- The installed package's types/Storybook + `CLAUDE.md` are the source of truth for what exists and how to import it.

**Why:**
- One component set on one token set keeps every surface visually consistent and shrinks bundle + maintenance; a second UI library forks the design system, and a hand-rolled look-alike silently drifts from the component it copies (tokens, a11y, dark mode) — so bespoke is confined to what the system provably can't do (coordinate/virtual anchoring, foreign focus ownership), never a re-skin of what it already ships. Importing the source stylesheets is what makes the design system's classes exist in your Tailwind build.

Reference: [Tailwind CSS](https://tailwindcss.com/) · see `house-libs-catalog-scope` · `fe-app-structure` · `lib-public-exports-and-semver`
