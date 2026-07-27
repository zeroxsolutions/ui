## Store UTC, Resolve Locale Per Request, Hardcode No Market Value
`[MEDIUM]` `stack-utc-locale-per-request`

Persist every timestamp as a **UTC** instant. Resolve display **timezone + locale per request** - from the org default with an optional per-user override (`lib/i18n`) - never baked in at the source; recurring schedules (RRULE) anchor to the **org timezone**. Externalize all UI strings through the project's chosen i18n library - **`next-intl`** for a Next.js App Router app, **`react-i18next`** for a plain React SPA (the concrete pick per app lives in `CLAUDE.md`) - and hardcode **no** market-specific value (locale, currency, timezone). For `next-intl` under a non-locale middleware such as Clerk, run it without i18n routing. Storing UTC and resolving locale at the edge keeps the platform international - a hardcoded market forks the codebase per market.

**Incorrect - locale/timezone baked in at the source, a hardcoded string:**
```ts
const now = new Date().toLocaleString('vi-VN');   // 🔴 tz + locale fixed at the source
const label = 'Điểm danh';                          // 🔴 hardcoded UI string
```
**Correct - persist UTC, resolve per request, externalize strings:**
```ts
const when = utcInstant;                            // ✅ store the UTC instant
// resolve tz + locale per request (org default + optional user override)
t('attendance.title');                             // ✅ next-intl | react-i18next
```

Reference: [next-intl](https://next-intl.dev), [react-i18next](https://react.i18next.com), see `CLAUDE.md` (the per-app i18n library pick)
