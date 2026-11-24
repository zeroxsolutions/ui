import type { DocJSON, EmailBlockJSON, MarkJSON, NodeCodec, NodeJSON } from '../../document/core/types/index.js';
import {
  parseInlineMarkup,
  printInlineMarkup,
  type InlineLink,
  type InlineRun,
  type InlineText,
} from '../../template/index.js';
import { IMAGE_MAX_WIDTH } from '../../template/email/blocks/shared.js';
import { EMAIL_GLOBAL_ATTRIBUTES } from './email-nodes.js';
import { splitVariables } from './sms-text.js';
import type { EditorEmailBlock } from './types.js';

/** What an export reads off the profile: the kinds it carries, which decide what folds into a paragraph. */
export interface EmailExportOptions {
  /** The profile's kinds; without them a heading and a quote fold into a paragraph, as a mail layout's do. */
  readonly kinds?: readonly string[];
}

/** A heading's level in an email: 1 to 3, a deeper one drawn at 3. */
const EMAIL_HEADING_LEVEL_MAX = 3;

/** Attributes a kind keeps out of `attributes` because its content lives in them: a button's label and href. */
const CONTENT_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = { button: ['label', 'href'] };

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function textOf(node: NodeJSON): string {
  return (node.content ?? []).map((child) => child.text ?? '').join('');
}

function inlineText(node: NodeJSON): string {
  if (node.type === 'variable') return `{{${str(node.attrs?.name)}}}`;
  if (node.type === 'hardBreak') return '\n';
  return node.text ?? '';
}

/** The href a link mark carries; a mark stored before hrefs held text names one url variable instead. */
function hrefOf(mark: MarkJSON | undefined): string | undefined {
  const { href, variable } = mark?.attrs ?? {};
  if (typeof href === 'string') return href;
  return typeof variable === 'string' ? `{{${variable}}}` : undefined;
}

/** The runs `nodes` spell; consecutive nodes under one href join into one link run. */
function runsOf(nodes: readonly NodeJSON[]): InlineRun[] {
  const runs: InlineRun[] = [];
  for (const node of nodes) {
    const text = inlineText(node);
    if (text === '') continue;
    const marks = node.marks ?? [];
    const part: InlineText = {
      kind: 'text',
      text,
      bold: marks.some((mark) => mark.type === 'bold'),
      italic: marks.some((mark) => mark.type === 'italic'),
    };
    const href = hrefOf(marks.find((mark) => mark.type === 'emailLink'));
    if (href === undefined) {
      runs.push(part);
      continue;
    }
    const last = runs.at(-1);
    if (last?.kind === 'link' && last.href === href) {
      runs[runs.length - 1] = { ...last, label: [...last.label, part] };
    } else {
      runs.push({ kind: 'link', href, label: [part] } satisfies InlineLink);
    }
  }
  return runs;
}

function marksOf(part: InlineText, href?: string): MarkJSON[] {
  return [
    ...(part.bold ? [{ type: 'bold' }] : []),
    ...(part.italic ? [{ type: 'italic' }] : []),
    ...(href === undefined ? [] : [{ type: 'emailLink', attrs: { href } }]),
  ];
}

function withMarks(text: string, marks: MarkJSON[]): NodeJSON[] {
  return splitVariables(text).map((node) => (marks.length === 0 ? node : { ...node, marks }));
}

/** The inline nodes `source` reads as. A source that is not valid markup is kept as plain text, for the author to fix. */
export function inlineOf(source: string): NodeJSON[] {
  const parsed = parseInlineMarkup(source);
  if (!parsed.ok) return withMarks(source, []);
  return parsed.runs.flatMap((run) =>
    run.kind === 'text'
      ? withMarks(run.text, marksOf(run))
      : run.label.flatMap((part) => withMarks(part.text, marksOf(part, run.href))),
  );
}

function printed(nodes: readonly NodeJSON[]): string {
  return printInlineMarkup(runsOf(nodes));
}

/**
 * The markup of `nodes`: `source` as stored when the nodes still read as it did on import, else the
 * canonical print. Printing is canonical, so a stored text that spells the same runs another way would
 * otherwise change, and a translation of it would go stale, with no edit.
 */
export function markupOf(nodes: readonly NodeJSON[], source: unknown): string {
  const current = printed(nodes);
  return typeof source === 'string' && printed(inlineOf(source)) === current ? source : current;
}

// House attribute schemas are optional, never nullable: a null here is an engine's blank, not a stored value.
function present(attrs: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value !== undefined && value !== null));
}

function attributesOf(node: NodeJSON): Record<string, unknown> {
  const { id, key, ...rest } = node.attrs ?? {};
  void id;
  void key;
  delete rest.source;
  for (const name of CONTENT_ATTRIBUTES[node.type] ?? []) delete rest[name];
  return present(rest);
}

/** The email attributes a document node carries, by `EMAIL_GLOBAL_ATTRIBUTES`; the rest of its attributes are the document's own. */
function carriedAttributes(node: NodeJSON): Record<string, unknown> {
  const names = (EMAIL_GLOBAL_ATTRIBUTES[node.type] ?? []).filter((name) => name !== 'source');
  return present(Object.fromEntries(names.map((name) => [name, node.attrs?.[name]])));
}

/** The paragraphs of `node`, in order, however deep: a heading, a paragraph and a code block each read as one. */
function textblocksOf(node: NodeJSON): NodeJSON[] {
  if (node.type === 'paragraph' || node.type === 'heading') return [node];
  if (node.type === 'codeBlock') return [{ type: 'paragraph', content: plainContent(str(node.attrs?.code)) }];
  return (node.content ?? []).flatMap(textblocksOf);
}

/** The markup of the paragraphs of `node` joined by a space; a lone paragraph keeps its stored `source`. */
function joinedMarkup(node: NodeJSON, source?: unknown): string {
  const blocks = textblocksOf(node);
  if (blocks.length === 1) return markupOf(blocks[0].content ?? [], source ?? blocks[0].attrs?.source);
  return blocks.map((block) => printed(block.content ?? [])).join(' ');
}

function identityOf(node: NodeJSON): Pick<EditorEmailBlock, 'id' | 'key'> {
  const { id, key } = node.attrs ?? {};
  return { id: typeof id === 'string' ? id : null, key: str(key) };
}

function nodeOf(
  block: EmailBlockJSON,
  type: string,
  rest: Partial<NodeJSON> = {},
  own: Record<string, unknown> = {},
): NodeJSON {
  return { type, attrs: { ...block.attributes, id: block.id, key: block.key, ...own }, ...rest };
}

function plainContent(text: string): NodeJSON[] | undefined {
  return text === '' ? undefined : [{ type: 'text', text }];
}

function withContent(content: NodeJSON[] | undefined): Partial<NodeJSON> {
  return content === undefined || content.length === 0 ? {} : { content };
}

/** The rows a document table holds as text: a merged cell padded with empty ones, each row to the widest. */
function rowsOf(table: NodeJSON): string[][] {
  const rows = (table.content ?? []).map((row) =>
    (row.content ?? []).flatMap((cell) => {
      const span = Number(cell.attrs?.colspan);
      const padding = Number.isInteger(span) && span > 1 ? Array<string>(span - 1).fill('') : [];
      return [joinedMarkup(cell), ...padding];
    }),
  );
  const widest = Math.max(0, ...rows.map((row) => row.length));
  return rows.map((row) => [...row, ...Array<string>(widest - row.length).fill('')]);
}

/** The image's width as an email draws it: a whole number of pixels up to the card's, or none. */
function imageWidth(width: unknown): Record<string, number> {
  if (typeof width !== 'number' || !Number.isFinite(width) || width < 1) return {};
  return { width: Math.min(Math.round(width), IMAGE_MAX_WIDTH) };
}

function exportBlock(node: NodeJSON, codecs: readonly NodeCodec[], kinds: ReadonlySet<string>): EditorEmailBlock {
  const base = { ...identityOf(node), type: '' };
  const attributes = attributesOf(node);
  const custom = codecs.find((codec) => codec.node === node.type && codec.toEmailBlock !== undefined);
  switch (node.type) {
    case 'paragraph':
      return {
        ...base,
        type: 'paragraph',
        attributes,
        content: { text: markupOf(node.content ?? [], node.attrs?.source) },
      };
    case 'heading': {
      if (!kinds.has('heading')) {
        return { ...base, type: 'paragraph', attributes: {}, content: { text: joinedMarkup(node) } };
      }
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 1), EMAIL_HEADING_LEVEL_MAX);
      return {
        ...base,
        type: 'heading',
        attributes: { level, ...carriedAttributes(node) },
        content: { text: markupOf(node.content ?? [], node.attrs?.source) },
      };
    }
    case 'blockquote':
      if (!kinds.has('quote')) {
        return { ...base, type: 'paragraph', attributes: {}, content: { text: joinedMarkup(node) } };
      }
      return {
        ...base,
        type: 'quote',
        attributes: carriedAttributes(node),
        content: { text: joinedMarkup(node, node.attrs?.source) },
      };
    case 'image': {
      const { src, alt, caption, href } = node.attrs ?? {};
      return {
        ...base,
        type: 'image',
        attributes: { ...carriedAttributes(node), ...imageWidth(node.attrs?.width) },
        content: {
          src: str(src),
          alt: str(alt),
          ...(str(caption) === '' ? {} : { caption: str(caption) }),
          ...(str(href) === '' ? {} : { href: str(href) }),
        },
      };
    }
    case 'table': {
      const rows = node.content ?? [];
      const header = rows.length > 0 && (rows[0].content ?? []).every((cell) => cell.type === 'tableHeader');
      return {
        ...base,
        type: 'table',
        attributes: {
          ...(header && (rows[0].content ?? []).length > 0 ? { header: true } : {}),
          ...carriedAttributes(node),
        },
        content: { rows: rowsOf(node) },
      };
    }
    case 'callout':
      return {
        ...base,
        type: 'callout',
        attributes: carriedAttributes(node),
        content: { text: joinedMarkup(node, node.attrs?.source) },
      };
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
      return {
        ...base,
        type: 'list',
        attributes: carriedAttributes(node),
        content: { items: (node.content ?? []).map((item) => joinedMarkup(item)) },
      };
    case 'button': {
      const { label, href } = node.attrs ?? {};
      return { ...base, type: 'button', attributes, content: present({ label, href }) };
    }
    case 'codeBlock':
      return { ...base, type: 'code', attributes: carriedAttributes(node), content: { code: str(node.attrs?.code) } };
    case 'emailHtml':
      return { ...base, type: 'html', attributes, content: { html: textOf(node) } };
    case 'horizontalRule':
      return { ...base, type: 'divider', attributes: carriedAttributes(node), content: {} };
    case 'columns':
      return {
        ...base,
        type: 'columns',
        attributes,
        content: {},
        lanes: (node.content ?? []).map((lane) =>
          (lane.content ?? []).map((child) => exportBlock(child, codecs, kinds)),
        ),
      };
    case 'emailUnknown':
      return {
        ...(node.attrs?.block as EditorEmailBlock),
        ...(node.attrs && 'id' in node.attrs ? { id: base.id } : {}),
        ...(node.attrs && 'key' in node.attrs ? { key: base.key } : {}),
      };
    default: {
      if (!custom?.toEmailBlock) return { ...base, type: node.type, attributes, content: {} };
      const exported = custom.toEmailBlock(node);
      // A codec's node that holds lanes, as a product's lanes block does, exports them as a columns block does.
      const lanes = node.content ?? [];
      return lanes.length > 0 && lanes.every((lane) => lane.type === 'column')
        ? {
            ...exported,
            lanes: lanes.map((lane) => (lane.content ?? []).map((child) => exportBlock(child, codecs, kinds))),
          }
        : exported;
    }
  }
}

function importBlock(block: EmailBlockJSON, codecs: readonly NodeCodec[]): NodeJSON {
  const text = str(block.content.text);
  switch (block.type) {
    case 'paragraph':
      return nodeOf(block, 'paragraph', withContent(inlineOf(text)), { source: text });
    case 'callout':
      return nodeOf(
        block,
        'callout',
        { content: [{ type: 'paragraph', ...withContent(inlineOf(text)) }] },
        { variant: 'info', source: text },
      );
    case 'list': {
      const items = Array.isArray(block.content.items) ? block.content.items : [];
      const content = items.map((item): NodeJSON => ({
        type: 'listItem',
        content: [{ type: 'paragraph', attrs: { source: str(item) }, ...withContent(inlineOf(str(item))) }],
      }));
      return nodeOf(block, 'bulletList', { content });
    }
    case 'heading': {
      const level = block.attributes.level;
      return nodeOf(block, 'heading', withContent(inlineOf(text)), {
        level: level === 1 || level === 3 ? level : 2,
        source: text,
      });
    }
    case 'quote':
      return nodeOf(
        block,
        'blockquote',
        { content: [{ type: 'paragraph', ...withContent(inlineOf(text)) }] },
        { source: text },
      );
    case 'image': {
      const { src, alt, caption, href } = block.content;
      return nodeOf(
        block,
        'image',
        {},
        {
          src: str(src),
          alt: str(alt),
          title: '',
          width: typeof block.attributes.width === 'number' ? block.attributes.width : null,
          caption: str(caption),
          href: str(href),
        },
      );
    }
    case 'table': {
      const rows = Array.isArray(block.content.rows) ? (block.content.rows as unknown[]) : [];
      const header = block.attributes.header === true;
      const content = rows.map((row, index): NodeJSON => ({
        type: 'tableRow',
        content: (Array.isArray(row) ? row : []).map((cell): NodeJSON => ({
          type: header && index === 0 ? 'tableHeader' : 'tableCell',
          content: [{ type: 'paragraph', attrs: { source: str(cell) }, ...withContent(inlineOf(str(cell))) }],
        })),
      }));
      return nodeOf(block, 'table', withContent(content));
    }
    case 'button':
      return nodeOf(block, 'button', {}, present({ label: block.content.label, href: block.content.href }));
    case 'code':
      return nodeOf(block, 'codeBlock', {}, { language: 'text', code: str(block.content.code) });
    case 'html':
      return nodeOf(block, 'emailHtml', withContent(plainContent(str(block.content.html))));
    case 'divider':
      return nodeOf(block, 'horizontalRule');
    case 'columns': {
      const content = (block.lanes ?? []).map((lane): NodeJSON => ({
        type: 'column',
        content: lane.map((child) => importBlock(child, codecs)),
      }));
      return nodeOf(block, 'columns', { content });
    }
    default:
      for (const codec of codecs) {
        const node = codec.fromEmailBlock?.(block);
        const lanes = node?.content ?? [];
        // A codec's node that holds lanes, as a product's lanes block does, takes them as a columns block does.
        if (node && block.lanes !== undefined && lanes.length > 0 && lanes.every((lane) => lane.type === 'column')) {
          const content = block.lanes.map((lane): NodeJSON => ({
            type: 'column',
            content: lane.map((child) => importBlock(child, codecs)),
          }));
          return { ...node, content };
        }
        if (node) return node;
      }
      return { type: 'emailUnknown', attrs: { id: block.id, key: block.key, block } };
  }
}

/**
 * The email blocks `doc` holds, in order. A node `codecs` have an email codec for exports through it; an
 * `emailUnknown` atom exports its block as it came. A heading or a blockquote the profile's `kinds` do not carry
 * folds into a paragraph.
 */
export function toEmailBlocks(
  doc: DocJSON,
  codecs: readonly NodeCodec[] = [],
  options: EmailExportOptions = {},
): EditorEmailBlock[] {
  const kinds = new Set(options.kinds ?? []);
  return (doc.content ?? []).map((node) => exportBlock(node, codecs, kinds));
}

/** The document `blocks` read as. A block type with no codec stays in it as an `emailUnknown` atom holding the block. */
export function fromEmailBlocks(blocks: readonly EditorEmailBlock[], codecs: readonly NodeCodec[] = []): DocJSON {
  return { type: 'doc', content: blocks.map((block) => importBlock(block, codecs)) };
}
