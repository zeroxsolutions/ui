import type { DocJSON, EmailBlockJSON, MarkJSON, NodeCodec, NodeJSON } from '../../document/core/types/index.js';
import {
  parseInlineMarkup,
  printInlineMarkup,
  type InlineLink,
  type InlineRun,
  type InlineText,
} from '../../template/index.js';
import { EMAIL_GLOBAL_ATTRIBUTES } from './email-nodes.js';
import { splitVariables } from './sms-text.js';
import type { EditorEmailBlock } from './types.js';

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

function exportBlock(node: NodeJSON, codecs: readonly NodeCodec[]): EditorEmailBlock {
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
    case 'heading':
    case 'blockquote':
      return { ...base, type: 'paragraph', attributes: {}, content: { text: joinedMarkup(node) } };
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
        lanes: (node.content ?? []).map((lane) => (lane.content ?? []).map((child) => exportBlock(child, codecs))),
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
        ? { ...exported, lanes: lanes.map((lane) => (lane.content ?? []).map((child) => exportBlock(child, codecs))) }
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

/** The email blocks `doc` holds, in order. A node `codecs` have an email codec for exports through it; an `emailUnknown` atom exports its block as it came. */
export function toEmailBlocks(doc: DocJSON, codecs: readonly NodeCodec[] = []): EditorEmailBlock[] {
  return (doc.content ?? []).map((node) => exportBlock(node, codecs));
}

/** The document `blocks` read as. A block type with no codec stays in it as an `emailUnknown` atom holding the block. */
export function fromEmailBlocks(blocks: readonly EditorEmailBlock[], codecs: readonly NodeCodec[] = []): DocJSON {
  return { type: 'doc', content: blocks.map((block) => importBlock(block, codecs)) };
}
