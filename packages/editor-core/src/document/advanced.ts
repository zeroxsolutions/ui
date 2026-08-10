/**
 * ⚠️ UNSTABLE — outside the SemVer-stable contract (see the `editor-feature-api`
 * spec, "Single Advanced Engine Escape").
 *
 * This is the **one** module that exposes the underlying engine
 * (Tiptap / ProseMirror). Reach for it only when the declarative feature API
 * cannot express what you need — then supply the result through a feature's
 * `advanced` field (`engineExtensions` / `prosePlugins`). Anything imported here
 * may break when the engine is upgraded or swapped; it is intentionally excluded
 * from the engine-free `.d.ts` guarantee. Prefer `defineFeature` for everything
 * that fits it.
 *
 * Subpath: `@zeroxsolutions/editor-core/document/advanced`.
 */
export { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
export type { Editor, Extensions } from '@tiptap/core';
export { Plugin, PluginKey } from '@tiptap/pm/state';
export type { AdvancedContribution } from './core/types/feature.js';
