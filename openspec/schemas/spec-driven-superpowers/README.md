# spec-driven-superpowers

This directory contains the reusable `spec-driven-superpowers` OpenSpec schema.

Contents:

- `schema.yaml`: workflow contract
- `templates/*.md`: artifact structure

The schema keeps the default OpenSpec command surface and strengthens workflow
behavior through:

- `review.md` as a readiness gate
- `plan.md` as an execution driver
- companion-file conventions for `brainstorm.md` and `verification.md`
- instruction-level preference for compatible superpowers skills

Dependency model:

- OpenSpec is required because this schema assumes the OpenSpec artifact and command model.
- superpowers is required for full instruction-bridge behavior.
- without superpowers, the schema still works in stronger fallback-oriented `schema-only` mode.

See the repository root docs for adoption and mode guidance.
