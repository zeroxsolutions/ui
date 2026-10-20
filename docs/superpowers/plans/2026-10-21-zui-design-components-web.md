# ZUI design components on the web registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The components drawn in the ZUI Figma files that the web registry lacks ship as `@zui` items:
`circle-icon`, `password-strength` (with its requirement part), `code-input`, `unsaved-changes-toolbar` and
`tab-bar` (with its item part), each with a docs page and a live demo, under every base style.

**Architecture:** Each item is a composed component in `apps/registry-ui/registry/bases/base-ui/components/<category>/`
over the base-ui primitives already in `registry/bases/base-ui/ui/`, registered in `registry.json` with its
`@shadcn/*` and `@zui/*` dependencies, with a demo in `examples/` and a page in `content/docs/components/`.
Nova and Vega differ only through the library primitives (the design spec's "Nova vs Vega" sections), so
one item serves every base style: what ZUI draws itself is the same in both files.

**Tech Stack:** the registry site's stack (Next.js, Base UI, Tailwind 4, Vitest + Testing Library,
Playwright), shadcn CLI.

**Spec:** the design read-out `.superpowers/design/zui-components.md` (Figma "ZUI" iN1wQM8qXs9H5w0ExK4Zcy and
"ZUI - Vega" KfUr5cX1dsKJKtLd6scC68), whose per-component `code:`, `props:` and `parts:` lines name the API;
`.superpowers/design/zuidump/{nova,vega}/` hold the raw node dumps. Each task reads its own section.

## Global Constraints

- Item names, files and parts exactly as the spec's `code:`/`parts:` lines name them (for example
  `components/feedback/password-strength.tsx` exporting `PasswordStrength`, `PasswordStrengthMeter`,
  `PasswordStrengthRequirements`, `PasswordStrengthRequirement`).
- Upstream primitives are composed, never edited; classes the spec lists (`h-12 flex-1 text-lg font-semibold`,
  `bg-background/70 backdrop-blur`, `rounded-2xl bg-popover shadow-lg ring-1 ring-foreground/10` ...) are
  used as written.
- Icons through the registry's own icon items (`@zui/eye-icon`, `@zui/circle-check-icon`, the new
  `@zui/circle-icon`), as password-input does.
- Every item: `categories`, a demo, a docs page in the shape of `content/docs/components/password-input.mdx`,
  listed in `content/docs/components/meta.json` under its category; the existing e2e and source specs that
  sweep every component page must pass.
- Follow the gundam skills for each file kind (`adding-a-design-system-component`, `writing-a-component`,
  `writing-component-tests`, `writing-e2e-tests`, `writing-prose`, `cutting-ai-tells`, `writing-plain-ascii`,
  `declaring-a-dependency`); run everything through nx by scoped name.

## Review Focus

1. Password Strength announces the change in strength to a screen reader (a polite live region) and its
   meter has an accessible value text, not a bare bar (Task 1).
2. Code Input: pasting a full code fills every slot; the 3-3 pattern reads as one input, not two; invalid
   sets `aria-invalid` on the input (Task 2).
3. Unsaved Changes Toolbar's message is a polite live region and Saving disables Save without moving focus
   away from it (Task 3).
4. Tab Bar is a `nav` landmark with `aria-current="page"` on the active item; labels hidden (`selected`,
   `none`) still name each item for a screen reader (Task 4).
5. Every new page renders its demo without a console error and is reachable from the sidebar, search and
   sitemap (each task's e2e run).

---

### Task 1: circle-icon, Password Strength and its requirement

Spec sections: `zui/circle` (`8:154`), `Password Strength` (`11:327`), `Password Strength Requirement`
(`11:200`). Files: `icons/circle-icon.tsx` (in the shape of `circle-check-icon.tsx`),
`components/feedback/password-strength.tsx` + spec, `examples/password-strength-demo.tsx`,
`content/docs/components/password-strength.mdx`, `registry.json`, `meta.json`.

- [ ] Tests first (component spec): strength `weak|fair|strong` sets the meter's value and its label text;
      a met requirement shows the circle-check and foreground text, an unmet one the circle and muted text;
      the meter has an accessible name and value text; a change of strength is announced politely.
- [ ] Implement, register, demo, page. Run the app's lint, typecheck, test and the e2e component-page specs.
- [ ] Commit `feat(registry-ui): add password strength and the circle icon`.

### Task 2: Code Input

Spec section `Code Input` (`51:596`). Files: `components/data-entry/code-input.tsx` + spec, demo, page,
`registry.json` (`@shadcn/input-otp`), `meta.json`.

- [ ] Tests first: `pattern="6"` renders one group of six slots, `"3-3"` two groups with a separator and one
      input; typing fills slots left to right; paste of a six-digit code fills all; `aria-invalid` on the
      input when invalid; the active slot closes its box (the spec's border rule).
- [ ] Implement, register, demo, page; lint, typecheck, test, e2e. Commit `feat(registry-ui): add code input`.

### Task 3: Unsaved Changes Toolbar

Spec section `Unsaved Changes Toolbar` (`40:536`). Files: `components/feedback/unsaved-changes-toolbar.tsx`

- spec, demo, page, `registry.json` (`@shadcn/button`), `meta.json`.

* [ ] Tests first: `side` top|bottom positions it; `state` default|saving|error|attention changes the message
      tone and, for saving, disables Save and shows its spinner; the message is a polite live region.
* [ ] Implement, register, demo, page; lint, typecheck, test, e2e. Commit
      `feat(registry-ui): add the unsaved changes toolbar`.

### Task 4: Tab Bar and its item

Spec sections `Tab Bar` (`37:4415`) and `Tab Bar Item` (`36:687`). Files:
`components/navigation/tab-bar.tsx` + spec, demo, page, `registry.json` (`@shadcn/badge`), `meta.json`.

- [ ] Tests first: a `nav` landmark; `side` lays items in a row (top/bottom) or a column (left/right);
      `labels="always"` shows every label, `"selected"` only the active one, `"none"` none, each item keeping
      its accessible name; `active` sets `aria-current="page"` and the indicator; `surface` and `shape` switch
      their classes; a TabBarBadge renders a destructive badge.
- [ ] Implement, register, demo, page; lint, typecheck, test, e2e. Commit `feat(registry-ui): add the tab bar`.
