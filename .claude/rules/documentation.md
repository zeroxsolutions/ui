---
description: Documentation rules — folder structure, locked doc header, contextual body template, mandatory Surfaces map, edit-time reconcile protocol, task-completion changelog.
---

# Documentation rules

Applies to everything under `docs/`. This rule is loaded every session; follow
it exactly. Do not reverse-engineer conventions from the current `docs/` tree —
it is pending refactor and is not authoritative.

## Enforced conventions

1. **English only.** Write all doc content in English, even when the chat is
   Vietnamese or the file already contains Vietnamese prose.
2. **QA docs follow `docs/qa/STANDARD.md`.** It is the single source of truth
   for QA documentation — do not fork it or invent a per-topic structure.
3. **No archaeology comments.** When removing content, delete it. Never leave
   `// X removed because Y` / "previously this did Z" notes in docs or source —
   the commit message owns history.
4. **Every feature and concept has a test-case file.** Each initiative carries
   a `test-cases/` folder (format fixed by the QA standard). One file per
   feature, one per concept doc — an absent test-case file is a gap, like an
   untested surface, not an omission to ignore.

## Scope — the doc lives in the owning repo's `docs/`

A doc belongs in the `docs/` of the repo whose code the work actually
implements — not whichever repo the session happens to start in. A repo's
`docs/` documents only that repo's implementation.

- Implementation / design of one repo's code → that repo's `docs/<initiative>/`.
- Work spanning repos → the repo that owns the load-bearing implementation;
  cross-link the rest, never duplicate.
- Never write another repo's implementation doc into this repo's `docs/`
  because it is convenient. If the owning repo's `docs/` is not in the working
  tree, say so and stop — do not fall back to the local root.

## Folder structure

One folder per initiative or feature, directly under `docs/`, kebab-case. No
`features/` bucket. Test cases live inside the initiative they belong to
(`<initiative>/test-cases/`); their format is fixed by the QA standard, which
with the QA index is all that stays under `docs/qa/`.

```
docs/
├── README.md                     # Index: one line per area + status (like MEMORY.md)
│
├── <initiative>/                 # kebab-case, one initiative/feature per folder
│   ├── README.md                 # LOCKED header + contextual body (see below)
│   ├── design.md                 # Architecture/design (split if > ~400 lines)
│   ├── concepts/<concept>.md     # Deep dives on core concepts
│   ├── test-cases/               # QA contracts — format per qa/STANDARD.md
│   │   ├── README.md             # shared scope/env/exit (STANDARD.md §3)
│   │   ├── <feature>.md          # one per feature
│   │   └── <concept>.md          # one per concepts/<concept>.md
│   ├── decisions/                # ADR, append-only: NNNN-<kebab-title>.md
│   ├── changes/                  # One entry per completed agent task
│   │   └── YYYY-MM-DD-<task>.md
│   └── examples/                 # Copy-paste / runnable examples
│
└── qa/
    ├── STANDARD.md               # SSOT for test-case format — do not fork
    └── README.md                 # Index → each initiative's test-cases/
```

Adding a new folder under `docs/` requires adding one line to `docs/README.md`.

## LOCKED header — do not alter the structure

Every doc starts with this exact block. Agents fill the **values**; the
**shape** (keys, order, the `> Status:` line) is fixed and must not be edited,
reordered, or extended:

```markdown
---
status: draft | active | shipped | superseded
updated: <absolute date, e.g. 2026-05-15>
related: [[memory-slug]], [[other-slug]]
---

# <Title>

> Status: <same as frontmatter> · Updated <absolute date>
```

`related` links memory slugs (the auto-memory `name:` field) and/or sibling
docs. Use absolute dates only — never "today" / "last week".

## Contextual body template — fill from context

Below the locked header, the body is the contextual template. Populate it from
the **task** at hand, the **project rules** (`.claude/rules/*`), and **memory**
(`MEMORY.md` + linked memories). One feature = one doc. Adapt headings to fit,
but **`## Surfaces` is mandatory** — it is what stops the agent from fixing one
trigger and missing the others:

```markdown
## Problem
What forces this work; the constraint or gap. Link the driving memory/rule.

## Goals / Non-goals
Bullet list. Be explicit about what is out of scope.

## Surfaces  (trigger key: `<grep-able token>`)
Every place this feature is activated — one line each, as `path:line` + kind.
Kinds: UI entry · IPC channel · command/shortcut · store action · MCP tool ·
hook · route. Pick a trigger key that grep-matches all of them.
- UI    apps/.../Toolbar.tsx:88
- IPC   .../preload/icons.ts:14
- store .../stores/icon.ts:30

## Concepts
Links to `concepts/*` and memory `[[slug]]` this feature depends on.

## Design
The approach. Reference concrete files as `path:line`. Diagrams as needed.

## Decisions
Pointer to `decisions/` ADRs for anything load-bearing or reversible-with-cost.

## Open questions
Unresolved items, owner, blocking vs non-blocking.
```

## Editing a feature — never miss an activation point

A feature is usually wired at several surfaces; fixing one and missing the rest
is the failure this rule exists to prevent. Before changing any feature:

1. **Open its doc.** Read `## Concepts` (related concepts/memory) and the full
   `## Surfaces` list.
2. **Reconcile against code.** `grep` the trigger key across the repo. Every hit
   must already be in `## Surfaces` — if a hit is undocumented, the list is
   stale: add it now (the map self-heals through use).
3. **Fix every surface**, not just the one in front of you. If a change can't
   reach all surfaces, that is a finding to report, not a partial fix to ship.
4. **Record it** (see below).

When to touch docs — not only on task completion:

- Adding / removing / moving an activation point → update `## Surfaces` in the
  same change.
- Discovering an undocumented surface mid-task → add it immediately, before
  continuing.
- Feature behavior changes → update `## Concepts` / `## Design`.

## On task completion

When an agent finishes a task that touched an initiative, append a changelog
entry — do **not** rewrite history elsewhere:

- Create `docs/<initiative>/changes/YYYY-MM-DD-<short-task>.md`.
- Update the initiative `README.md` `status:` / `updated:` values if the state
  changed (e.g. `active` → `shipped`). Do not change the header's shape.
- A load-bearing decision also gets an append-only `decisions/NNNN-*.md`.

`changes/` entry format:

```markdown
---
date: <absolute date>
task: <one-line task summary>
---

- **What changed:** …
- **Why:** … (link the driving rule/memory)
- **Surfaces reconciled:** trigger key `…` — N hits, all fixed / list gaps
- **Follow-ups:** … or "none"
```
