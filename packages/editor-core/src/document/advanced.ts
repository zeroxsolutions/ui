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
export { Extension, InputRule, Mark, Node, mergeAttributes } from '@tiptap/core';
export type { Editor, Extensions } from '@tiptap/core';
export { Plugin, PluginKey, Selection } from '@tiptap/pm/state';
export { Decoration, DecorationSet } from '@tiptap/pm/view';
export type { EditorView } from '@tiptap/pm/view';
export { Fragment, Slice } from '@tiptap/pm/model';
export { dropPoint } from '@tiptap/pm/transform';
export { closeHistory, isHistoryTransaction, undo } from '@tiptap/pm/history';
export type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model';
export type { AdvancedContribution } from './core/types/feature.js';
export { CONTENT_LOAD_META } from './core/engine/content-load.js';
export { facadeFor } from './core/engine/facade-registry.js';
export type { EngineHandle } from './core/engine/engine-handle.js';
