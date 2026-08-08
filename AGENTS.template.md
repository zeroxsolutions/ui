# AGENTS.md

<!--
SCAFFOLD TEMPLATE - copy to the repo root as `AGENTS.md` and fill every <...>.
Claude Code reads `CLAUDE.md`; point it at this file (copy or symlink) so both
harnesses share one concrete layer.

This file is the repo's ONE concrete layer. The rules under `.agents/rules/*` are
generic and identifier-free; every concrete name and per-repo decision lives HERE
and nowhere else. Do NOT restate a generic rule in this file - name the choice and
point to the rule by slug if context helps. Delete these comments after filling.
-->

<one line: what this repo is - product / domain - and its runtime (e.g. Cloudflare Workers)>.

## This project's choices

Where the generic rules name options, this repo selects. Name the choice and cite
the rule that defines the options - do not re-explain the rule:

- **Database** - `<Postgres via Cloudflare Hyperdrive (postgres-js) | Cloudflare D1>` (see `db-drizzle-hyperdrive-or-d1`).
- **Frontend** - `<React Router SPA | Next.js App Router>`, on which app(s) (see `fe-deploy-by-render-mode`).
- **Topology** - `<modular monolith | microservices>`: how the backend package(s) and worker app(s) are split, and where the edge gateway(s) sit (see `bounded-context-transport-agnostic`, `structure-apps-packages`).
- **API contract** - `<specs-first | code-first>`; in-repo service-to-service = `hc<AppType>` over service bindings, browser / out-of-repo = OpenAPI codegen (see `contract-derive-schema`, `contract-hc-and-codegen`).
- **Wire standard** - `<JSON:API v1.1 | ...>`, and the casing its query and field names use (see `hono-openapi-routes`, `error-domain-code-gateway-maps`).
- **Self-address spelling** - `</me/... | /<entity>/self | a singular /<entity>>` (see `trust-boundary-and-exposure`).
- **Auth provider** - `<provider>` (see `auth-verify-server-side`).
- **House libraries** - the `@<scope>/*` packages this repo composes, and what each owns (see `lib-house-toolkits`, `house-libs-catalog-scope`).
- **Test tooling** - `<unit runner>` for every project and `<e2e runner>` per app kind; name any project that deviates and what closes the split (see `run-through-nx`, `e2e-pairs-each-app`, `gen-via-generator`).
- **Deploy trigger** - `<a CI job invoking the nx target | Cloudflare Workers Builds>` (see `deploy-via-nx-per-env`, `cd-deploy-through-nx-target-per-env`).
- **Terraform credential channel** - `<environment | file>`, and the guardrails that channel commits you to (see `tf-state-and-secrets`).

## Workspace

The concrete inventory - every `apps/*` and `packages/*` project and its target
role. This is the only place these names are authoritative.

- `apps/<app>` (+ `<app>-e2e`) - `<kind + role>`.
- `packages/<lib>` (`@<scope>/<lib>`) - `<role>`.
- `<standalone non-nx roots, e.g. iac/>` - `<toolchain>`.

## Configuration

Every environment input, its mechanism, and what its absence breaks (see
`env-input-inventory`). The inputs live in five mechanisms with five owners and
no command enumerates the union, so this table is the only complete view - a
green deploy is not evidence an environment is configured.

Fill **Absent means** with the observable symptom, never "it is required": the
column exists to separate a loud failure from a silent wrong answer.

| Input | Consumer | Mechanism | Required | Absent means |
| --- | --- | --- | --- | --- |
| `<NAME>` | `<app or worker>` | wrangler `vars` | yes/no | `<observable symptom>` |
| `<NAME>` | `<app or worker>` | worker secret | yes/no | `<observable symptom>` |
| `<NAME>` | `<app>` build | CI env variable | yes/no | `<observable symptom>` |
| `<NAME>` | deploy job | CI env secret | yes/no | `<observable symptom>` |

Mechanisms, and who owns each:

- **wrangler `vars`** - committed in the worker's config, reviewed in the diff, takes effect on the next deploy. Anything a client can already read belongs here, not in the secret store.
- **worker secret** - `wrangler secret put <NAME> --env <env>`, set by a human once per worker per environment, effective immediately on the deployed worker. Never CI, never `vars`.
- **CI environment variable** - the only channel that reaches a **build**; a value the bundler inlines cannot come from a runtime binding. Reaches the build only if the workflow forwards it.
- **CI environment secret** - credentials the deploy job itself needs. Scoped per environment, never repository-wide.
- **terraform** - the platform resources bindings resolve against. A **precondition** applied by a human before the first deploy, not a pipeline step; nothing in the pipeline verifies it.

Environments: `<list them - they match the terraform workspaces and the CI
environment names exactly>`.
