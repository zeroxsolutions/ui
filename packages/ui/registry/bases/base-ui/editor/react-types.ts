import type { ReactNode } from 'react';
import type {
  MarkCodec as CoreMarkCodec,
  NodeCodec as CoreNodeCodec,
  SerializeContext as CoreSerializeContext,
} from '@zeroxsolutions/editor-core/document/core/types/codec';
import type { MarkJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/types/json';

/**
 * React-typed aliases for the serialization slots `editor-core` declares opaque.
 * Core is framework-free (zero `react`): a codec's `toReact` slot is `unknown`
 * there, so its published `.d.ts` names no React type. The chrome re-types that
 * slot to `ReactNode` here so a feature author writes JSX with full typing, then
 * casts the codec into the core registry (`as NodeCodec`) at the registration
 * boundary - the chrome half of the same opaque seam the engine binding already
 * uses (`NodeViewRenderer => unknown`).
 */

/** A codec author's context on the React path: core's string context plus
 *  `renderChildren` (core dropped it - only the chrome React walker provides it). */
export interface ReactSerializeContext extends CoreSerializeContext {
  /** Render a node's children to a React tree. */
  renderChildren(node: NodeJSON): ReactNode;
}

/** A node codec whose `toReact` builds a React tree. Use this (not the core
 *  `NodeCodec`) so `ctx.renderChildren` and the JSX return typecheck; cast the
 *  codec into the core registry via `as NodeCodec`. */
export type ReactNodeCodec<A = Record<string, unknown>> = Omit<CoreNodeCodec<A>, 'toReact'> & {
  toReact?(node: NodeJSON<A>, ctx: ReactSerializeContext): ReactNode;
};

/** A mark codec whose `toReact` wraps a React tree. The chrome React walker
 *  passes the already-rendered children as a `ReactNode`. */
export type ReactMarkCodec<A = Record<string, unknown>> = Omit<CoreMarkCodec<A>, 'toReact'> & {
  toReact?(mark: MarkJSON<A>, children: ReactNode, ctx: ReactSerializeContext): ReactNode;
};
