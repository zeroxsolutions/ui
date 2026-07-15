## Scope

Implement the `ai-provider-icon` capability inside `@zeroxsolutions/icons`: vendor the missing provider brand marks, then build the resolver tier (`ai-provider-config` + `AiProviderIcon`) that mirrors lobehub `features/`, with specs and Storybook stories. The chiselhub `ProviderLogo` rewire is out of scope.

## Covers

- Tasks `1.1`-`1.3`, `2.1`-`2.3`, `3.1`-`3.4`, `4.1`-`4.2`, `5.1`-`5.5`.
- Validation Focus: VF-resolution (type/size/fallback/case), VF-tree-shaking (single-mark import), VF-no-lobehub, VF-mark-render (real-browser + `fill-ids`).

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. Resolve readiness conditions: inspect built `dist/` for the mark subpath layout, and reconcile the missing-mark list and `lucide-mark` / `ai4bharat` / plain `google` / plain `microsoft` against the released version; freeze the final provider-key -> mark table. (1.1-1.3)
2. Write the failing `ai-provider-icon` vitest spec from the spec scenarios (known key, case-insensitive, each `type`, `size`, unknown-key fallback, no `@lobehub` in the render path). (3.4)
3. Vendor the missing marks as `src/brands/<name>.tsx` in the existing pattern, each with a render smoke spec; these are independent files. (2.1-2.3)
4. Implement `ai-provider-config.ts` (`aiProviderMappings` + `resolveAiProviderMark(key, extra?)`) and `ai-provider-icon.tsx` (`AiProviderIcon`, variant fallback chain, neutral Default, `React.memo`) until step 2's spec passes. (3.1-3.2)
5. Wire the `ai-provider-icon` / `ai-provider-config` subpaths per the confirmed layout, then add the Storybook stories. (3.3, 4.1-4.2)
6. Prove green and validate: `nx run-many -t lint build test`, `test-storybook`, tree-shaking spot check, real-browser mark verification, `openspec validate`. (5.1-5.4)

## Validation Per Step

1. The frozen key table lists every chiselhub `ProviderLogo` key with an existing-or-to-vendor mark; no duplicate re-vendoring of already-released marks.
2. The new spec runs and fails for the not-yet-built reasons (module missing), not for setup errors.
3. Each new mark renders in its smoke spec; `nx build @zeroxsolutions/icons` succeeds.
4. The `ai-provider-icon` spec goes green; unknown key yields the neutral Default, not a throw or a wrong mark.
5. Importing `@zeroxsolutions/icons/ai-provider-icon` resolves; stories render each `type`/`size` and the fallback.
6. lint + build + test green; `test-storybook` passes; a single-mark import pulls no registry; two colored marks on one page keep isolated gradients; `openspec validate add-ai-provider-icon` passes.

## Files / Owners

- `packages/icons/src/brands/<name>.tsx` - the ~21 (or reconciled) new marks (+ plain `google`/`microsoft`, `lucide-mark` if absent).
- `packages/icons/src/ai-provider-config.ts` - the provider mapping + `resolveAiProviderMark`.
- `packages/icons/src/ai-provider-icon.tsx` - the `AiProviderIcon` component.
- `packages/icons/src/ai-provider-icon.spec.tsx` - resolver spec; per-mark smoke specs (or an extended brand-marks spec).
- `packages/icons/package.json` - only if the `./*` wildcard export does not already cover the new subpaths (confirm in step 1).
- `apps/storybook/src/ai-provider-icon.stories.tsx` - resolver stories; marks gallery update.

## Completion Checkpoint

All `tasks.md` items checked; the `ai-provider-icon` spec scenarios pass; `AiProviderIcon` renders every frozen provider key across all `type`s and the unknown-key fallback; individual marks remain tree-shakeable; no `@lobehub/icons` in the `AiProviderIcon` runtime path; `nx run-many -t lint build test` and `test-storybook` green; `openspec validate add-ai-provider-icon` passes.

## Completion Verification

Verification Mode is retained-recommended: keep the `ai-provider-icon` vitest spec and the Storybook stories as durable evidence, and record the real-browser mark verification (compiled `dist` rendered headless, including the two-colored-marks `fill-ids` check) as the visual proof for the newly vendored marks.

## Delegation Units

- Marks unit - owns `src/brands/*` new marks + their smoke specs; writes completion back to tasks 2.x.
- Resolver unit - owns `ai-provider-config.ts`, `ai-provider-icon.tsx`, `ai-provider-icon.spec.tsx`; depends on the Marks unit; writes back tasks 3.x.
- Stories unit - owns `apps/storybook` stories; depends on the Resolver unit; writes back tasks 4.x.

## Parallel Units

The ~21 marks (step 3) run concurrently - each is an isolated file. The Resolver unit aggregates once the marks it maps exist.

## Isolation Boundaries

Each mark is a distinct `src/brands/<name>.tsx` with its own smoke spec and no shared edits; the `./*` wildcard export means no `package.json` contention (confirm in step 1). `ai-provider-config` / `ai-provider-icon` are single-owner files that land after the marks, so no two units write the same file.

## Execution Notes

<!-- appended at apply time -->
