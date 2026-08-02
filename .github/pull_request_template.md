<!--
Lint, build, test, secret-scanning and project scaffolding are already hard-gated
by the pre-commit hook and the PreToolUse hooks - a commit that failed them could
not exist. This template therefore asks only for what no gate can check.
-->

## Change

<!-- Which OpenSpec change does this implement? Path under openspec/changes/, and
     the task IDs it closes. Write "none" for work that needs no change proposal,
     and say why in one line. -->

- Change:
- Tasks closed:

## Rule audit

<!-- Required by `green-before-commit`: walk .agents/rules/*.md against the staged
     diff at commit time and state the result. "Compliant" is a valid answer; so
     is a list of what you fixed. An empty section means the audit did not happen. -->

## Risk surface

<!-- Tick only what this diff actually touches, and add one line of detail for
     each ticked item. An untouched box is the useful signal. -->

- [ ] Infrastructure (`iac/`) - a resource is added, changed, or removed
- [ ] Database schema or a migration
- [ ] Client-facing contract - a wire shape, route, or the emitted OpenAPI document
- [ ] A shared/published package's public surface
- [ ] Deployment config, bindings, or secrets
- [ ] None of the above

Detail:

## Notes for the reviewer

<!-- Optional: what you are unsure about, what you deliberately left out, or the
     one place you would look first if this broke. -->
