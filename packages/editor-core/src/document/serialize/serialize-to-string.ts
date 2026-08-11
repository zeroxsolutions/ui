import type { CodecRegistry } from './codec-registry.js';
import type { Format, SerializeContext } from '../core/types/codec.js';
import type { NodeJSON } from '../core/types/json.js';

/**
 * The generic string export walker (task 4.1/4.2). It delegates each node to its
 * registered codec's `toMarkdown`/`toHTML` (or a custom-format serializer),
 * applies mark codecs around text, and uses a configurable fallback when a node
 * has no codec for the target format — so a document exports without the walker
 * knowing any specific block.
 */

const NODE_METHOD = { markdown: 'toMarkdown', html: 'toHTML' } as const;
const MARK_METHOD = { markdown: 'toMarkdown', html: 'toHTML' } as const;

export function serialize(
  doc: NodeJSON,
  format: Format,
  registry: CodecRegistry,
): string {
  const ctx: SerializeContext = {
    format,
    serializeNode: (node) => serializeNode(node, format, registry, ctx),
    serializeChildren: (node) =>
      (node.content ?? [])
        .map((child) => serializeNode(child, format, registry, ctx))
        .join(''),
  };
  return ctx.serializeNode(doc);
}

function serializeNode(
  node: NodeJSON,
  format: Format,
  registry: CodecRegistry,
  ctx: SerializeContext,
): string {
  if (node.type === 'text') return applyMarks(node, format, registry, ctx);

  const custom = registry.customNodeSerializer(format, node.type);
  if (custom) return custom(node, ctx);

  const method = NODE_METHOD[format as keyof typeof NODE_METHOD];
  const codec = registry.nodeCodec(node.type);
  const fn = method && codec ? codec[method] : undefined;
  if (fn) return fn(node, ctx);

  return applyFallback(node, format, registry, ctx);
}

function applyMarks(
  node: NodeJSON,
  format: Format,
  registry: CodecRegistry,
  ctx: SerializeContext,
): string {
  let text = node.text ?? '';
  const method = MARK_METHOD[format as keyof typeof MARK_METHOD];
  for (const mark of node.marks ?? []) {
    const codec = registry.markCodec(mark.type);
    const delimiter =
      method && codec?.[method] ? codec[method]!(mark, ctx) : undefined;
    if (delimiter) {
      text = `${delimiter.open}${text}${delimiter.close}`;
    } else if (format === 'html') {
      text = `<span data-mark="${mark.type}">${text}</span>`;
    }
  }
  return text;
}

function applyFallback(
  node: NodeJSON,
  format: Format,
  registry: CodecRegistry,
  ctx: SerializeContext,
): string {
  const codec = registry.nodeCodec(node.type);
  const strategy = codec?.fallback?.[format] ?? registry.defaultFallback;
  switch (strategy) {
    case 'skip':
      return '';
    case 'text':
      return collectText(node);
    case 'error':
      throw new Error(`No ${format} codec registered for node "${node.type}".`);
    case 'children':
    default:
      return ctx.serializeChildren(node);
  }
}

function collectText(node: NodeJSON): string {
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(collectText).join('');
}
