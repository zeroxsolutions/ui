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
    serializeNode: (node) => serializeNode(node, format, registry, ctx, LINE_START),
    serializeChildren: (node) => {
      let out = '';
      for (const child of node.content ?? []) {
        const line = out.slice(out.lastIndexOf('\n') + 1);
        out += serializeNode(child, format, registry, ctx, {
          atLineStart: line === '',
          afterNumber: NUMBER.test(line),
        });
      }
      return out;
    },
  };
  return ctx.serializeNode(doc);
}

/**
 * Where a text node lands on its Markdown line: at its start, or after a number alone, where a `.` or `)` would
 * open an ordered list item.
 */
interface LinePlace {
  readonly atLineStart: boolean;
  readonly afterNumber: boolean;
}

/** A text node handed to `serializeNode` alone is taken to open a line: escaping a marker that opens none reads back the same. */
const LINE_START: LinePlace = { atLineStart: true, afterNumber: false };
/** A line so far that an ordered list item's delimiter would follow. */
const NUMBER = /^[0-9]{1,9}$/;

function serializeNode(
  node: NodeJSON,
  format: Format,
  registry: CodecRegistry,
  ctx: SerializeContext,
  place: LinePlace,
): string {
  if (node.type === 'text') return applyMarks(node, format, registry, ctx, place);

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
/** A `#` closing a line, which a reader strips from a heading as its closing sequence. */
const MARKDOWN_CLOSING_HASH = /#(?=[ \t]*(?:\n|$))/g;
/** Whitespace closing a line, which a reader strips, or reads as a hard break when it is two spaces. */
const MARKDOWN_LINE_END = /[ \t]+(?=\n)/g;

const entities = (whitespace: string): string => whitespace.replace(/ /g, '&#32;').replace(/\t/g, '&#9;');

/**
 * Text in Markdown is text: a reader takes back the characters the author typed, never a link, HTML, a mark or a
 * block they spell. Each special is backslash-escaped as CommonMark allows for any ASCII punctuation; whitespace a
 * reader would drop at a line's edge is written as character references.
 */
function markdownText(text: string, { atLineStart, afterNumber }: LinePlace): string {
  return text
    .replace(MARKDOWN_INLINE, '\\$&')
    .replace(MARKDOWN_ENTITY, '\\&')
    .replace(MARKDOWN_CLOSING_HASH, '\\#')
    .replace(/^([0-9]*)([.)])/, (opening, digits: string, delimiter: string) =>
      afterNumber ? `${digits}\\${delimiter}` : opening,
    )
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

/**
 * `text` as a CommonMark code span: between backtick fences longer than any run of backticks inside it, with a
 * space inside each fence where the text opens or closes with a backtick, or with a space at both ends, which a
 * reader would otherwise strip. A line break, which a reader takes as a space and which could open a block on the
 * next line, is written as a space.
 */
function codeSpan(code: string): string {
  const text = code.replace(/\r\n?|\n/g, ' ');
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  const padded = /^`|`$/.test(text) || (/^ [\s\S]* $/.test(text) && text.trim() !== '');
  const pad = padded ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
}

function applyMarks(
  node: NodeJSON,
  format: Format,
  registry: CodecRegistry,
  ctx: SerializeContext,
  place: LinePlace,
): string {
  const method = MARK_METHOD[format as keyof typeof MARK_METHOD];
  const delimiters = (node.marks ?? []).map((mark) => {
    const codec = registry.markCodec(mark.type);
    return { mark, delimiter: method && codec?.[method] ? codec[method]!(mark, ctx) : undefined };
  });
  const raw = node.text ?? '';
  // A code span holds its text as it is, so it is written first and every other mark wraps it.
  const code = format === 'markdown' && delimiters.some(({ delimiter }) => delimiter?.codeSpan);
  let text =
    format === 'html'
      ? escapedText(raw)
      : code
        ? codeSpan(raw)
        : format === 'markdown'
          ? markdownText(raw, place)
          : raw;
  for (const { mark, delimiter } of delimiters) {
    if (delimiter?.codeSpan && code) continue;
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
