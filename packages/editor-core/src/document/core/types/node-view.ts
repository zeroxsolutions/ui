import type { IEditor } from './editor.js';

/**
 * The engine-free contract a feature's interactive block view receives (see the
 * `editor-feature-api` spec). A view gets **validated** attributes, an
 * attribute-update function, selection state, a façade handle, and — for
 * content-bearing nodes — an editable content slot. No engine type appears here,
 * so a feature author never imports the engine to render a block.
 */
export interface NodeViewProps<A = Record<string, unknown>> {
  /** The node's attributes, already validated/defaulted against its schema. */
  attrs: A;
  /** Merge a partial patch into the node's attributes, through the change model. */
  updateAttrs(patch: Partial<A>): void;
  /** Whether the node is currently selected. */
  selected: boolean;
  /** Whether the surface is editable (false in the read-only live Viewer). */
  editable: boolean;
  /** The editor façade — for running commands, reading state, etc. */
  editor: IEditor;
  /** Delete this node from the document. */
  deleteNode(): void;
  /** The editable content slot for content-bearing nodes; opaque at core (the
   *  chrome types it as a React tree). Render it where the node's children
   *  belong; omit for atoms. */
  children?: unknown;
}
