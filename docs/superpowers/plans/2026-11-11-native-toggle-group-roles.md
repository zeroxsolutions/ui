# Native ToggleGroup roles - implementation plan

**Spec:** `docs/superpowers/specs/2026-11-11-native-toggle-group-roles-design.md`

1. In `apps/registry-native-ui-docs-zone-e2e/src/native-component-demos.spec.ts`, a case on
   `/native/components/nativewind/toggle-group`: inside the "Toggle group demo" frame, the items Left, Center and
   Right are found by role `radio`, Left checked and the others not; pressing Center checks it. Run it in
   Chromium and see it fail.
2. In `packages/native-ui/src/registry/ui/toggle-group.tsx`, the group's `type` joins `ToggleGroupContext`, and
   `ToggleGroupItem` passes `role` (`radio` or `checkbox`) and `aria-checked={pressed}` before the caller's props.
3. Re-export the preview, run the case green in Chromium, Firefox and WebKit, with the emoji case beside it;
   native-ui test, typecheck, lint, build-registry; one commit; push; pull request.
