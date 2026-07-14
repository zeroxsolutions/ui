# Design - refactor SplitButton + add Permission

Presentational design-system work in `@zeroxsolutions/ui`. Two components, one thread:
the AI permission card's `Allow` control *is* a split button, so fixing the button and
adding the card ship together. All decisions below honour `ui-compound-authoring`,
`ui-primitive-fidelity`, and `ui-from-design-system`.

## D1 - The permission gate is a standalone component, not a new `Tool` state

**Decision.** Add a new `Permission` compound rather than bolting an `input-required` state
onto the existing `Tool` card.

**Why.** `Tool` is a read-only status surface (call lifecycle -> status badge + JSON dump).
A permission gate is *interactive* (a decision row) and has a *persisted outcome* state.
Overloading `Tool` with interactivity and a resolved state mixes two responsibilities in one
component (against one-file-one-responsibility). Keeping them separate lets each stay simple;
visual consistency is preserved by **composing the same primitives** (`Badge`, `Collapsible`,
`CodeBlock`) rather than by sharing a component. In the stream, a `Permission` card can sit
directly before the `Tool` card that runs once consent is granted.

**Rejected.** A `state: 'input-required'` added to `ToolState` - it drags approval buttons,
scope handling, and a resolved state into a component documented as "presentational status".

## D2 - SplitButton is a compound on `ButtonGroup`, not a hand-rolled flex

**Decision.** Rebuild `SplitButton` as a Root that composes `ButtonGroup` + named sub-parts:

```
<SplitButton>                       // = ButtonGroup, data-slot="split-button"
  <SplitButtonAction onClick>Allow once</SplitButtonAction>   // primary Button
  <SplitButtonMenu>                 // = DropdownMenu (Base UI Root renders no DOM)
    <SplitButtonTrigger />          // DropdownMenuTrigger render={<Button size="icon-sm"><ChevronDown/></Button>}
    <SplitButtonContent>
      <SplitButtonItem onClick>Allow this session</SplitButtonItem>
      <SplitButtonItem onClick>Always allow deploy</SplitButtonItem>
    </SplitButtonContent>
  </SplitButtonMenu>
</SplitButton>
```

**Why.** `ButtonGroup` already collapses adjacent buttons into one seamed unit - `*:data-slot:
rounded-r-none`, `[&>[data-slot]~[data-slot]]:border-l-0`, and the outer part re-rounds - and the
base `Button` cva carries the `in-data-[slot=button-group]` hooks. Because Base UI `Menu.Root`
renders no DOM, the action `Button` and the trigger `Button` remain **adjacent siblings** inside
the group, so the seam selectors apply; `DropdownMenuContent` portals out of flow. This is the
`ui-compound-authoring` shape: compound parts, `data-slot="split-button-*"` on each, Base UI
`render` (the current code already uses `render` for the tooltip/menu triggers - no Radix
`asChild`).

**Rejected.** Two `size="icon"` buttons in `flex items-center` (today) - reads as two loose
controls, no seam, and is a prop-bag.

## D3 - SplitButton is a *structural* compound: no bespoke cva

**Decision.** `SplitButton` adds no `splitButtonVariants` `cva`. All visual styling is delegated
to the `ButtonGroup` and `Button` primitives it composes; the consumer passes a matched
`variant`/`size` to `SplitButtonAction` and `SplitButtonTrigger` (or the parts default to a
matched pair). The Root only sets `data-slot` and lays out.

**Why.** `ui-compound-authoring`: "a purely structural compound skips cva entirely." The only
axis that must stay matched across the two segments (so they read as one control) is the Button
`variant`; the radius/border join is `ButtonGroup`'s job. Minting a second variant vocabulary on
top of `Button`'s would duplicate the contract and let the two drift.

**Open.** Whether the parts share `variant` by a matched **default** or require the consumer to
set it on both. Leaning to a matched default (`outline`) on both parts for zero-prop parity,
overridable per part - resolved during authoring against the sibling files. No hand-rolled
context and no prop-drilled boolean either way (`ui-compound-authoring`).

## D4 - Classic split-button semantics; drop the remembered-default toggle

**Decision.** The primary runs a **fixed** action; menu items are **related variants**, each with
its own handler. Drop `value` / `onValueChange` (the "switch which option is current" toggle).

**Why.** The two behaviours are different components fused into one. The permission use case wants
the classic one (Allow-with-scopes: primary = the safe grant, items = riskier grants). The
remembered-default segmented toggle ("repeat last-picked action; caret changes the default") is a
separate concern - deferred (non-goal), not deleted-from-the-world.

**Migration.** Only the story + spec consume `SplitButton` today, so the API break is contained.

## D5 - Permission is inline and non-modal; the outcome persists

**Decision.** `Permission` renders in the message body (inside `ChatMessageShell`, assistant/tool
role) - never an `AlertDialog`/modal. On decision it resolves to a persisted `approved` / `denied`
state that stays in scrollback and is non-interactive.

```
pending ── allow(scope) ──▶ approved ──▶ "✓ Allowed {scope} - {time}"  (optional undo)
   │
   └──────── deny ─────────▶ denied  ──▶ "✕ Denied"  + composer regains focus
```

**Why.** A consent decision must live in the conversation history: scannable after the fact,
legible once resolved, and part of the transcript. A modal interrupts the flow and disappears,
leaving no trace in the stream. `ConfirmButton`'s modal is right for a destructive table row,
wrong here.

## D6 - Status is a host-driven prop; state rides Base UI primitives

**Decision.** `status: 'pending' | 'approved' | 'denied'` is a plain prop (like `Tool`'s `state`),
surfaced as `data-status` on the Root. Parts show/hide via selectors
(`group-data-[status=pending]/permission:` reveals `PermissionActions`, otherwise
`PermissionResolved`). The **preview's** open/close rides the Base UI `Collapsible`.

**Why.** `ui-compound-authoring`: layout coordinates via `data-slot`/`data-*`; interactive
*open/close* state rides the wrapped Base UI primitive - never a hand-rolled React context or a
prop-drilled `open` boolean. `status` is host data, not cross-part interactive state, so a
`data-status` attribute is the correct, context-free mechanism - the exact pattern `Tool` already
uses for `state`.

## D7 - The decision row is asymmetric by design

**Decision.** `Deny` is a plain, low-emphasis `Button` (`ghost`/`outline`, **not** `destructive`).
All graduated scopes live on the `Allow` side as a `SplitButton`. `Permission` composes the Allow
control through children, so single-scope -> plain `Button`, multi-scope -> `SplitButton`.

**Why.** Asymmetric risk: allowing is the irreversible, higher-stakes path; denying is the safe,
reversible default. Graduated consent (once -> session -> always) only makes sense on the grant
side - "graduated distrust" is noise because distrust is already the default. One caret in the
row keeps the signal ("safe default + one considered action"); two carets dilute it. `Deny` is not
painted red - colouring the safe path `destructive` mis-frames it, and colour must stay a semantic
token regardless (`ui-primitive-fidelity`).

**"Deny + tell it why" is not a menu item.** It is *deny, then keep talking* - on deny the card
resolves and the composer regains focus; the conversation itself is the affordance. No split
button on the deny side.

## D8 - `tone` inverts emphasis for a dangerous request, without changing structure

**Decision.** A `tone: 'default' | 'danger'` axis on `Permission`. `default` emphasises `Allow`
modestly (the expected continuation). `danger` (e.g. "the assistant wants to send data off-box")
inverts emphasis toward `Deny`. It never turns `Deny` into a split button and never restructures
the row - only which side reads as primary.

**Why.** Most requests want the happy-path grant lightly emphasised; a genuinely dangerous request
wants rejection foregrounded. A single tone axis captures both without a second component.

## D9 - Naming: `Permission`

**Decision.** Root `Permission`, parts `Permission{Header,Description,Preview,Actions,Resolved}`,
`data-slot="permission-*"`. Parallels the existing AI surfaces (`Tool`, `Reasoning`) - short root,
role-suffixed parts, kebab file `permission.tsx`.

**Considered.** `Approval` / `PermissionRequest` - `PermissionRequest` makes every part name long
(`PermissionRequestHeader`); `Approval` is fine but `Permission` reads closer to the domain ("the
assistant is requesting permission"). Revisit only if a naming collision surfaces during authoring.

## Where it lives

- `packages/ui/src/components/split-button.tsx` - rewritten in place (+ `split-button.spec.tsx`,
  `apps/storybook/src/split-button.stories.tsx` updated).
- `packages/ui/src/components/permission.tsx` - new (+ `permission.spec.tsx`,
  `apps/storybook/src/permission.stories.tsx`). Composed layer, beside `tool.tsx`. Never
  `components/ui/*`.
- Subpaths: `./components/split-button` (breaking rewrite), `./components/permission` (additive).
