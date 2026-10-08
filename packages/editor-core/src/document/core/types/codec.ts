import type { MarkJSON, NodeJSON } from './json.js';

/**
 * The per-node/mark codec contract (see the `editor-serialization` spec).
 * Serialization knowledge lives **with each feature**, not in a monolithic
 * serializer: a generic walker delegates to the registered codec for each node
 * type. The same codec powers export (Markdown/HTML) and two-way import; the
 * React tree is rendered by the chrome (core is framework-free). Adding a block
 * requires no edit to the walker or core.
 */

/** A serialization target. The common set is enumerated; the format set is open. */
export type Format =
  | 'markdown'
  | 'html'
  // `string & {}` keeps the literal autocomplete while allowing custom formats.
  | (string & {});

/** What to do when a node has no codec for the requested format. */
export type FallbackStrategy = 'skip' | 'children' | 'text' | 'error';

/** A Markdown token — an mdast-style node from the remark token path. Structural
 *  and engine-free, so custom-block codecs can reconstruct their nodes. */
export interface MarkdownToken {
  type: string;
  children?: MarkdownToken[];
  value?: string;
  [key: string]: unknown;
}

/** Passed to a codec while exporting; lets it recurse into its children. */
export interface SerializeContext {
  /** The format being produced. */
  format: Format;
  /** Serialize a node's children to a string (Markdown/HTML). */
  serializeChildren(node: NodeJSON): string;
  /** Serialize a single node to a string (Markdown/HTML). */
  serializeNode(node: NodeJSON): string;
}

/** Passed to a codec while importing; lets it recurse and report issues. */
export interface DeserializeContext {
  /** Map a Markdown token's children to node JSON. */
  fromMarkdownChildren(token: MarkdownToken): NodeJSON[];
  /** Map an element's children to node JSON. */
  fromHTMLChildren(element: HTMLElement): NodeJSON[];
  /** Record a non-fatal import issue (surfaced in the `ImportResult`). */
  warn(message: string, source?: string): void;
}

/** The paired open/close output for a mark in a string format. */
export interface MarkDelimiters {
  open: string;
  close: string;
}

export interface NodeCodec<A = Record<string, unknown>> {
  /** The node type this codec serializes/parses. */
  node: string;
  toMarkdown?(node: NodeJSON<A>, ctx: SerializeContext): string;
  toHTML?(node: NodeJSON<A>, ctx: SerializeContext): string;
  /** React-tree output - opaque at core so core names no React type. The chrome
   *  React walker calls it and casts; feature authors use the chrome's React
   *  codec alias to write it with full typing. */
  toReact?(node: NodeJSON<A>, ctx: SerializeContext): unknown;
  fromMarkdown?(token: MarkdownToken, ctx: DeserializeContext): NodeJSON<A> | null;
  fromHTML?(element: HTMLElement, ctx: DeserializeContext): NodeJSON<A> | null;
  /** Per-format override of the registry's default missing-codec fallback. */
  fallback?: Partial<Record<Format, FallbackStrategy>>;
}

export interface MarkCodec<A = Record<string, unknown>> {
  /** The mark type this codec serializes/parses. */
  mark: string;
  toMarkdown?(mark: MarkJSON<A>, ctx: SerializeContext): MarkDelimiters;
  toHTML?(mark: MarkJSON<A>, ctx: SerializeContext): MarkDelimiters;
  /** React-tree output - opaque at core (see `NodeCodec.toReact`). */
  toReact?(mark: MarkJSON<A>, children: unknown, ctx: SerializeContext): unknown;
  fromMarkdown?(token: MarkdownToken, ctx: DeserializeContext): MarkJSON<A> | null;
  fromHTML?(element: HTMLElement, ctx: DeserializeContext): MarkJSON<A> | null;
}
