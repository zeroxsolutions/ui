import { Fragment, type ReactNode } from 'react';
import type { CodecRegistry } from '@zeroxsolutions/editor-core/document/serialize/codec-registry';
import type { NodeJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import type { ReactSerializeContext } from '../../react-types';

/**
 * The chrome React export walker: turns document JSON into a React tree using
 * each node's `toReact` codec, with no editing engine and no `react` in
 * editor-core's graph (see the `editor-viewer` spec). Relocated from
 * editor-core so the core stays framework-free; the core string walker
 * (`serialize`) still owns Markdown/HTML. Each codec's `toReact` is read
 * opaquely off the core registry and cast to `ReactNode` - core names no React
 * type; the chrome owns the tree.
 */

// Built-in React rendering for the substrate the compiler always ships. Core's
// codecs carry only Markdown/HTML; the `<p>` wrap for `paragraph` lives here.
// `doc` and every other content node fall through to `renderChildren`.
const BUILTIN_NODE_REACT: Record<
  string,
  (node: NodeJSON, ctx: ReactSerializeContext) => ReactNode
> = {
  paragraph: (node, ctx) => <p>{ctx.renderChildren(node)}</p>,
};

export function renderToReact(
  doc: NodeJSON,
  registry: CodecRegistry,
): ReactNode {
  const ctx: ReactSerializeContext = {
    // Unused on the React path - no React codec branches on format. 'react'
    // left the core Format union, so a valid string format stands in.
    format: 'html',
    serializeNode: () => '',
    serializeChildren: () => '',
    renderChildren: (node) =>
      (node.content ?? []).map((child, index) => (
        <Fragment key={index}>{renderNode(child, registry, ctx)}</Fragment>
      )),
  };
  return renderNode(doc, registry, ctx);
}

function renderNode(
  node: NodeJSON,
  registry: CodecRegistry,
  ctx: ReactSerializeContext,
): ReactNode {
  if (node.type === 'text') return applyMarks(node, registry, ctx);
  const codec = registry.nodeCodec(node.type);
  if (codec?.toReact) return codec.toReact(node, ctx) as ReactNode;
  const builtin = BUILTIN_NODE_REACT[node.type];
  if (builtin) return builtin(node, ctx);
  return ctx.renderChildren(node);
}

function applyMarks(
  node: NodeJSON,
  registry: CodecRegistry,
  ctx: ReactSerializeContext,
): ReactNode {
  let out: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    const codec = registry.markCodec(mark.type);
    out = codec?.toReact
      ? (codec.toReact(mark, out, ctx) as ReactNode)
      : <span data-mark={mark.type}>{out}</span>;
  }
  return out;
}
