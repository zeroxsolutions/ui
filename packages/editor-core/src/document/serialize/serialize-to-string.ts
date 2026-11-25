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

export function serialize(doc: NodeJSON, format: Format, registry: CodecRegistry): string {
  const ctx: SerializeContext = {
    format,
    serializeNode: (node) => serializeNode(node, format, registry, ctx, true),
    serializeChildren: (node) => {
      let out = '';
      for (const child of node.content ?? []) {
        out += serializeNode(child, format, registry, ctx, out === '' || out.endsWith('\n'));
      }
      return out;
    },
  };
  return ctx.serializeNode(doc);
}

/**
 * `atLineStart` is false only where the text is known to follow other output on its line; a text node handed to
 * `serializeNode` alone is taken to open one, and escaping a marker that opens no line still reads back the same.
 */
function serializeNode(
  node: NodeJSON,
  format: Format,
  registry: CodecRegistry,
  ctx: SerializeContext,
  atLineStart: boolean,
): string {
  if (node.type === 'text') return applyMarks(node, format, registry, ctx, atLineStart);

  const custom = registry.customNodeSerializer(format, node.type);
  if (custom) return custom(node, ctx);

  const method = NODE_METHOD[format as keyof typeof NODE_METHOD];
  const codec = registry.nodeCodec(node.type);
  const fn = method && codec ? codec[method] : undefined;
  if (fn) return fn(node, ctx);

  return applyFallback(node, format, registry, ctx);
}

/** Text in HTML is text: an author's `<` or `&` never becomes markup in the export. */
function escapedText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** What CommonMark and GFM read as markup anywhere in a line: emphasis, code, links, HTML, strikethrough, cells. */
const MARKDOWN_INLINE = /[\\`*_[\]<>~|]/g;
/** An ampersand opening a character reference, which a reader would decode. */
const MARKDOWN_ENTITY = /&(?=#[0-9]{1,7};|#[xX][0-9a-fA-F]{1,6};|[A-Za-z][A-Za-z0-9]*;)/g;
/**
 * A line's indentation, which a reader strips or reads as a code block, and what opens a block after it: a heading,
 * a list item, a thematic break or a setext underline. `*`, `>` and the fences are inline specials, escaped already.
 */
const MARKDOWN_LINE_START = /(^|\n)([ \t]*)(?:([#+=-])|([0-9]+)([.)]))?/g;
/** Whitespace closing a line, which a reader strips, or reads as a hard break when it is two spaces. */
const MARKDOWN_LINE_END = /[ \t]+(?=\n)/g;

const entities = (whitespace: string): string => whitespace.replace(/ /g, '&#32;').replace(/\t/g, '&#9;');

/**
 * Text in Markdown is text: a reader takes back the characters the author typed, never a link, HTML, a mark or a
 * block they spell. Each special is backslash-escaped as CommonMark allows for any ASCII punctuation; whitespace a
 * reader would drop at a line's edge is written as character references.
 */
function markdownText(text: string, atLineStart: boolean): string {
  return text
    .replace(MARKDOWN_INLINE, '\\$&')
    .replace(MARKDOWN_ENTITY, '\\&')
    .replace(MARKDOWN_LINE_END, entities)
    .replace(
      MARKDOWN_LINE_START,
      (match, start: string, indent: string, marker?: string, digits?: string, delimiter?: string, offset?: number) => {
        if (offset === 0 && !atLineStart) return match;
        const opening = marker !== undefined ? `\\${marker}` : digits !== undefined ? `${digits}\\${delimiter}` : '';
        return `${start}${entities(indent)}${opening}`;
      },
    );
}

function applyMarks(
  node: NodeJSON,
  format: Format,
  registry: CodecRegistry,
  ctx: SerializeContext,
  atLineStart: boolean,
): string {
  const method = MARK_METHOD[format as keyof typeof MARK_METHOD];
  const delimiters = (node.marks ?? []).map((mark) => {
    const codec = registry.markCodec(mark.type);
    return { mark, delimiter: method && codec?.[method] ? codec[method]!(mark, ctx) : undefined };
  });
  const raw = node.text ?? '';
  let text =
    format === 'html'
      ? escapedText(raw)
      : format === 'markdown' && !delimiters.some(({ delimiter }) => delimiter?.verbatim)
        ? markdownText(raw, atLineStart)
        : raw;
  for (const { mark, delimiter } of delimiters) {
    if (delimiter) {
      text = `${delimiter.open}${text}${delimiter.close}`;
    } else if (format === 'html') {
      text = `<span data-mark="${mark.type}">${text}</span>`;
    }
  }
  return text;
}

function applyFallback(node: NodeJSON, format: Format, registry: CodecRegistry, ctx: SerializeContext): string {
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
