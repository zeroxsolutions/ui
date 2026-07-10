/**
 * The frozen, SemVer-stable public contract of the `document` editor surface —
 * every type engine-free by construction (only the opt-in `advanced` escape
 * exposes engine primitives, and it lives elsewhere). See the
 * `document-editor-core`, `editor-feature-api`, and `editor-serialization` specs.
 */
export type { DocJSON, MarkJSON, NodeJSON } from './json.js';
export type { Delta, Snapshot } from './delta.js';
export type {
  BackendTransaction,
  DocumentBackendFactory,
  DocumentBackendInit,
  DocumentChangeHandlers,
  IDocumentBackend,
} from './document-backend.js';
export type {
  CaretRect,
  EditorSelection,
  EditorStatus,
  FocusPosition,
  IEditor,
  TriggerQuery,
} from './editor.js';
export type { CommandDescriptor, CommandMap } from './command.js';
export type { NodeViewProps } from './node-view.js';
export type {
  ContentExpression,
  InputRuleSpec,
  MarkSpec,
  NodeSpec,
} from './node-spec.js';
export type {
  DeserializeContext,
  FallbackStrategy,
  Format,
  MarkCodec,
  MarkDelimiters,
  MarkdownToken,
  NodeCodec,
  SerializeContext,
} from './codec.js';
export type {
  BlockMenuItem,
  BubbleItem,
  SlashItem,
  ToolbarItem,
} from './ui-contribution.js';
export type {
  DroppedNode,
  ImportResult,
  ImportWarning,
} from './import-result.js';
export type { AdvancedContribution, EditorFeature } from './feature.js';
