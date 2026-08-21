# CLAUDE.md

<!--
SCAFFOLD TEMPLATE - copy to the repo root as `CLAUDE.md` and fill every <...>.

This file is the repo's ONE concrete layer. The rules under `.claude/rules/*` are
generic and identifier-free; every concrete name and per-repo decision lives HERE
and nowhere else. Do NOT restate a generic rule in this file - name the choice and
point to the rule by slug if context helps. The same holds for an installed
package's API: the rules and the packages are both already reachable, so copying
either one in costs tokens on every read and rots on their next release.
Delete these comments after filling.

Every slug cited below is a real file in `.claude/rules/`; if one does not resolve,
the template is stale - fix it here rather than inventing a nearby name.
-->

<one line: what this repo is - product / domain - and its runtime (e.g. Cloudflare Workers)>.

## This project's choices

Where the generic rules name options, this repo selects. Name the choice and cite
the rule that defines the options - do not re-explain the rule. A choice that
DEVIATES from a rule says so, and states the cost it accepts.

These bullets are the choices a repo cannot start without, not the full set: many
rules delegate one to this file, and each lands here the first time the repo meets
that concern. Reading the list as the inventory is what puts an empty slot in it.

- **Database** - `<Postgres via Cloudflare Hyperdrive (postgres-js) | Cloudflare D1>`, and `<one DB per service | one shared>` (see `db-drizzle-hyperdrive-or-d1`, `db-per-service`).
- **Frontend** - `<Next.js App Router | React Router SPA | none>`, on which app(s), and how it deploys (see `fe-deploy-by-render-mode`).
- **Topology** - `<modular monolith | microservices>`: how the backend package(s) and worker app(s) are split, and where the edge gateway(s) sit (see `bounded-context-transport-agnostic`, `structure-apps-packages`, `boundary-worker-composition-only`).
- **Identifiers** - the id representation at each boundary, and any deviation from `id-uuidv7`.
- **Auth** - `<provider>`, where it runs, and whether the global gate rejects or resolves-only (see `auth-verify-server-side`, `mw-single-global-gate-per-route-rbac`).
- **API contract** - who owns the client-facing contract, and how its only in-repo client types itself off the gateway's app type (see `contract-typed-client`); service-to-service is `hc<AppType>` over bindings either way.
- **Wire format** - `<a hypermedia envelope (JSON:API v1.1 ...) | a plain projection>`, applied uniformly across the surface, and the casing its query and field names use; name what the shared toolkit supplies and what is NOT built (see `hono-openapi-routes`, `contract-derive-schema`).
- **Build & test tooling** - the bundler, unit-test runner, linter and e2e runner every generator must be passed; name any project that deviates and what closes the split (see `gen-via-generator`, `run-through-nx`, `e2e-pairs-each-app`).
- **Deploy trigger** - `<a CI job invoking the nx target | Cloudflare Workers Builds>` (see `deploy-via-nx-per-env`, `cd-deploy-through-nx-target-per-env`).
- **Terraform credential channel** - `<environment | file>`, and the guardrails that channel commits you to (see `tf-state-and-secrets`).

## Workspace

The concrete inventory - every `apps/*` and `packages/*` project and its target
role. This is the only place these names are authoritative.

- `apps/<app>` (+ `<app>-e2e`) - `<kind + role>`.
- `packages/<lib>` (`@<scope>/<lib>`) - `<role>`.
- `<standalone non-nx roots, e.g. iac/>` - `<toolchain>`.

## Configuration

One row per environment input - required by `env-input-inventory`, because no
single command enumerates the set and a missing input fails at the first request
rather than at the deploy. Fill **Absent means** with the observable symptom, never
"it is required": that column is what separates a loud failure from a silent wrong
answer, and it is the reason the table earns its keep.

| Input | Consumer | Mechanism | Required | Absent means |
| --- | --- | --- | --- | --- |
| `<NAME>` | `<app or worker>` | `<wrangler vars \| worker secret \| CI env secret \| CI env variable \| terraform \| wrangler deploy>` | `<yes/no>` | `<what breaks, and whether the deploy still goes green>` |

Environments: `<list them - they match the terraform workspaces and the CI
environment names exactly>`.

## House libraries (catalog)

The org-scoped assets that own a concern here, so a rule saying "prefer the house
library" resolves to a name. **One row per asset - if you are writing a paragraph,
you are restating the package.** Exports, subpaths, symbols and versions live in the
installed artifact and are version-current where this file is not; the only column
you cannot get from there is the last one (see `house-libs-catalog-scope`,
`lib-house-toolkits`).

```sh
# pnpm does not hoist scoped deps to the repo root - read from a project that depends on one:
cat <project>/node_modules/@<scope>/<lib>/README.md
```

| Asset | Concern | Used by | This repo's choice |
| --- | --- | --- | --- |
| `@<scope>/<lib>` | `<what it owns>` | `<which tier may import it>` | `<the option this repo picked among those the asset offers, or ->` |
| `<an asset delivered as vendored source, e.g. a component registry>` | `<what it owns>` | `<tier>` | `<no catalog: entry - its tool owns the deps it installs>` |
