/**
 * `document/core/` — the only layer that imports the rich-text engine. It
 * confines the engine behind the frozen public contract (`./types`): the
 * `IEditor` façade, the `createEditor` builder, the feature compiler, the
 * registry, and the default document backend. Everything re-exported here keeps
 * an engine-free public signature (verified by the `assert-engine-free-dts`
 * build guard).
 */
export type {
  AdvancedContribution,
  BackendTransaction,
  BlockMenuItem,
  BubbleItem,
  CaretRect,
  CommandDescriptor,
  CommandMap,
  ContentExpression,
  Delta,
  DeserializeContext,
  EmailBlockJSON,
  DocJSON,
  DocumentBackendFactory,
  DocumentBackendInit,
  DocumentChangeHandlers,
  DroppedNode,
  EditorFeature,
  EditorSelection,
  EditorStatus,
  FallbackStrategy,
  FocusPosition,
  Format,
  IDocumentBackend,
  IEditor,
  ImportResult,
  ImportWarning,
  InputRuleSpec,
  MarkCodec,
  MarkDelimiters,
  MarkJSON,
  MarkSpec,
  MarkdownToken,
  NodeCodec,
  NodeJSON,
  NodeSpec,
  NodeViewProps,
  NodeViewRenderer,
  SerializeContext,
  SlashItem,
  Snapshot,
  ToolbarItem,
  TriggerBoundary,
  TriggerQuery,
} from './types/index.js';

export { createEditor } from './builder/create-editor.js';
export type { EditorBuilder, EditorMountOptions } from './builder/create-editor.js';

export { createDocumentEditor } from './create-document-editor.js';
export type { DocumentEditorConfig } from './create-document-editor.js';

export { defineFeature } from './define-feature.js';
export { resolveFeatures } from './registry/feature-registry.js';
export { createPmStepsBackend } from './backend/pm-steps-backend.js';

export {
  CommandArgumentError,
  DuplicateRegistrationError,
  EditorError,
  MissingFeatureDependencyError,
  UnknownCommandError,
} from './errors.js';
