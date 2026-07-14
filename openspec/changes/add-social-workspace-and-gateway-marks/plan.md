## Scope

Add 48 vendored marks to `@zeroxsolutions/icons` `brands/` across four clusters —
social/consumer (18), workspace/collaboration (19), mail/office (6), and the
Cloudflare AI Gateway provider gap (5) — in one flat `brands/` category. Each mark
follows an existing authoring shape (Type M monochrome → base/`.Color`/`.Mono`/
`.Avatar`; Type C full-color → base/`.Color`) and reuses the shipped `makeAvatar` /
`useFillIds` helpers — no new composition module. Covers the whole change
end-to-end.

## Covers

`1.1`–`1.4`, `2.1`–`2.2`, `3.1`–`3.2`, `4.1`–`4.2`, `5.1`–`5.2`, `6.1`–`6.3`,
`7.1`–`7.2`, `8.1`–`8.6`; Validation Focus: green lint/build/test, glob smoke test
(non-empty svg + `size` + no-shared-id incl. gradients), no new runtime dependency,
AI Gateway 24-provider coverage, per-cluster + Type-C visual spot-check.

## Plan Type

full

## Execution Strategy

standard

## Ordered Steps

1. **Manifest + type matrix** — build the scratchpad manifest (per mark: Type M/C,
   source, `colorPrimary`, `<Name>Mark` symbol); resolve the Instagram flat/gradient
   call and the `cartesia`/`parallel`/`xai` source line; confirm reuse of
   `makeAvatar` + `useFillIds` (no new module) (tasks 1.1–1.4).
2. **Confirm the glob smoke test covers the new files first** — verify
   `brand-marks.spec.tsx` globs `./*.tsx`, excludes `internal/`, and needs no edit;
   bump the count floor if present. It stays green as marks land (tasks 6.1–6.3).
3. **Vendor marks in parallel by cluster** — each cluster emits disjoint
   `src/brands/<name>.tsx`: Type M via the `bitbucket` shape + `makeAvatar`; Type C
   (`microsoft-teams`, `outlook`, `onedrive`) as full-color base + `.Color` with ids
   through `useFillIds` and **no** `.Mono`/`.Avatar` (tasks 2.x, 3.x, 4.x, 5.x).
4. **Integrate docs + catalog** — one owner updates the README brands table (+
   attribution, disclaimer, count, AI Gateway coverage note) and the glob-driven
   Storybook catalog after vendoring converges (tasks 7.1–7.2).
5. **Validate** — lint/build/test green, exports-map + variant-typing smoke import,
   AI Gateway 24-coverage check, visual spot-check, no-new-dependency +
   existing-marks-unchanged check, rule audit (tasks 8.1–8.6).

## Validation Per Step

1. Manifest lists all 48 with a unique `<Name>Mark` symbol, a resolved type, source,
   and `colorPrimary`; open questions (Instagram, cartesia/parallel/xai) decided.
2. `nx test @zeroxsolutions/icons` passes with the current set; the glob test is
   confirmed to auto-include `src/brands/*.tsx`.
3. After each cluster batch: `nx build` emits `dist/brands/<name>.js` + `.d.ts`; the
   smoke sweep stays green (non-empty svg, `size` applied); no id collisions,
   including the Type-C gradient marks.
4. README table + Storybook catalog render every new mark and its available variants;
   both glob/data-driven (no per-mark hand edit drifts).
5. `nx run-many -t lint build test` green; sample subpaths + variants import and type
   (`brands/microsoft-teams.Mono` is a type error); all 24 AI Gateway providers
   resolve; visual spot-check evidence retained; `package.json` shows no runtime dep;
   existing ~130 marks still render.

## Files / Owners

- `packages/icons/src/brands/<name>.tsx` — 48 new compound mark components (parallel, by cluster)
- `packages/icons/src/brands/brand-marks.spec.tsx` — glob smoke test (verify-only; expected no edit)
- `packages/icons/README.md` — brands table + attribution + disclaimer (integration owner)
- `apps/storybook/src/icons/brand-marks.stories.tsx` — catalog (integration owner)
- scratchpad only — the throwaway vendoring pipeline (never committed)

## Completion Checkpoint

All 48 marks resolve at `brands/<name>` and render; each exposes exactly its
type's variant surface; no shared internal SVG ids; `brands/` covers all 24 AI
Gateway providers; `nx lint build test @zeroxsolutions/icons` green; no new runtime
dependency; README + Storybook updated with attribution + disclaimer; visual
spot-check recorded.

## Completion Verification

Verification Mode is **retained-recommended** — the structure-only smoke test cannot
judge appearance. Before presenting complete: render each cluster plus every Type-C
mark (`microsoft-teams`, `outlook`, `onedrive`, and gradient `instagram` if chosen)
in Storybook / `storybook-static` driven in a real browser, compare against source
artwork, and retain the evidence (screenshot or note per the "don't claim UI done
without a browser check" standing rule). jsdom output alone does not satisfy this.

## Delegation Units

- **Unit A — social/consumer** (tasks 2.1–2.2): owns `src/brands/{facebook,messenger,instagram,threads,x,linkedin,youtube,tiktok,reddit,pinterest,snapchat,mastodon,bluesky,whatsapp,telegram,signal,wechat,line}.tsx`.
- **Unit B — workspace/collab** (tasks 3.1–3.2): owns `src/brands/{slack,discord,microsoft-teams,zoom,google-meet,notion,figma,trello,asana,jira,confluence,linear,miro,airtable,monday,clickup,dropbox,loom,calendly}.tsx`.
- **Unit C — mail/office** (tasks 4.1–4.2): owns `src/brands/{gmail,google-drive,google-docs,google-calendar,outlook,onedrive}.tsx`.
- **Unit D — AI Gateway gap** (tasks 5.1–5.2): owns `src/brands/{cartesia,parallel,bedrock,vertexai,xai}.tsx`.
- Each unit writes back only its own mark files; the integration owner runs the smoke sweep, README, Storybook, and final validation. Run one cluster first (Unit A) to validate the Type-M/Type-C rule before dispatching B–D.

## Parallel Units

Units A–D may run concurrently — disjoint file sets, no shared-state edits (the smoke
test and `./*` exports map are glob/pattern-driven). The integration owner (docs +
catalog + validation, steps 4–5) runs after A–D converge.

## Isolation Boundaries

- File boundary: each unit writes only the mark files it owns under `src/brands/`; no
  unit edits `internal/`, `brand-marks.spec.tsx`, the README, or the Storybook story.
- Validation boundary: a unit self-checks its marks render + build; the integration
  owner owns the cross-set no-shared-id sweep and green gate.
- Non-overlap rule: shared files (README, Storybook catalog, `package.json`) are
  touched only in the serialized integration step, never by a parallel unit.

## Execution Notes

<!-- append apply-time observations here -->

## Manual Adjustments

<!-- none -->
