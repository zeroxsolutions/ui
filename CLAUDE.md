# CLAUDE.md

<!--
SCAFFOLD TEMPLATE — copy to the repo root as `AGENTS.md` and fill every <...>.
Claude Code reads `CLAUDE.md`; point it at this file (copy or symlink) so both
harnesses share one concrete layer.

This file is the repo's ONE concrete layer. The rules under `.claude/rules/*` are
generic and identifier-free; every concrete name and per-repo decision lives HERE
and nowhere else. Do NOT restate a generic rule in this file — name the choice and
point to the rule by slug if context helps. Delete these comments after filling.
-->

<one line: what this repo is — product / domain — and its runtime (e.g. Cloudflare Workers)>.

## This project's choices

Where the generic rules name options, this repo selects. Name the choice and cite
the rule that defines the options — do not re-explain the rule:

- **Database** — `<Postgres via Cloudflare Hyperdrive (postgres-js) | Cloudflare D1>` (see `stack-db-hyperdrive-or-d1`).
- **Frontend** — `<React Router SPA | Next.js App Router>`, on which app(s) (see `route-mode-spa-or-app-router`).
- **Topology** — `<modular monolith | microservices>`: how the backend package(s) and worker app(s) are split, and where the edge gateway(s) sit (see `core-transport-agnostic`, `structure-apps-vs-packages`).
- **API contract** — `<specs-first | code-first>`; in-repo service↔service = `hc<AppType>` over service bindings, browser / out-of-repo = OpenAPI codegen (see `contract-reuse-schema`, `contract-share-schema-not-app-type`).
- **Auth provider** — `<provider>` (see `stack-verify-auth-server-side`).

## Workspace

The concrete inventory — every `apps/*` and `packages/*` project and its target
role. This is the only place these names are authoritative.

- `apps/<app>` (+ `<app>-e2e`) — `<kind + role>`.
- `packages/<lib>` (`@<scope>/<lib>`) — `<role>`.
- `<standalone non-nx roots, e.g. iac/>` — `<toolchain>`.
