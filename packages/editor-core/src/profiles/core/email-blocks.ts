import type { DocJSON, EmailBlockJSON, MarkJSON, NodeCodec, NodeJSON } from '../../document/core/types/index.js';
import {
  parseInlineMarkup,
  printInlineMarkup,
  type InlineLink,
  type InlineRun,
  type InlineText,
} from '../../template/index.js';
import { splitVariables } from './sms-text.js';
import type { EditorEmailBlock } from './types.js';

/** Attributes a kind keeps out of `attributes` because its content lives in them: a button's label and href. */
const CONTENT_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = { emailButton: ['label', 'href'] };

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

/** The runs `nodes` spell; consecutive nodes under one link join into one link run. */
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
    const variable = marks.find((mark) => mark.type === 'emailLink')?.attrs?.variable;
    if (typeof variable !== 'string') {
      runs.push(part);
      continue;
    }
    const last = runs.at(-1);
    if (last?.kind === 'link' && last.variable === variable) {
      runs[runs.length - 1] = { ...last, label: [...last.label, part] };
    } else {
      runs.push({ kind: 'link', variable, label: [part] } satisfies InlineLink);
    }
  }
  return runs;
}

function marksOf(part: InlineText, variable?: string): MarkJSON[] {
  return [
    ...(part.bold ? [{ type: 'bold' }] : []),
    ...(part.italic ? [{ type: 'italic' }] : []),
    ...(variable === undefined ? [] : [{ type: 'emailLink', attrs: { variable } }]),
  ];
}

function withMarks(text: string, marks: MarkJSON[]): NodeJSON[] {
  return splitVariables(text).map((node) => (marks.length === 0 ? node : { ...node, marks }));
}

/** The inline nodes `source` reads as. A source that is not valid markup is kept as plain text, for the author to fix. */
function inlineOf(source: string): NodeJSON[] {
  const parsed = parseInlineMarkup(source);
  if (!parsed.ok) return withMarks(source, []);
  return parsed.runs.flatMap((run) =>
    run.kind === 'text'
      ? withMarks(run.text, marksOf(run))
      : run.label.flatMap((part) => withMarks(part.text, marksOf(part, run.variable))),
  );
}

function present(attrs: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value !== undefined && value !== null));
}

function attributesOf(node: NodeJSON): Record<string, unknown> {
  const { id, key, ...rest } = node.attrs ?? {};
  void id;
  void key;
  for (const name of CONTENT_ATTRIBUTES[node.type] ?? []) delete rest[name];
  return present(rest);
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
  return { type, attrs: { id: block.id, key: block.key, ...own, ...block.attributes }, ...rest };
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
        content: { text: printInlineMarkup(runsOf(node.content ?? [])) },
      };
    case 'emailCallout':
      return { ...base, type: 'callout', attributes, content: { text: printInlineMarkup(runsOf(node.content ?? [])) } };
    case 'emailList':
      return {
        ...base,
        type: 'list',
        attributes,
        content: { items: (node.content ?? []).map((item) => printInlineMarkup(runsOf(item.content ?? []))) },
      };
    case 'emailButton': {
      const { label, href } = node.attrs ?? {};
      return { ...base, type: 'button', attributes, content: present({ label, href }) };
    }
    case 'emailCode':
      return { ...base, type: 'code', attributes, content: { code: textOf(node) } };
    case 'emailHtml':
      return { ...base, type: 'html', attributes, content: { html: textOf(node) } };
    case 'emailDivider':
      return { ...base, type: 'divider', attributes, content: {} };
    case 'emailColumns':
      return {
        ...base,
        type: 'columns',
        attributes,
        content: {},
        lanes: (node.content ?? []).map((lane) => (lane.content ?? []).map((child) => exportBlock(child, codecs))),
      };
    case 'emailUnknown':
      return node.attrs?.block as EditorEmailBlock;
    default:
      if (custom?.toEmailBlock) return custom.toEmailBlock(node);
      return { ...base, type: node.type, attributes, content: {} };
  }
}

function importBlock(block: EmailBlockJSON, codecs: readonly NodeCodec[]): NodeJSON {
  const text = str(block.content.text);
  switch (block.type) {
    case 'paragraph':
      return nodeOf(block, 'paragraph', withContent(inlineOf(text)));
    case 'callout':
      return nodeOf(block, 'emailCallout', withContent(inlineOf(text)));
    case 'list': {
      const items = Array.isArray(block.content.items) ? block.content.items : [];
      const content = items.map((item): NodeJSON => ({ type: 'emailListItem', ...withContent(inlineOf(str(item))) }));
      return nodeOf(block, 'emailList', { content });
    }
    case 'button':
      return nodeOf(block, 'emailButton', {}, present({ label: block.content.label, href: block.content.href }));
    case 'code':
      return nodeOf(block, 'emailCode', withContent(plainContent(str(block.content.code))));
    case 'html':
      return nodeOf(block, 'emailHtml', withContent(plainContent(str(block.content.html))));
    case 'divider':
      return nodeOf(block, 'emailDivider');
    case 'columns': {
      const content = (block.lanes ?? []).map((lane): NodeJSON => ({
        type: 'emailLane',
        content: lane.map((child) => importBlock(child, codecs)),
      }));
      return nodeOf(block, 'emailColumns', { content });
    }
    default:
      for (const codec of codecs) {
        const node = codec.fromEmailBlock?.(block);
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
