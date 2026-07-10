## Readiness Decision

ready with conditions

The contract (spec + rule amend) and **Phase 1 (chrome)** are ready to implement.
**Phase 3 (node-view shells)** is conditional on the `NodeViewContent`
compatibility spike (D-R1); it must not start until that spike resolves. Phase 2
is ready but may land in a later apply cycle.

## Execution Mode

tdd-preferred

`chrome.spec.tsx` already encodes the chrome behaviors; each surface refactor keeps
those specs green (extend, don't weaken) and adds cases for the new composition.

## Verification Mode

retained-recommended

Keep the browser probes used in prior verification (positioning/flip, `/` trigger,
bubble-over-text, keyboard nav) as retained non-regression checks alongside the
unit specs — the refactor changes *how* surfaces render, so observable-behavior
parity is the core acceptance signal.

## Debug Mode

standard

## Delegation Mode

subagent-eligible

## Parallelization Mode

serial-only

Phase 1 surfaces share the new floating-shell primitive, `chrome.spec.tsx`, and
`styles.css`; parallel edits would collide. Refactor one surface per commit,
green between each (shared-shell first, then slash → bubble → toolbar → block).

## Worktree Mode

same-tree

## Branch Finish Mode

standard

## Review Status

not-requested

## Blocked By

none

(Phase 3 is *conditional* on the D-R1 spike, not blocked; the contract and Phase 1
have no blockers.)

## Validation Focus

- Spec scenarios in `editor-ui-composition` hold, especially "no re-implementation"
  (no `bg-popover border shadow` container survives; no hand-rolled command list)
  and "bespoke confined to positioning/focus shell".
- `nx run-many -t build test` green; `assert-engine-free-dts` finds no engine types
  in the public `.d.ts` after each surface swap.
- Behavior parity via the retained browser probes: inline `/` trigger stays
  visible, filter + delete-on-select, viewport flip near the bottom edge, bubble
  only over a text (non-node) selection, keyboard nav (↑/↓, Enter/Tab, Esc).
- The amended `ui-from-design-system` contains no project/component names (grep it
  clean) so it is safe to mirror to `classify`.

## Key Risks

- **Node-view engine compatibility** (Phase 3) — `Alert`/`Collapsible` may not host
  an editable `NodeViewContent`; gated by the D-R1 spike, fallback is a documented
  bespoke-exception shell.
- **cmdk focus ownership** — headless `Command` must not auto-focus an input and
  steal the editor's focus; fallback is `item` + `scroll-area` (still design-system).
- **Positioning parity** — Base UI collision-avoidance must reproduce the current
  flip-above-near-bottom; verify against the viewport probe.
- **Rule drift vs `classify`** — the amend diverges from origin until mirrored;
  accepted (sync is a non-goal here).
