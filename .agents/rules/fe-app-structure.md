## Generate Each Frontend App and Structure It by Its Render Mode
`[MEDIUM]` `fe-app-structure`

A frontend app is **React 19** in exactly one render mode, named per app in `CLAUDE.md`: a **React Router SPA** (client-rendered, built with Vite via `@nx/react:application`, routing owned by the React Router data router) **or** a **Next.js App Router** app (SSR, built via `@nx/next:application`, routing owned by Next's file-based segments). The mode is a fork through the whole stack — generator, source layout, providers, deploy runtime — so pick it before scaffolding, and never bolt React Router onto a Next app (Next owns its routing). **Generate the project with the mode's nx generator**, never hand-create it, and adjust it through generator options.

Organize source into the mode's standard layout so route modules stay thin. The SPA `src/` is `main.tsx` (entry that wraps the app in providers), `app/` (route tree + shell), `app/routes/` or `screens/` (one thin module per route composing design-system components), `components/` (app-specific composed pieces), and `lib/` (API client, query keys, hooks, helpers). Next uses the framework's own structure (`app/layout.tsx`, `app/page.tsx`, nested segments, `loading.tsx` / `error.tsx`), pages via `@nx/next:page`. A route module composes UI and calls `src/lib`; shared logic lives in `src/lib`, never inline in a route. Server state flows through **React Query**, not a hand-rolled fetch-and-store.

Wire the app-wide providers **once at the entry** — `main.tsx` for the SPA, a `"use client"` providers module imported by `app/layout.tsx` for Next: one `QueryClient` for the whole app (never `new`ed per render), the theme provider toggling the `.dark` class the design system's dark variant keys off, and — SPA only — the `RouterProvider`. Read per-environment client config (API base URL, auth-provider web config) from **build-time env vars in one client module** — Vite `import.meta.env.VITE_*` for the SPA, `process.env.NEXT_PUBLIC_*` for Next — never hardcoded; only that public prefix reaches the browser bundle, so keep secrets server-side.

**Incorrect — routers fighting, fetch-and-store, a per-render client, a hardcoded env value:**
```tsx
// Next App Router app
app/layout.tsx wrapping <BrowserRouter>…</BrowserRouter>   // 🔴 two routers fighting
useEffect(() => { fetch('/api/x').then(setX); }, []);      // 🔴 hand-rolled fetch-and-store
<QueryClientProvider client={new QueryClient()}>          // 🔴 a fresh client per screen/render
const API_URL = 'https://api.prod.example.com';           // 🔴 hardcoded per-env value
```
**Correct — generated project, providers once, build-time config, React Query:**
```tsx
nx g @nx/react:application @scope/<app>          // ✅ the mode's generator, never hand-created
<QueryClientProvider client={queryClient}>       // ✅ one client for the app
  <ThemeProvider>                                {/* toggles .dark */}
    <RouterProvider … />                         {/* SPA only; Next owns routing */}
  </ThemeProvider>
</QueryClientProvider>
const API_URL = import.meta.env.VITE_API_URL;    // ✅ build-time var (NEXT_PUBLIC_ for Next)
useQuery({ queryKey: ['x'], queryFn: getX });    // ✅ React Query for server state
```
Files and symbols follow the naming rules — a PascalCase component in a kebab-case file.

Reference: see `gen-via-generator` · `fe-data-via-api` · `fe-deploy-by-render-mode` · `naming-files-and-symbols`
