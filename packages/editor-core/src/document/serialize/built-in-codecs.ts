import type { NodeCodec } from '../core/types/codec.js';

/**
 * Codecs for the substrate the compiler always ships (`doc`, `paragraph`) - the
 * base every document shares. Every other block/mark carries its own codec from
 * its feature (see the `editor-serialization` spec). Text nodes and their marks
 * are handled directly by the walkers, so they need no codec here. The React
 * tree for these is the chrome React walker's job (paragraph wraps in `<p>`),
 * so no `toReact` lives in core.
 */

const docCodec: NodeCodec = {
  node: 'doc',
  toMarkdown: (node, ctx) =>
    (node.content ?? []).map((child) => ctx.serializeNode(child)).join('\n\n'),
  toHTML: (node, ctx) => ctx.serializeChildren(node),
  fromMarkdown: (token, ctx) =>
    token.type === 'root'
      ? { type: 'doc', content: ctx.fromMarkdownChildren(token) }
      : null,
  // Only the document root maps to `doc`; every other element defers to a block
  // codec. (Import builds the top-level `doc` directly, so this rarely fires —
  // but an unconditional match here would greedily wrap every top-level element.)
  fromHTML: (element, ctx) =>
    element.tagName === 'BODY' || element.tagName === 'HTML'
      ? { type: 'doc', content: ctx.fromHTMLChildren(element) }
      : null,
};

const paragraphCodec: NodeCodec = {
  node: 'paragraph',
  toMarkdown: (node, ctx) => ctx.serializeChildren(node),
  toHTML: (node, ctx) => `<p>${ctx.serializeChildren(node)}</p>`,
  fromMarkdown: (token, ctx) =>
    token.type === 'paragraph'
      ? { type: 'paragraph', content: ctx.fromMarkdownChildren(token) }
      : null,
  fromHTML: (element, ctx) =>
    element.tagName === 'P'
      ? { type: 'paragraph', content: ctx.fromHTMLChildren(element) }
      : null,
};

export const builtInNodeCodecs: NodeCodec[] = [docCodec, paragraphCodec];
