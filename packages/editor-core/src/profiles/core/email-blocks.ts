import type { DocJSON, EmailBlockJSON, MarkJSON, NodeCodec, NodeJSON } from '../../document/core/types/index.js';
import {
  parseInlineMarkup,
  printInlineMarkup,
  type InlineLink,
  type InlineRun,
  type InlineText,
} from '../../template/index.js';
import { libraryBlocks, type LibraryBlockType } from '../../template/email/blocks/index.js';
import { EMAIL_SECTION_WIDTHS } from '../../template/email/blocks/section.js';
import { CONTENT_WIDTH, emailAlignOf, layoutAlignOf, type Align } from '../../template/email/blocks/shared.js';
import {
  ALIGNS,
  COLOR_TOKENS,
  DOCUMENT_CONTENT_WIDTH,
  PARAGRAPH_SIZES,
  SECTION_BACKGROUNDS,
  SPACES,
  snapWidth,
  VALIGNS,
  widthFromPixels,
  type ColorToken,
  type LayoutAlign,
} from '../../template/layout/index.js';
import { emailBlockCodec } from './email-block-codec.js';
import { EMAIL_KINDS } from './profile.js';
import { splitVariables } from './sms-text.js';
import type { EditorEmailBlock } from './types.js';

/** What an export reads off the profile: the kinds it carries, which decide what folds into a paragraph. */
export interface EmailExportOptions {
  /** The profile's kinds, which a heading or a quote folds into a paragraph without; every email kind when absent. */
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

/** The colour token a `textColor` or `textBackground` mark names; none for `default` or a name outside the set. */
function paintOf(marks: readonly MarkJSON[], type: 'textColor' | 'textBackground'): ColorToken | undefined {
  const token = marks.find((mark) => mark.type === type)?.attrs?.token;
  return typeof token === 'string' && token !== 'default' && (COLOR_TOKENS as readonly string[]).includes(token)
    ? (token as ColorToken)
    : undefined;
}

/** The runs `nodes` spell; consecutive nodes under one href join into one link run. */
function runsOf(nodes: readonly NodeJSON[]): InlineRun[] {
  const runs: InlineRun[] = [];
  for (const node of nodes) {
    const text = inlineText(node);
    if (text === '') continue;
    const marks = node.marks ?? [];
    const color = paintOf(marks, 'textColor');
    const background = paintOf(marks, 'textBackground');
    const part: InlineText = {
      kind: 'text',
      text,
      bold: marks.some((mark) => mark.type === 'bold'),
      italic: marks.some((mark) => mark.type === 'italic'),
      ...(color === undefined ? {} : { color }),
      ...(background === undefined ? {} : { background }),
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
    ...(part.color === undefined ? [] : [{ type: 'textColor', attrs: { token: part.color } }]),
    ...(part.background === undefined ? [] : [{ type: 'textBackground', attrs: { token: part.background } }]),
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
  delete rest.stored;
  for (const name of CONTENT_ATTRIBUTES[node.type] ?? []) delete rest[name];
  return present(rest);
}

/** `value` where it is one of `values`, else undefined. */
function oneOf<T extends string>(values: readonly T[], value: unknown): T | undefined {
  return typeof value === 'string' && (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** A document alignment as the wire names it; a document written before the layout names holds the wire's own. */
function wireAlign(value: unknown): Align | undefined {
  if (value === 'left' || value === 'right') return value;
  const align = oneOf(ALIGNS, value);
  return align === undefined ? undefined : emailAlignOf(align);
}

/** A text block's alignment on the wire: `justify`, which no email draws, is written as `left`. */
function wireTextAlign(node: NodeJSON | undefined): Align | undefined {
  // A text block written before `textAlign` holds its alignment as `align`, in the wire's names.
  const value = node?.attrs?.textAlign ?? node?.attrs?.align;
  return value === 'justify' ? 'left' : wireAlign(value);
}

/** The space before and after a document block, where each is a token. */
function spacesOf(node: NodeJSON): Record<string, unknown> {
  return present({
    spaceBefore: oneOf(SPACES, node.attrs?.spaceBefore),
    spaceAfter: oneOf(SPACES, node.attrs?.spaceAfter),
  });
}

/** The first paragraph or heading in `node`, whose alignment a quote, a list and a callout take on the wire. */
function firstTextblock(node: NodeJSON): NodeJSON | undefined {
  return textblocksOf(node)[0];
}

/** A quote's, a list's or a callout's alignment: its own, from a document written before `textAlign`, or its first line's. */
function containerAlign(node: NodeJSON): Align | undefined {
  return wireTextAlign(firstTextblock(node)) ?? wireAlign(node.attrs?.align);
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

/** A default block's node: its identity and the attributes its import names, none copied from the wire as stored. */
function layoutNodeOf(
  block: EmailBlockJSON,
  type: string,
  rest: Partial<NodeJSON> = {},
  attrs: Record<string, unknown> = {},
): NodeJSON {
  return { type, attrs: { id: block.id, key: block.key, ...attrs }, ...rest };
}

function plainContent(text: string): NodeJSON[] | undefined {
  return text === '' ? undefined : [{ type: 'text', text }];
}

function withContent(content: NodeJSON[] | undefined): Partial<NodeJSON> {
  return content === undefined || content.length === 0 ? {} : { content };
}

/** A cell's span along one axis: a whole number of at least 1. */
function spanOf(cell: NodeJSON, name: 'colspan' | 'rowspan'): number {
  const span = Number(cell.attrs?.[name]);
  return Number.isInteger(span) && span > 1 ? span : 1;
}

/**
 * The rows a document table holds as text: a merged cell's text in its first place and empty ones in the rest of
 * the places it spans, across and down, so each cell keeps its column; each row padded to the widest.
 */
function rowsOf(table: NodeJSON): string[][] {
  const rows: string[][] = [];
  // The places a cell from a row above still covers: for each column, the rows it spans below its own.
  const covered: number[] = [];
  for (const row of table.content ?? []) {
    const drawn: string[] = [];
    const take = () => {
      while ((covered[drawn.length] ?? 0) > 0) {
        covered[drawn.length] -= 1;
        drawn.push('');
      }
    };
    for (const cell of row.content ?? []) {
      take();
      const across = spanOf(cell, 'colspan');
      const down = spanOf(cell, 'rowspan');
      for (let offset = 0; offset < across; offset += 1) {
        covered[drawn.length] = down - 1;
        drawn.push(offset === 0 ? joinedMarkup(cell) : '');
      }
    }
    // A cell from a row above may still cover a column past this row's last cell: count it down there too.
    for (let column = drawn.length; column < covered.length; column += 1) {
      if ((covered[column] ?? 0) === 0) continue;
      covered[column] -= 1;
      while (drawn.length < column) drawn.push('');
      drawn.push('');
    }
    rows.push(drawn);
  }
  const widest = Math.max(0, ...rows.map((row) => row.length));
  return rows.map((row) => [...row, ...Array<string>(widest - row.length).fill('')]);
}

/** The defaults a stored block may leave out or write, which read back the same: by type, the value each holds. */
const STORED_DEFAULTS: Readonly<
  Record<string, { attributes: Record<string, unknown>; content: Record<string, unknown> }>
> = {
  heading: { attributes: { level: 2 }, content: {} },
  image: { attributes: {}, content: { caption: '', href: '' } },
  table: { attributes: { header: false }, content: {} },
};

/**
 * A library block's defaults: each attribute's default, and an empty text field, which the codec writes for a
 * field a stored block leaves out.
 */
function libraryDefaultsOf(type: string): (typeof STORED_DEFAULTS)[string] | undefined {
  if (!Object.hasOwn(libraryBlocks, type)) return undefined;
  const { editor } = libraryBlocks[type as LibraryBlockType];
  return {
    attributes: Object.fromEntries(editor.attributes.map((attribute) => [attribute.name, attribute.default])),
    content: Object.fromEntries(
      [...(editor.body === null ? [] : [editor.body.name]), ...editor.fields.map(({ name }) => name)].map((name) => [
        name,
        '',
      ]),
    ),
  };
}

/** `value` with every object's keys in order at any depth, so two that differ only in key order are equal. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([name, entry]) => [name, canonical(entry)]),
  );
}

/** `values` without the entries that hold their default, keys in order at any depth, as text to compare. */
function withoutDefaults(values: unknown, defaults: Record<string, unknown>): string {
  const entries = Object.entries(typeof values === 'object' && values !== null ? values : {}).filter(
    ([name, value]) => value !== undefined && defaults[name] !== value,
  );
  return JSON.stringify(canonical(Object.fromEntries(entries)));
}

/**
 * `exported` as the block stored in `node`'s `stored` attribute where the two differ only by a default one
 * leaves out and the other writes, so a block opened and saved unedited is saved as it came.
 */
function asStored(node: NodeJSON, exported: EditorEmailBlock): EditorEmailBlock {
  const stored = node.attrs?.stored as { attributes?: unknown; content?: unknown } | null | undefined;
  const defaults = STORED_DEFAULTS[exported.type] ?? libraryDefaultsOf(exported.type);
  if (!stored || !defaults) return exported;
  const same =
    withoutDefaults(stored.attributes, defaults.attributes) ===
      withoutDefaults(exported.attributes, defaults.attributes) &&
    withoutDefaults(stored.content, defaults.content) === withoutDefaults(exported.content, defaults.content);
  if (!same) return exported;
  // A copy, so a host changing the export leaves the document's stored block as it was.
  const copy = structuredClone(stored) as Pick<EditorEmailBlock, 'attributes' | 'content'>;
  return { ...exported, attributes: copy.attributes, content: copy.content };
}

/**
 * A document image's width as the wire stores it: a fraction, `full` written as the whole width, which the email
 * draws at the card's content width, and a Document's legacy pixel width read against the Document's content width.
 */
function wireImageWidth(width: unknown): Record<string, number> {
  if (width === 'full') return { width: 1 };
  if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) return {};
  return { width: width <= 1 ? snapWidth(width) : widthFromPixels(width, DOCUMENT_CONTENT_WIDTH) };
}

/** A wire image's width as the document holds it: a fraction, a legacy whole-pixel width read against the card's. */
function documentImageWidth(width: unknown): number | null {
  if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) return null;
  return width <= 1 ? width : widthFromPixels(width, CONTENT_WIDTH);
}

/** A section's attributes on the wire: a `full` width, which no email draws, is written as `wide`. */
function wireSection(node: NodeJSON): Record<string, unknown> {
  const attrs = node.attrs ?? {};
  return present({
    background: oneOf(SECTION_BACKGROUNDS, attrs.background),
    padding: oneOf(SPACES, attrs.padding),
    width: attrs.width === 'full' ? 'wide' : oneOf(EMAIL_SECTION_WIDTHS, attrs.width),
    ...spacesOf(node),
  });
}

/** A table's column widths, where each is a share of at least a twentieth. */
function columnWidthsOf(value: unknown): number[] | undefined {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every((width) => typeof width === 'number' && width >= 0.05 && width <= 1)
    ? (value as number[])
    : undefined;
}

/** A wire alignment as the document holds it. */
function documentAlign(value: unknown): LayoutAlign | undefined {
  const align = oneOf(['left', 'center', 'right'] as const, value);
  return align === undefined ? undefined : layoutAlignOf(align);
}

/** The wire's space before and after a block, for its document node. */
function documentSpaces(block: EmailBlockJSON): Record<string, unknown> {
  return present({
    spaceBefore: oneOf(SPACES, block.attributes.spaceBefore),
    spaceAfter: oneOf(SPACES, block.attributes.spaceAfter),
  });
}

/** A paragraph holding `text`, aligned as the wire block holding it was. */
function alignedParagraph(text: string, align: unknown, attrs: Record<string, unknown> = {}): NodeJSON {
  const textAlign = documentAlign(align);
  const all = { ...attrs, ...(textAlign === undefined ? {} : { textAlign }) };
  return {
    type: 'paragraph',
    ...(Object.keys(all).length === 0 ? {} : { attrs: all }),
    ...withContent(inlineOf(text)),
  };
}

const libraryCodecs = new Map<string, NodeCodec>();

/**
 * The codec of the library block `type` is, or undefined for another type. Built on first use, since the codec
 * module reads this one's markup helpers as it loads.
 */
function libraryCodecOf(type: string): NodeCodec | undefined {
  if (!Object.hasOwn(libraryBlocks, type)) return undefined;
  let codec = libraryCodecs.get(type);
  if (!codec) libraryCodecs.set(type, (codec = emailBlockCodec(libraryBlocks[type as LibraryBlockType].editor)));
  return codec;
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
        attributes: present({
          align: wireTextAlign(node),
          ...spacesOf(node),
          tone: oneOf(['default', 'muted'] as const, node.attrs?.tone),
          size: oneOf(PARAGRAPH_SIZES, node.attrs?.size),
        }),
        content: { text: markupOf(node.content ?? [], node.attrs?.source) },
      };
    case 'heading': {
      if (!kinds.has('heading')) {
        return { ...base, type: 'paragraph', attributes: {}, content: { text: joinedMarkup(node) } };
      }
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 1), EMAIL_HEADING_LEVEL_MAX);
      return asStored(node, {
        ...base,
        type: 'heading',
        attributes: { level, ...present({ align: wireTextAlign(node), ...spacesOf(node) }) },
        content: { text: markupOf(node.content ?? [], node.attrs?.source) },
      });
    }
    case 'blockquote':
      if (!kinds.has('quote')) {
        return {
          ...base,
          type: 'paragraph',
          attributes: {},
          content: { text: joinedMarkup(node, node.attrs?.source) },
        };
      }
      return {
        ...base,
        type: 'quote',
        attributes: present({ align: containerAlign(node), ...spacesOf(node) }),
        content: { text: joinedMarkup(node, node.attrs?.source) },
      };
    case 'image': {
      const { src, alt, caption, href } = node.attrs ?? {};
      return asStored(node, {
        ...base,
        type: 'image',
        attributes: present({
          align: wireAlign(node.attrs?.align),
          ...wireImageWidth(node.attrs?.width),
          ...spacesOf(node),
        }),
        content: {
          src: str(src),
          alt: str(alt),
          ...(str(caption) === '' ? {} : { caption: str(caption) }),
          ...(str(href) === '' ? {} : { href: str(href) }),
        },
      });
    }
    case 'table': {
      const rows = node.content ?? [];
      const header = rows.length > 0 && (rows[0].content ?? []).every((cell) => cell.type === 'tableHeader');
      return asStored(node, {
        ...base,
        type: 'table',
        attributes: {
          ...(header && (rows[0].content ?? []).length > 0 ? { header: true } : {}),
          ...present({ columnWidths: columnWidthsOf(node.attrs?.columnWidths), ...spacesOf(node) }),
        },
        content: { rows: rowsOf(node) },
      });
    }
    case 'callout':
      return {
        ...base,
        type: 'callout',
        attributes: present({ align: containerAlign(node), ...spacesOf(node) }),
        content: { text: joinedMarkup(node, node.attrs?.source) },
      };
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
      return {
        ...base,
        type: 'list',
        attributes: present({ align: containerAlign(node), ...spacesOf(node) }),
        content: { items: (node.content ?? []).map((item) => joinedMarkup(item)) },
      };
    case 'button': {
      const { label, href, width } = node.attrs ?? {};
      return {
        ...base,
        type: 'button',
        attributes: present({
          align: wireAlign(node.attrs?.align),
          ...spacesOf(node),
          width: oneOf(['inline', 'full'] as const, width),
        }),
        content: present({ label, href }),
      };
    }
    case 'codeBlock':
      return {
        ...base,
        type: 'code',
        attributes: present({ align: wireAlign(node.attrs?.align), ...spacesOf(node) }),
        content: { code: str(node.attrs?.code) },
      };
    case 'emailHtml':
      return { ...base, type: 'html', attributes: spacesOf(node), content: { html: textOf(node) } };
    case 'horizontalRule':
      return { ...base, type: 'divider', attributes: spacesOf(node), content: {} };
    case 'section':
      return {
        ...base,
        type: 'section',
        attributes: wireSection(node),
        content: {},
        lanes: [(node.content ?? []).map((child) => exportBlock(child, codecs, kinds))],
      };
    case 'columns':
      return {
        ...base,
        type: 'columns',
        attributes: present({
          ratio: node.attrs?.ratio,
          valign: oneOf(VALIGNS, node.attrs?.valign),
          ...spacesOf(node),
        }),
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
      const library = libraryCodecOf(node.type);
      if (library?.toEmailBlock) return asStored(node, library.toEmailBlock(node) as EditorEmailBlock);
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

/** What an unedited export of `block` saves it back as. */
function storedOf(block: EmailBlockJSON): { attributes: unknown; content: unknown } {
  return { attributes: block.attributes, content: block.content };
}

function importBlock(block: EmailBlockJSON, codecs: readonly NodeCodec[]): NodeJSON {
  const text = str(block.content.text);
  const align = block.attributes.align;
  switch (block.type) {
    case 'paragraph': {
      const textAlign = documentAlign(align);
      return layoutNodeOf(block, 'paragraph', withContent(inlineOf(text)), {
        ...(textAlign === undefined ? {} : { textAlign }),
        ...documentSpaces(block),
        ...present({ tone: block.attributes.tone, size: oneOf(PARAGRAPH_SIZES, block.attributes.size) }),
        source: text,
      });
    }
    case 'callout':
      return layoutNodeOf(
        block,
        'callout',
        { content: [alignedParagraph(text, align)] },
        { variant: 'info', ...documentSpaces(block), source: text },
      );
    case 'list': {
      const items = Array.isArray(block.content.items) ? block.content.items : [];
      const content = items.map((item): NodeJSON => ({
        type: 'listItem',
        content: [alignedParagraph(str(item), align, { source: str(item) })],
      }));
      return layoutNodeOf(block, 'bulletList', { content }, documentSpaces(block));
    }
    case 'heading': {
      const level = block.attributes.level;
      const textAlign = documentAlign(align);
      return layoutNodeOf(block, 'heading', withContent(inlineOf(text)), {
        level: level === 1 || level === 3 ? level : 2,
        ...(textAlign === undefined ? {} : { textAlign }),
        ...documentSpaces(block),
        source: text,
        stored: storedOf(block),
      });
    }
    case 'quote':
      return layoutNodeOf(
        block,
        'blockquote',
        { content: [alignedParagraph(text, align)] },
        { ...documentSpaces(block), source: text },
      );
    case 'image': {
      const { src, alt, caption, href } = block.content;
      return layoutNodeOf(
        block,
        'image',
        {},
        {
          src: str(src),
          alt: str(alt),
          title: '',
          width: documentImageWidth(block.attributes.width),
          caption: str(caption),
          href: str(href),
          ...present({ align: documentAlign(align) }),
          ...documentSpaces(block),
          stored: storedOf(block),
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
      return layoutNodeOf(block, 'table', withContent(content), {
        ...present({ columnWidths: columnWidthsOf(block.attributes.columnWidths) }),
        ...documentSpaces(block),
        stored: storedOf(block),
      });
    }
    case 'button':
      return layoutNodeOf(
        block,
        'button',
        {},
        present({
          label: block.content.label,
          href: block.content.href,
          align: documentAlign(align),
          ...documentSpaces(block),
          width: block.attributes.width,
        }),
      );
    case 'code':
      return layoutNodeOf(
        block,
        'codeBlock',
        {},
        {
          language: 'text',
          code: str(block.content.code),
          ...present({ align: documentAlign(align) }),
          ...documentSpaces(block),
        },
      );
    case 'html':
      return layoutNodeOf(
        block,
        'emailHtml',
        withContent(plainContent(str(block.content.html))),
        documentSpaces(block),
      );
    case 'divider':
      return layoutNodeOf(block, 'horizontalRule', {}, documentSpaces(block));
    case 'section': {
      const blocks = (block.lanes?.[0] ?? []).map((child) => importBlock(child, codecs));
      return layoutNodeOf(
        block,
        'section',
        // A section holds at least one block; a stored one of none opens holding an empty paragraph.
        { content: blocks.length === 0 ? [{ type: 'paragraph' }] : blocks },
        present({
          background: oneOf(SECTION_BACKGROUNDS, block.attributes.background),
          padding: oneOf(SPACES, block.attributes.padding),
          width: oneOf(EMAIL_SECTION_WIDTHS, block.attributes.width),
          ...documentSpaces(block),
        }),
      );
    }
    case 'columns': {
      const content = (block.lanes ?? []).map((lane): NodeJSON => ({
        type: 'column',
        content: lane.map((child) => importBlock(child, codecs)),
      }));
      return layoutNodeOf(
        block,
        'columns',
        { content },
        present({
          ratio: block.attributes.ratio,
          valign: oneOf(VALIGNS, block.attributes.valign),
          ...documentSpaces(block),
        }),
      );
    }
    default: {
      const library = libraryCodecOf(block.type)?.fromEmailBlock?.(block);
      if (library) return { ...library, attrs: { ...library.attrs, stored: storedOf(block) } };
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
}

/**
 * The email blocks `doc` holds, in order. A node `codecs` have an email codec for exports through it; an
 * `emailUnknown` atom exports its block as it came. A heading or a blockquote the profile's `kinds` do not carry
 * folds into a paragraph; without `kinds` every email kind is carried. A stored heading, image or table opened
 * and saved unedited is saved as it came.
 */
export function toEmailBlocks(
  doc: DocJSON,
  codecs: readonly NodeCodec[] = [],
  options: EmailExportOptions = {},
): EditorEmailBlock[] {
  const kinds = new Set<string>(options.kinds ?? EMAIL_KINDS);
  return (doc.content ?? []).map((node) => exportBlock(node, codecs, kinds));
}

/** The document `blocks` read as. A block type with no codec stays in it as an `emailUnknown` atom holding the block. */
export function fromEmailBlocks(blocks: readonly EditorEmailBlock[], codecs: readonly NodeCodec[] = []): DocJSON {
  return { type: 'doc', content: blocks.map((block) => importBlock(block, codecs)) };
}
