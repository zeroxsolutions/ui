/**
 * The canonical document representation. JSON is the **source of truth** (see
 * the `editor-serialization` spec); HTML, Markdown, and React output are all
 * derived views produced from these shapes. Deliberately engine-agnostic: the
 * structure mirrors a block document without importing any engine type, so the
 * underlying engine can be swapped without changing the stored format.
 */

/** A formatting mark on inline text (bold, link, …), by value. */
export interface MarkJSON<A = Record<string, unknown>> {
  type: string;
  attrs?: A;
}

/**
 * A single document node. A block node carries `content`; a text node carries
 * `text` (and optional `marks`); an atom carries neither. `attrs` is generic so
 * a codec/view can work with a node's precise attribute type.
 */
export interface NodeJSON<A = Record<string, unknown>> {
  type: string;
  attrs?: A;
  content?: NodeJSON[];
  marks?: MarkJSON[];
  text?: string;
}

/** The document root. */
export interface DocJSON extends NodeJSON {
  type: 'doc';
  content?: NodeJSON[];
}
