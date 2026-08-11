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

The ZeroX Solutions UI SDK - a shadcn-style component/block **registry** and a
headless rich-text **editor core**, authored in an Nx + pnpm monorepo. No backend,
no workers; the deployables are a Next.js docs/registry app and its e2e sibling.

## This project's choices

Where the generic rules name options, this repo selects. Name the choice and cite
the rule that defines the options - do not re-explain the rule:

- **Database** - `<Postgres via Cloudflare Hyperdrive (postgres-js) | Cloudflare D1>` (see `db-drizzle-hyperdrive-or-d1`).
- **Frontend** - `<React Router SPA | Next.js App Router>`, on which app(s) (see `fe-deploy-by-render-mode`).
- **Topology** - `<modular monolith | microservices>`: how the backend package(s) and worker app(s) are split, and where the edge gateway(s) sit (see `bounded-context-transport-agnostic`, `structure-apps-packages`).
- **API contract** - `<specs-first | code-first>`; in-repo service-to-service = `hc<AppType>` over service bindings, browser / out-of-repo = OpenAPI codegen (see `contract-derive-schema`, `contract-hc-and-codegen`).
- **Auth provider** - `<provider>` (see `auth-verify-server-side`).
- **CI/CD** - `<a CI job invoking the wrangler:deploy nx target | Cloudflare Workers Builds>`; which environments exist, what triggers each, and what promotes between them. The shipped `cd.yml` gates on the branch name (only `development` and `production` deploy) because a free-plan private repository cannot enforce a required reviewer on an environment; if this account's plan changes, move to the approval-gated shape and record that here (see `cd-deploy-through-nx-target-per-env`, `ci-nx-affected-gates`, `deploy-via-nx-per-env`).
- **Worker ownership** - `<wrangler owns the whole Worker (identity, code, bindings, routes, cron, domains) | Terraform owns cloudflare_worker identities + routes>`. The rule's default is the first (wrangler owns the Worker; Terraform owns only the platform services between deploys); the second is a reversal to record here with its measurements, because Cloudflare couples a Worker's identity/bindings/routes/cron with its code version and the provider's Optional+Computed attributes fight `wrangler deploy` (see `terraform-owns-infra-wrangler-deploys`).
- **Terraform credentials** - `<the environment channel (TF_VAR_* plus the backend's own credential variables) | credential-bearing files (iac/backend.config, iac/<env>.tfvars, gitignored, with committed *.example siblings)>`. The rule is channel-agnostic: pick one and name its guardrails here. The file channel is the common choice - it runs on a fresh machine with no `direnv` / `op run` wrapper - and its cost is that terraform copies whatever `-backend-config` and `-var-file` receive into `.terraform/` and into any saved plan file, so every credential lands in plaintext on disk. Choosing it means committing to its guardrails and naming them here: never `-out` a plan, treat `.terraform/` as credential-bearing, and rotate on exposure (see `tf-state-and-secrets`).

## Workspace

A UI SDK monorepo (Nx + pnpm). The shadcn-style ui **registry** and the editor
**chrome** are authored inside the registry-ui app; the editor **core** is a
standalone headless package. This is the only place these names are authoritative.

- `apps/registry-ui` (`@zeroxsolutions/registry-ui`) - Next.js app **and** the
  shadcn registry host. The ui registry source lives at
  `apps/registry-ui/registry/bases/base-ui/{ui,components,blocks,pages,examples,hooks,lib}/`
  (organized by **base**; no `<style>/` folder - style is a token); the editor
  chrome lives at `apps/registry-ui/registry/bases/base-ui/editor/`. `registry.json`
  + `components.json` sit at the app root; the `shadcn-build` target emits `public/r/`.
  `@zeroxsolutions/ui` is **DELETED** - its source became this registry.
- `apps/registry-ui-e2e` (`@zeroxsolutions/registry-ui-e2e`) - Playwright e2e for
  registry-ui.
- `packages/editor-core` (`@zeroxsolutions/editor-core`) - the **framework-free**,
  published rich-text editor engine: Tiptap/ProseMirror behind an engine-free
  `IEditor` contract, with zero `react` (no runtime, no types, no peer dep) and no
  `@tiptap/react`/`@zeroxsolutions/ui` imports. The React chrome
  (`<Editor>`/`<Viewer>`, menus, toolbar, theme, built-in features, and the React
  serialization walker + `toReact` codec typing) ships as **registry items**, not
  from this package; the chrome injects a `NodeViewRenderer` at mount.
- `packages/icons` (`@zeroxsolutions/icons`) - vendored SVG icon set.
- `packages/fluent-emoji` (`@zeroxsolutions/fluent-emoji`) - Fluent emoji set.

Workspace root (`@zeroxsolutions/source`) - the Nx workspace itself (tooling
devDependencies, husky, `local-registry`); not a shipped package. Standalone non-nx
roots: none.
