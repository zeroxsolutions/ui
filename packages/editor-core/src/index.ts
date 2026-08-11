/**
 * `@zeroxsolutions/editor-core` has **no root barrel** — every module is
 * published at its natural subpath via the per-file `./*` exports map (dist
 * mirrors src). Import from the subpath you need, e.g.:
 *
 *   import { createEditor }  from '@zeroxsolutions/editor-core/document/core/builder/create-editor';
 *   import { defineFeature } from '@zeroxsolutions/editor-core/document/core/define-feature';
 *
 * The framework-free core ships zero `react` (no runtime, types, or peer dep):
 * the `<Editor/>` / `<Viewer/>` surfaces, the node-view renderer, and the React
 * serialization walker + `toReact` codec typing live in the ui registry
 * (`@/registry/bases/base-ui/editor/...`) and are injected at mount.
 *
 * This file is excluded from the build entries; it exists only as documentation.
 */
export {};
