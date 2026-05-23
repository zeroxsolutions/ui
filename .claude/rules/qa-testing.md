---
description: QA rules — cover every feature surface, test via MCP and via code, ground expected behavior in real research.
---

# QA rules

Applies whenever a feature is built, fixed, or verified. QA documents
themselves follow `docs/qa/STANDARD.md`.

## Cover every surface

Test cases for a feature must exercise **every entry in its `## Surfaces` map**
(see `documentation.md`), not just the happy path at one trigger. A surface
with no test is an untested surface — report it as a gap, don't ignore it.

## Test via MCP and via code

Both, not either:

- **MCP** — drive the real running surface through the MCP tools (browser /
  Playwright for UI, the app's own MCP for canvas/editor). Verifies what the
  user actually hits.
- **Code** — a unit/integration test for the logic underneath, so regressions
  fail in CI without a human. A bug fix lands with a code test that fails
  before the fix and passes after.

## Ground logic in real research

Expected behavior, formulas, spec/protocol details, and edge cases must be
verified against real external sources (web search / official docs) — never
assumed or invented. Cite the source in the test or QA doc. No "this is
probably how X works" — confirm it first.
