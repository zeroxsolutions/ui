## Deploy Each Frontend App By Its Render Mode
`[MEDIUM]` `fe-deploy-by-render-mode`

A frontend app's deploy runtime follows its render mode, yet the deploy always runs through an `nx` target (see `deploy-via-nx-per-env`). The render mode decides whether there is a server to run at all — and that in turn picks the Cloudflare product: **Pages** for a static build, **Workers** for a server runtime.

A client-rendered SPA — or a Next.js app exported static (`output: 'export'`) — has **no server runtime**: it builds its static output (a Vite `dist/`) and deploys to **Cloudflare Pages** through an `nx` target wrapping `wrangler pages deploy <dir>`, with `pages_build_output_dir` pointing at that build dir. It runs with **no `nodejs_compat` and no Hyperdrive** — it reaches data only over the gateway API, so it needs no bindings and no binding types. A client-side router needs SPA-fallback routing so an unmatched path serves `index.html`.

A Next.js App Router app that keeps **SSR** (server components, server actions, dynamic rendering) is **not** a static build, so it stays on **Cloudflare Workers** through the `@opennextjs/cloudflare` adapter — a Worker on `nodejs_compat` with bindings/secrets — and needs a `wrangler:typegen` target emitting `cloudflare-env.d.ts` (`CloudflareEnv`) even though it ships via OpenNext, not `wrangler deploy` (see `worker-wrangler-config`). Cloudflare recommends Workers for a Next.js app with a server; reach for a static export to Pages only when the app genuinely needs no server. Its moving parts (verify the exact fields against the adapter's own docs — versions drift) are `open-next.config.ts` (`defineCloudflareConfig({ … })`), a `next.config.ts` that calls `initOpenNextCloudflareForDev()`, and a `wrangler.jsonc` with `main: ".open-next/worker.js"`, an `assets` binding, `nodejs_compat`, and a recent `compatibility_date`, with `.open-next/` gitignored.

**Incorrect — a static SPA pushed to a server runtime, or an SSR Next app forced onto Pages:**
```ts
wrangler deploy        // 🔴 a static SPA has no server — deploy to Pages, not a Worker runtime
wrangler pages deploy  // 🔴 an SSR Next app can't run as static Pages output — it needs the OpenNext Worker
```
**Correct — Pages for static, Workers/OpenNext for SSR, each via nx:**
```ts
// SPA / static:  nx build           → static dist/ → nx wrangler:pages-deploy → Cloudflare Pages (no nodejs_compat)
// Next + SSR:    nx wrangler:deploy → opennextjs-cloudflare build && deploy   → Worker on nodejs_compat
```
Deploying the wrong runtime either ships a dead SSR app as static files or pays for a server the static app never needs.

Reference: see `worker-wrangler-config` · `deploy-via-nx-per-env`
