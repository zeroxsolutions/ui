## 1. Confirm assumptions (readiness conditions)

- [x] 1.1 Inspect the built `dist/` of `@zeroxsolutions/icons` to confirm the mark subpath layout (flat vs `brands/`), so the new `ai-provider-icon` / `ai-provider-config` subpaths resolve the way consumers import. RESULT: marks build to `dist/brands/<name>.js` -> subpath `@zeroxsolutions/icons/brands/<name>`; resolver at `src/ai-provider-icon.tsx` -> `@zeroxsolutions/icons/ai-provider-icon`; the `./*` wildcard export covers both (no `package.json` edit).
- [x] 1.2 Reconcile with the released version chiselhub consumes: confirm whether `lucide-mark`, `ai4bharat`, plain `google`, and plain `microsoft` already exist on the release line; remove any already-shipped item from the vendoring list. RESULT: all four are ABSENT in this working tree, so all must be vendored here; `ai4bharat` has no `@lobehub/icons` mark (placeholder glyph), the other 22 do.
- [x] 1.3 Freeze the final provider-key set from chiselhub `ProviderLogo`'s `ICONS` map and map each key to its target vendored mark (existing or to-vendor). RESULT: ~28 keys map to existing marks; 23 needed vendoring (20 from lobehub + google + microsoft + ai4bharat placeholder); `custom` maps to the neutral Default. Frozen mapping realized as `aiProviderMappings` in `ai-provider-config.ts`.

## 2. Vendor the missing brand marks

- [x] 2.1 Vendor each missing provider mark as `src/brands/<name>.tsx` following the existing pattern (`Base` SVG `fill="currentColor"` `size='1em'`, `.Mono` / `.Color?` / `.Text?` / `.Avatar` / `.Combine` statics via `internal/*`, `internal/fill-ids` for gradients, MIT attribution): volcengine, new-api, zhipu, zai, moonshot, gemma, bailian, xiaomi-mimo, modelscope, stepfun, codex, bfl, bytedance, workers-ai, baai, ibm, llava, myshell, pixverse, vidu. DONE via 4 parallel implementer agents, SVGs copied byte-for-byte from `@lobehub/icons@5.8.0`.
- [x] 2.2 Add a plain `google` and `microsoft` mark; `ai4bharat` placeholder. `lucide-mark` adapter NOT added - the `custom` case is served by the resolver's built-in neutral Default instead of a separate lucide adapter.
- [x] 2.3 Render smoke coverage per new mark - satisfied automatically by the glob-driven `brands/brand-marks.spec.tsx` (base + each present variant + unique-id), which needs no per-mark edit.

## 3. Build the resolver tier

- [x] 3.1 `ai-provider-config.ts`: `aiProviderMappings: { keywords: string[]; Icon: BrandMark }[]` for the AI providers (with aliases: `claude`/`claude-code`, `xai`/`grok`, `qwen`/`alibaba`), plus `resolveAiProviderMark(key, extra?)` (case-insensitive; `extra` prepended so an app can add/override keys). `BrandMark` base widened to `ComponentType<IconProps>` so bare marks (deepgram/inworld/leonardo/pipecat) satisfy it.
- [x] 3.2 `ai-provider-icon.tsx`: `AiProviderIcon({ provider, size?, type?, shape?, extra?, className?, style? })` resolving via `ai-provider-config`, variant fallback chain (`type static ?? .Mono ?? base`), neutral Default on no match, `memo`. Default `type` = `color` (matches original ProviderLogo).
- [x] 3.3 Subpath exports wired by the existing `./*` -> `dist/*` map; build confirms `dist/ai-provider-icon.js` + `dist/ai-provider-config.js` emit (no `package.json` edit).
- [x] 3.4 `ai-provider-icon.spec.tsx` (vitest): known-key resolution, case-insensitive, alias, each `type` variant, `size`, unknown-key neutral fallback, `extra` mapping, no-throw. 10 tests pass.

## 4. Storybook

- [x] 4.1 `apps/storybook/src/icons/ai-provider-icon.stories.tsx`: Playground (controls) + Variants (color/mono/avatar/combine) + Sizes + AllProviders + unknown fallback.
- [x] 4.2 New-mark coverage - the `AllProviders` story renders every mapped provider (all 23 new marks + existing), serving as the gallery/coverage story without bloating the curated `brand-marks.stories.tsx`.

## 5. Validation

- [x] 5.1 `nx build` + `nx test` + `nx typecheck` green for `@zeroxsolutions/icons` (no `lint` target on this project; storybook has PRE-EXISTING typecheck errors in unrelated stories - `message-scroller`, `pagination` - not touched by this change).
- [x] 5.2 Real-browser visual verification of the vendored marks (compiled `dist` in headless Chrome, incl. colored marks for `fill-ids` isolation) per this repo's icon-vendoring workflow. RESULT: esbuild-bundled harness rendered `AiProviderIcon` over all 51 provider keys x color/avatar/mono in chrome-headless-shell; every new mark draws (none blank), unknown key -> neutral fallback, avatars get a circular bg, mono is monochrome, and gemini/llava/stepfun rendered x2 each proved gradient id-isolation (2nd instance identical to 1st, no bleed).
- [x] 5.3 Tree-shaking intact: per-file `dist/brands/*.js` + `sideEffects: false` mean a single-mark import pulls no registry; the glob spec's "no two marks share an internal svg id" test also passed across all marks.
- [x] 5.4 `openspec validate add-ai-provider-icon` passes.
- [x] 5.5 chiselhub follow-up recorded (bump `@zeroxsolutions/icons`, collapse `ProviderLogo` onto `AiProviderIcon`, drop `@lobehub/icons`) - in proposal/design Non-Goals + Migration Plan; tracked in the chiselhub repo, out of scope here.
