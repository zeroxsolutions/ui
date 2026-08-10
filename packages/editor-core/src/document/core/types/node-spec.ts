import type { ReactNode } from 'react';
import type { ZodType } from 'zod';
import type { NodeViewProps } from './node-view.js';

/**
 * The declarative schema a feature contributes for its block/mark (see the
 * `editor-feature-api` spec), expressed in the SDK's own controlled vocabulary
 * — **no engine schema type is imported**. The feature compiler translates a
 * `NodeSpec`/`MarkSpec` into engine extensions inside `core/`; the long tail
 * that the vocabulary can't express is routed to the `advanced` escape.
 */

/**
 * A content expression describing what a node may contain. The common cases are
 * enumerated for autocomplete; any engine-valid expression string is accepted.
 */
export type ContentExpression =
  | 'text*'
  | 'inline*'
  | 'inline+'
  | 'block+'
  | 'block*'
  | 'empty'
  // `string & {}` keeps the literal autocomplete above while accepting any
  // engine-valid content expression string.
  | (string & {});

export interface NodeSpec<A = Record<string, unknown>> {
  /** Unique node type name (matches the JSON `type`). */
  name: string;
  /** Whether the node sits in the block or inline flow. */
  group: 'block' | 'inline';
  /** What the node may contain; omit for an atom/leaf. */
  content?: ContentExpression;
  /** A leaf node with no editable content (image, mention, …). */
  atom?: boolean;
  /** Whether the node can be dragged by the block handle. */
  draggable?: boolean;
  /** Whether the node can be selected as a unit. */
  selectable?: boolean;
  /** Whether the node defines a boundary that isolates its content. */
  defining?: boolean;
  /** Zod schema for the node's attributes — the single source of the attribute
   *  type, its defaults, and boundary validation. */
  attrs?: ZodType<A>;
  /** The interactive React view (engine-free props). Omit for a node styled
   *  purely by CSS from a wrapper tag. */
  render?(props: NodeViewProps<A>): ReactNode;
  /** Engine-agnostic DOM hint for clipboard/serialization of a view-less node:
   *  the wrapper tag the schema serializes to and parses from. Richer HTML
   *  handling belongs in the node's codec (see `NodeCodec`). */
  htmlTag?: string;
}

/**
 * A node-view renderer injected by the React chrome. Core calls it with a
 * feature's `NodeSpec`; chrome wraps the feature's `render` in a `@tiptap/react`
 * `ReactNodeViewRenderer` + `NodeViewWrapper`. Core itself imports no
 * `@tiptap/react` - the concrete component type stays opaque (`unknown`) so no
 * engine type reaches a public `.d.ts`. Omit it for a headless build whose nodes
 * have no React views.
 */
export type NodeViewRenderer = (
  spec: NodeSpec,
  opts: { as: 'div' | 'span' },
) => unknown;

export interface MarkSpec<A = Record<string, unknown>> {
  /** Unique mark type name (matches the JSON `type`). */
  name: string;
  /** Zod schema for the mark's attributes, when it carries any. */
  attrs?: ZodType<A>;
  /** The wrapper tag the mark renders/serializes as (common case). */
  htmlTag?: string;
  /** Class applied to the wrapper. */
  className?: string;
  /** Whether typing at the mark's boundary extends it. */
  inclusive?: boolean;
  /** Names of marks this one cannot co-exist with. */
  excludes?: string[];
}

/**
 * An input rule: a pattern typed by the user that triggers a node/mark change
 * or a command (e.g. `## ` → heading). Engine-agnostic; the compiler wires it.
 */
export interface InputRuleSpec {
  /** Pattern matched against the text before the cursor. */
  find: RegExp;
  /** What the rule produces. */
  kind: 'node' | 'mark' | 'command';
  /** Target node/mark type name, or command name for `kind: 'command'`. */
  target: string;
  /** Derive attributes/arguments from the regex match. */
  getAttrs?(match: RegExpMatchArray): Record<string, unknown> | null;
}
