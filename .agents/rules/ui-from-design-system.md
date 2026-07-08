## Build Every Screen From the House Design System
`[HIGH]` `ui-from-design-system`

In a frontend app the house design system (its package name, component surface, and import subpaths are the catalog in `CLAUDE.md`) is the **default source for all UI** — compose every screen from it before writing a bespoke component, and add **no competing UI/component library**. It spans low-level primitives through composed surfaces (tables, forms, charts, dialogs, command palettes, editors, chat, …) on one CSS-variable token set that flips light/dark. The **installed package** — its types plus Storybook — is the authoritative, version-current inventory, never a frozen list. Its components are client components (Base UI hooks / browser APIs), so under an App-Router app import them from a `"use client"` module.

Wire its **stylesheets through Tailwind**, not a JS side-effect import: the sheets ship as source, so `@import` them from your Tailwind entry CSS. Import **both** sheets — the tokens/dark-variant/font sheet and the scanner-source sheet — when the app owns no tokens of its own; import **only** the source sheet when the app already owns Tailwind and its tokens, so the components ride your tokens. Dark mode is the `dark` variant keyed off a `.dark` class.

Reach for **emoji through the design system's components** (it bundles the house emoji package to back its emoji-picker / avatar-editor surfaces); depend on the emoji package directly only when you need the raw assets.

**Incorrect — a competing library, or a JS side-effect stylesheet import:**
```ts
import { Button } from 'some-other-ui-lib';   // 🔴 a competing component library forks the design system
import '<design-system>/styles.css';           // 🔴 JS side-effect — Tailwind never scans the lib; classes go missing
```

**Correct — from the design system; stylesheets `@import`ed into Tailwind:**
```ts
import { Button } from '<design-system>/components/ui/button';   // ✅ house design system
```
```css
@import '<design-system>/styles.css';  /* tokens + dark variant + font */
@import '<design-system>/source.css';  /* points Tailwind's scanner at the lib */
```

**Rules of thumb:**
- Design-system component first; write bespoke only when nothing there fits; never add a second UI library.
- `@import` the source stylesheet(s) from the Tailwind entry CSS — both sheets when the app owns no tokens, only `source.css` when it already owns Tailwind + tokens.
- Emoji through the design system's surfaces; a direct emoji-package dependency only for raw assets.
- The installed package's types/Storybook + `CLAUDE.md` are the source of truth for what exists and how to import it.

**Why:**
- One component set on one token set keeps every app visually consistent and shrinks bundle + maintenance; a second UI library forks the design system, and importing the source stylesheets is what makes the design system's classes exist in your Tailwind build.

Reference: [Tailwind CSS](https://tailwindcss.com/) · see `house-libs-catalog-scope` · `fe-app-structure`
