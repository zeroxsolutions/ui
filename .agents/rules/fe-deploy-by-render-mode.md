## Deploy Each Frontend App By Its Render Mode
`[MEDIUM]` `fe-deploy-by-render-mode`

A frontend app's deploy runtime follows its render mode (chosen per app — see `fe-app-structure`), yet the deploy always runs through an `nx` target (see `deploy-via-nx-per-env`). The render mode decides whether there is a server to run at all.

A client-rendered SPA has **no server runtime**: it builds its Vite `dist/` and ships it as static assets (Cloudflare Pages, or a Worker with a static-assets binding), with **no `nodejs_compat` and no Hyperdrive** — it reaches data only over the API (see `fe-data-via-api`), so it needs no bindings and no binding types.

A Next.js App Router app is SSR, so it deploys through the `@opennextjs/cloudflare` adapter — a Worker on `nodejs_compat` with bindings/secrets — and still needs a `wrangler:typegen` target emitting `cloudflare-env.d.ts` (`CloudflareEnv`) even though it ships via OpenNext, not `wrangler deploy` (see `worker-wrangler-config`). Its moving parts (verify the exact fields against the adapter's own docs — versions drift) are `open-next.config.ts` (`defineCloudflareConfig({ … })`), a `next.config.ts` that calls `initOpenNextCloudflareForDev()`, and a `wrangler.jsonc` with `main: ".open-next/worker.js"`, an `assets` binding, `nodejs_compat`, and a recent `compatibility_date`, with `.open-next/` gitignored.

**Incorrect — a Next app deployed straight to Workers:**
```ts
// apps/<app> (Next App Router)
wrangler deploy   // 🔴 Next doesn't run on Workers natively — it needs the OpenNext adapter
```
**Correct — adapter for Next, static assets for the SPA, each via nx:**
```ts
// SPA:  nx build           → Vite dist/ served as static assets (no nodejs_compat, no Hyperdrive)
// Next: nx wrangler:deploy → opennextjs-cloudflare build && deploy (Worker on nodejs_compat)
```
Deploying the wrong runtime either ships a dead SSR app as static files or tries to run Next on a runtime it doesn't support.

Reference: see `fe-app-structure` · `worker-wrangler-config` · `deploy-via-nx-per-env` · `fe-data-via-api`
