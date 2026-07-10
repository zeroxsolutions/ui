import { Fragment, type ReactNode } from 'react';
import type { CodecRegistry } from './codec-registry.js';
import type { SerializeContext } from '../core/types/codec.js';
import type { NodeJSON } from '../core/types/json.js';

/**
 * The React export walker (task 4.3) that powers the static, SSR-safe Viewer: it
 * turns document JSON into a React tree using each node's `toReact` codec, with
 * no editing engine in its module graph (see the `editor-viewer` spec).
 */
export function renderToReact(
  doc: NodeJSON,
  registry: CodecRegistry,
): ReactNode {
  const ctx: SerializeContext = {
    format: 'react',
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
  ctx: SerializeContext,
): ReactNode {
  if (node.type === 'text') return applyMarks(node, registry, ctx);
  const codec = registry.nodeCodec(node.type);
  if (codec?.toReact) return codec.toReact(node, ctx);
  return ctx.renderChildren(node);
}

function applyMarks(
  node: NodeJSON,
  registry: CodecRegistry,
  ctx: SerializeContext,
): ReactNode {
  let out: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    const codec = registry.markCodec(mark.type);
    out = codec?.toReact ? (
      codec.toReact(mark, out, ctx)
    ) : (
      <span data-mark={mark.type}>{out}</span>
    );
  }
  return out;
}
