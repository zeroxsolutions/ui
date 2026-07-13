## 1. Finalize roster, variant matrix & pipeline

- [x] 1.1 Lock the per-domain brand roster below into a scratchpad manifest, and for each brand record its **variant matrix** (which of base/`.Color`/`.Mono`/`.Avatar`/`.Text`/`.Combine` exist), source tier per variant, primary brand color, and symbol. Resolve the D6 collision watch-list (`x`/`grok`, `meta`/`llama`, `gemini`/`google`, `claude`/`anthropic`). Existing marks stay rendering; add variants additively.
- [x] 1.2 Build the **shared composition module** in `src/brands/` — `makeAvatar(icon, brandColor)` (icon centered on a filled background; props `background`, `color`, `iconMultiple=0.6`) and `makeCombine(icon, name)` (icon + wordmark; props `text`, `textColor=currentColor`), using raw layout elements only, no external UI dep. Confirm the Vite output for this module (internal subpath vs inline) per design D4.
- [x] 1.3 Stand up the **throwaway** vendoring pipeline (scratchpad, only `.tsx` committed): per brand, per present variant, pull SVG from its source tier → svgo + `prefixIds` (mark-unique) → apply the D3 compound template with the brand color + wired `.Avatar`/`.Combine`. Run through `nx`.
- [x] 1.4 Confirm licensing per source: `@lobehub/icons` (MIT), Simple Icons (CC0), vendor/seeklogo; record tier per variant for attribution.

## 2. Vendor the AI-ecosystem marks (`src/brands/*.tsx`, full variant set where it exists)

- [x] 2.1 **Model labs / providers** (~30): openai, anthropic, gemini, meta, mistral, cohere, grok (xai), deepseek, qwen, kimi (moonshot), glm (zhipu), baichuan, yi (01-ai), perplexity, reka, ai21, stability-ai, nvidia, copilot (microsoft), inflection (pi), character-ai, minimax, doubao, hunyuan (tencent), sensetime, spark (iflytek).
- [x] 2.2 **Inference / hosting** (~22): huggingface, replicate, together, fireworks, groq, cerebras, ollama, lmstudio, openrouter, modal, baseten, anyscale, novita, hyperbolic, sambanova, deepinfra, vllm, runpod, lambda-labs, fal, portkey, litellm.
- [x] 2.3 **Voice / speech** (~16, 3 exist): cartesia, elevenlabs, playht, rime, assemblyai, speechmatics, resemble, livekit, daily, vapi, retell, sesame, hume, gladia, speechify. (deepgram✓, pipecat✓, inworld✓ — add variants)
- [x] 2.4 **Generative media** (~19, 1 exists): midjourney, ideogram, runway, pika, luma, flux (black-forest-labs), suno, udio, kling, recraft, krea, higgsfield, viggle, heygen, synthesia, d-id, captions, sora, stable-diffusion. (leonardo✓ — add variants)
- [x] 2.5 **Agent / framework tooling** (~20): langchain, llamaindex, crewai, autogpt, vercel, n8n, flowise, dify, langflow, langgraph, langsmith, autogen, semantic-kernel, haystack, e2b, browserbase, composio, mcp, zapier, make.
- [x] 2.6 **Vector / data** (~15): pinecone, weaviate, qdrant, chroma, milvus, lancedb, pgvector, redis, elasticsearch, mongodb, supabase, neon, turso, faiss, vespa.

## 3. Vendor the dev / cloud / infra marks (`src/brands/*.tsx`)

Most lack a wordmark → typically base/`.Color`/`.Mono`/`.Avatar` only; `.Text`/`.Combine` where a clean wordmark exists.

- [x] 3.1 **Source control / hosting** (~8, 1 exists): gitlab, bitbucket, cloudflare, vercel (dedup with 2.5), netlify, railway, render, fly. (github✓)
- [x] 3.2 **Cloud / containers / IaC** (~9): aws, gcp, azure, docker, kubernetes, terraform, pulumi, hashicorp, digitalocean.
- [x] 3.3 **Data / backend platforms** (~12): postgresql, mysql, sqlite, prisma, firebase, planetscale, snowflake, databricks, kafka, rabbitmq, nginx, heroku.
- [x] 3.4 **App / services** (~11): stripe, twilio, sendgrid, resend, auth0, clerk, grafana, datadog, sentry, posthog, segment.

## 4. Tests

- [x] 4.1 Rewrite `src/brands/brand-marks.spec.tsx` glob-driven (`import.meta.glob('./*.tsx', { eager: true })`), excluding the composition helper module and specs.
- [x] 4.2 Base renders a non-empty `<svg>` with a `viewBox`; `size` maps to width/height on an icon-form variant; keep the dedicated `GithubMark` `className`/`currentColor` assertion.
- [x] 4.3 For each **present** variant: `.Color` non-empty svg; `.Mono` paints `currentColor`; `.Avatar` renders its background wrapper; `.Text`/`.Combine` render the wordmark text. Absent variants are `undefined` (not rendered).
- [x] 4.4 No two marks share an internal SVG id across the full set.
- [x] 4.5 `toBeGreaterThanOrEqual` floor on mark count (below the delivered total — no brittle exact count).

## 5. Docs & catalog

- [x] 5.1 Update `packages/icons/README.md` — expand the `brands/` table (grouped by domain) with per-mark source and the variant set each ships; document the variant API (base/`.Color`/`.Mono`/`.Avatar`/`.Text`/`.Combine`) and the self-sufficiency note (no runtime icon-library dependency); keep the trademark disclaimer.
- [x] 5.2 Update `apps/storybook/src/icons/brand-marks.stories.tsx` to render the full set via glob, showing each brand's available variants across both color tiers.

## 6. Validation

- [x] 6.1 `nx lint @zeroxsolutions/icons`, `nx build @zeroxsolutions/icons`, `nx test @zeroxsolutions/icons` all green; `dist/brands/*` emits marks + the composition module with `.d.ts` mirrors.
- [x] 6.2 Smoke-import a few new subpaths and variants (`@zeroxsolutions/icons/brands/openai` → `.Color`/`.Mono`/`.Avatar`/`.Text`) to confirm the `./*` exports map resolves them and variants are typed.
- [x] 6.3 Visual spot-check a sample across variants + both color tiers in Storybook (real browser) against source artwork — catch wrong-variant/tier classification the structural test can't.
- [x] 6.4 Confirm `packages/icons/package.json` gained no runtime dependency and the existing 5 marks still render at their subpaths (variants added, base unchanged).
- [x] 6.5 Rule-audit the staged diff against `.agents/rules/*` (`lib-public-exports-and-semver`, `ui-primitive-fidelity`, `naming-files-and-symbols`, `run-through-nx`, `green-before-commit`).
