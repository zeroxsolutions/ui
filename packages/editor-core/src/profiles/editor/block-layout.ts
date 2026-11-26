/**
 * The layout model on a document's own nodes: the attributes each block type takes, their HTML, the text and
 * background colour marks, the commands that set them, and the reading of pixel widths an older document stored.
 */
import { z } from 'zod';
import {
  CONTENT_LOAD_META,
  Extension,
  Mark,
  Plugin,
  PluginKey,
  Selection,
  facadeFor,
} from '../../document/advanced.js';
import type { Editor, EngineHandle } from '../../document/advanced.js';
import type { EditorFeature, IEditor, NodeJSON } from '../../document/core/types/index.js';
import {
  colorTokenFromElement,
  layoutDataAttributes,
  layoutFromElement,
  type LayoutAttributes,
} from '../../document/layout/index.js';
import { MAX_LANES } from '../../template/email/blocks/columns.js';
import {
  ALIGNS,
  COLOR_TOKENS,
  DOCUMENT_CONTENT_WIDTH,
  HUES,
  LAYOUT_NODES,
  PARAGRAPH_SIZES,
  SECTION_BACKGROUNDS,
  SECTION_WIDTHS,
  snapWidth,
  SPACES,
  TEXT_ALIGN_NODES,
  TEXT_ALIGNS,
  VALIGNS,
  widthFromPixels,
  type ColorToken,
} from '../../template/layout/index.js';

type EngineState = Editor['state'];
type EngineNode = EngineState['doc'];
type EngineTransaction = EngineState['tr'];

/** What a host decides about the layout its editor offers. */
export interface BlockLayoutOptions {
  /** Block types and the layout keys each takes, beside `LAYOUT_NODES` or in place of its entry, such as a product block's. */
  types?: Readonly<Record<string, readonly string[]>>;
  /** Refuse what an email cannot draw: a `full` width, justified text and a `full` section. */
  email?: boolean;
}

/** The block types whose own node spec declares their layout attributes, so they are declared nowhere else. */
const OWN_LAYOUT_NODES: ReadonlySet<string> = new Set(['columns', 'section', 'button']);

/** The narrowest a table column may be, as a share of the table. */
const COLUMN_WIDTH_MIN = 0.05;
/** The step a column width is rounded to when read from pixels. */
const COLUMN_WIDTH_STEPS = 20;
/** The heaviest one lane weighs against its siblings: a twelve-column grid. */
const LANE_WEIGHT_MAX = 12;

const layoutKey = new PluginKey('blockLayout');

/** An attribute read and written through `layout-html.ts`; `textAlign` alone carries onto a split-off block. */
function layoutAttribute(key: keyof LayoutAttributes, legacyPixelBase?: number) {
  return {
    default: null,
    keepOnSplit: key === 'textAlign',
    parseHTML: (element: HTMLElement) => layoutFromElement(element, legacyPixelBase)[key] ?? null,
    renderHTML: (attrs: Record<string, unknown>) => layoutDataAttributes({ [key]: attrs[key] ?? undefined }),
  };
}

function columnWidthsOf(value: unknown): number[] | null {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every((width) => typeof width === 'number' && width >= COLUMN_WIDTH_MIN && width <= 1)
    ? (value as number[])
    : null;
}

const columnWidthsAttribute = {
  default: null,
  keepOnSplit: false,
  parseHTML: (element: HTMLElement) =>
    columnWidthsOf((element.getAttribute('data-column-widths') ?? '').split(',').filter(Boolean).map(Number)),
  renderHTML: (attrs: Record<string, unknown>) => {
    const widths = columnWidthsOf(attrs.columnWidths);
    return widths === null ? {} : { 'data-column-widths': widths.join(',') };
  },
};

/** A CSS colour value as a hue's token, where it is a named colour equal to a hue's name. */
function hueOfCss(value: string): ColorToken | null {
  const name = value.trim().toLowerCase();
  return (HUES as readonly string[]).includes(name) ? (name as ColorToken) : null;
}

/**
 * A colour mark: `<span data-color>` or `<span data-bg>` holding a token. A pasted inline colour becomes one only
 * where it is a hue's name; a hex, an `rgb()` or another name is dropped.
 */
function paintMark(name: 'textColor' | 'textBackground'): Mark {
  const property = name === 'textColor' ? 'color' : 'background';
  const data = name === 'textColor' ? 'data-color' : 'data-bg';
  const styles = name === 'textColor' ? ['color'] : ['background-color', 'background'];
  return Mark.create({
    name,
    addAttributes: () => ({
      token: {
        default: null,
        parseHTML: (element: HTMLElement) => colorTokenFromElement(element, property),
        renderHTML: (attrs: Record<string, unknown>) =>
          typeof attrs.token === 'string' ? { [data]: attrs.token } : {},
      },
    }),
    parseHTML: () => [
      {
        tag: `span[${data}]`,
        getAttrs: (element: HTMLElement) => colorTokenFromElement(element, property) !== null && null,
      },
      ...styles.map((style) => ({
        style,
        getAttrs: (value: string) => {
          const token = hueOfCss(value);
          return token === null ? false : { token };
        },
      })),
    ],
    renderHTML: ({ HTMLAttributes }) => ['span', HTMLAttributes, 0],
  });
}

/** A share of the table read from pixels: within a twentieth and the whole, to the nearest twentieth. */
function columnShare(fraction: number): number {
  return Math.min(1, Math.max(COLUMN_WIDTH_MIN, Math.round(fraction * COLUMN_WIDTH_STEPS) / COLUMN_WIDTH_STEPS));
}

/** A table's column widths read from its first row's pixel `colwidth`s, or null where a cell has none. */
function sharesOfPixels(widths: readonly unknown[]): number[] | null {
  if (widths.length === 0 || !widths.every((width) => typeof width === 'number' && width > 0)) return null;
  const sum = (widths as number[]).reduce((total, width) => total + width, 0);
  return (widths as number[]).map((width) => columnShare(width / sum));
}

/** The pixel widths a cell's `colwidth` holds, one per column it spans. */
function cellPixels(colwidth: unknown, colspan: unknown): unknown[] {
  const span = typeof colspan === 'number' && colspan > 1 ? colspan : 1;
  return Array.isArray(colwidth) && colwidth.length === span ? colwidth : [null];
}

/** `doc` with an image's pixel width read as a fraction and a table's pixel column widths as shares. */
function withoutPixels(node: NodeJSON): NodeJSON {
  const content = node.content?.map(withoutPixels);
  let attrs = node.attrs;
  if (node.type === 'image' && typeof attrs?.width === 'number' && attrs.width > 1) {
    attrs = { ...attrs, width: widthFromPixels(attrs.width, DOCUMENT_CONTENT_WIDTH) };
  }
  if (node.type === 'table' && content !== undefined) {
    const firstRow = content[0]?.content ?? [];
    const shares = sharesOfPixels(firstRow.flatMap((cell) => cellPixels(cell.attrs?.colwidth, cell.attrs?.colspan)));
    if (shares !== null && attrs?.columnWidths == null) attrs = { ...attrs, columnWidths: shares };
    const cleared = content.map((row) => ({
      ...row,
      content: row.content?.map((cell) =>
        cell.attrs?.colwidth == null ? cell : { ...cell, attrs: { ...cell.attrs, colwidth: null } },
      ),
    }));
    return { ...node, ...(attrs === undefined ? {} : { attrs }), content: cleared };
  }
  return { ...node, ...(attrs === undefined ? {} : { attrs }), ...(content === undefined ? {} : { content }) };
}

/** A document about to open with its pixel widths read as fractions, without a transaction: the opening is no edit. */
function openingContent(content: unknown): unknown {
  if (typeof content !== 'object' || content === null || Array.isArray(content)) return content;
  return withoutPixels(content as NodeJSON);
}

/** The steps that read a loaded document's pixel widths as fractions, or null when it holds none. */
function pixelFixes(state: EngineState): EngineTransaction | null {
  const tr = state.tr;
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && typeof node.attrs.width === 'number' && node.attrs.width > 1) {
      tr.setNodeAttribute(pos, 'width', widthFromPixels(node.attrs.width, DOCUMENT_CONTENT_WIDTH));
    }
    if (node.type.name !== 'table' || !('columnWidths' in node.attrs)) return true;
    const pixels: unknown[] = [];
    node.firstChild?.forEach((cell) => pixels.push(...cellPixels(cell.attrs.colwidth, cell.attrs.colspan)));
    const shares = sharesOfPixels(pixels);
    if (shares !== null && node.attrs.columnWidths == null) tr.setNodeAttribute(pos, 'columnWidths', shares);
    node.descendants((cell, offset) => {
      if (cell.attrs.colwidth != null) tr.setNodeAttribute(pos + 1 + offset, 'colwidth', null);
      return cell.type.name === 'tableRow';
    });
    return false;
  });
  return tr.docChanged ? tr : null;
}

interface Block {
  readonly node: EngineNode;
  readonly pos: number;
}

/** The node at `pos`, or the selected node, or the innermost block around the selection, that `accepts` takes. */
function blockAt(
  state: EngineState,
  pos: number | undefined,
  accepts: (node: EngineNode) => boolean,
): Block | undefined {
  if (pos !== undefined) {
    const node = state.doc.nodeAt(pos);
    return node !== null && accepts(node) ? { node, pos } : undefined;
  }
  const picked = (state.selection as { node?: EngineNode }).node;
  if (picked && accepts(picked)) return { node: picked, pos: state.selection.from };
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (accepts(node)) return { node, pos: $from.before(depth) };
  }
  return undefined;
}

/** The text blocks of `types` the selection touches, its caret's own included. */
function textblocksIn(state: EngineState, types: readonly string[]): Block[] {
  const found: Block[] = [];
  const { from, to } = state.selection;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (types.includes(node.type.name)) found.push({ node, pos });
    return true;
  });
  return found;
}

/** How many columns a table's first row spans. */
function columnCount(table: EngineNode): number {
  let count = 0;
  table.firstChild?.forEach((cell) => {
    count += typeof cell.attrs.colspan === 'number' && cell.attrs.colspan > 1 ? cell.attrs.colspan : 1;
  });
  return count;
}

const nullable = <T extends z.ZodType>(schema: T) => schema.nullable().optional();

const layoutPatch = z.strictObject({
  align: nullable(z.enum(ALIGNS)),
  width: nullable(z.union([z.number().positive(), z.literal('full')])),
  spaceBefore: nullable(z.enum(SPACES)),
  spaceAfter: nullable(z.enum(SPACES)),
});
type LayoutPatch = z.infer<typeof layoutPatch>;

const sectionPatch = z.strictObject({
  background: nullable(z.enum(SECTION_BACKGROUNDS)),
  padding: nullable(z.enum(SPACES)),
  width: nullable(z.enum(SECTION_WIDTHS)),
});
type SectionPatch = z.infer<typeof sectionPatch>;

const position = z.number().int().nonnegative().optional();

const blockLayoutArgs = z.object({ pos: position, layout: layoutPatch });
const textAlignArgs = z.object({ align: z.enum(TEXT_ALIGNS).nullable() });
const paragraphSizeArgs = z.object({ size: z.enum(PARAGRAPH_SIZES).nullable() });
const paintArgs = z.object({ token: z.enum(COLOR_TOKENS).nullable() });
const columnsArgs = z.object({
  pos: position,
  ratio: z.array(z.number().int().min(1).max(LANE_WEIGHT_MAX)).optional(),
  valign: nullable(z.enum(VALIGNS)),
  lanes: z.number().int().optional(),
});
const tableArgs = z.object({ pos: position, columnWidths: z.array(z.number()).nullable().optional() });
const sectionArgs = z.object({ pos: position, layout: sectionPatch });

/**
 * The layout model on the document's nodes. Every block type of `LAYOUT_NODES` (and `options.types`) takes its
 * layout keys as global attributes, written to HTML as `data-*` attributes; a paragraph and a heading take
 * `textAlign`, a paragraph `size`, a table `columnWidths`; the columns, section and button nodes declare theirs in
 * their own specs. Adds the marks `textColor` and `textBackground` (attribute `token`, `<span data-color>` and
 * `<span data-bg>`), and the commands below, each one undo step, refused (`can` false) where the block does not take
 * the value or, with `email`, where the email cannot draw it. A document opened or loaded with an image's pixel
 * width, or a table's pixel `colwidth`s, holds fractions instead, with no undo step; a paste or a drop holding them
 * holds fractions too, in the paste's own undo step.
 */
export function blockLayout(options: BlockLayoutOptions = {}): EditorFeature {
  const layoutTypes: Readonly<Record<string, readonly string[]>> = { ...LAYOUT_NODES, ...options.types };
  const email = options.email === true;
  // Feature commands receive the facade; this is how they find the engine behind it.
  const engines = new Set<Editor>();
  const engineOf = (facade: IEditor) =>
    [...engines].find((engine) => facadeFor(engine as unknown as EngineHandle) === facade);

  const keysOf = (node: EngineNode): readonly string[] => layoutTypes[node.type.name] ?? [];

  const globalAttributes = () => [
    ...Object.entries(layoutTypes)
      .filter(([type]) => !OWN_LAYOUT_NODES.has(type))
      .map(([type, keys]) => ({
        types: [type],
        attributes: Object.fromEntries(
          [...keys, 'responsive'].map((key) => [
            key,
            layoutAttribute(key as keyof LayoutAttributes, type === 'image' ? DOCUMENT_CONTENT_WIDTH : undefined),
          ]),
        ),
      })),
    { types: [...TEXT_ALIGN_NODES], attributes: { textAlign: layoutAttribute('textAlign') } },
    { types: ['paragraph'], attributes: { size: layoutAttribute('size') } },
    { types: ['table'], attributes: { columnWidths: columnWidthsAttribute } },
  ];

  const plugin = new Plugin({
    key: layoutKey,
    // ProseMirror builds a loaded document without checking it against the schema, so a section in a section or in
    // a lane would open; a load that does not fit is refused and the document stays as it was.
    filterTransaction(tr) {
      if (!tr.docChanged || !tr.getMeta(CONTENT_LOAD_META)) return true;
      try {
        tr.doc.check();
        return true;
      } catch {
        return false;
      }
    },
    appendTransaction(trs, _oldState, newState) {
      const fresh = trs.filter((tr) => tr.docChanged && !tr.getMeta(layoutKey));
      const loaded = fresh.some((tr) => tr.getMeta(CONTENT_LOAD_META));
      // A paste or a drop brings in what another editor or page wrote, pixel widths among it; the fix joins its
      // undo step.
      const brought = fresh.some((tr) => ['paste', 'drop'].includes(tr.getMeta('uiEvent') as string));
      if (!loaded && !brought) return null;
      const tr = pixelFixes(newState);
      if (!tr || !loaded) return tr && tr.setMeta(layoutKey, true);
      return tr.setMeta(layoutKey, true).setMeta(CONTENT_LOAD_META, true).setMeta('addToHistory', false);
    },
  });

  const engineExtension = Extension.create({
    name: 'blockLayout',
    onBeforeCreate() {
      engines.add(this.editor);
      this.editor.options.content = openingContent(this.editor.options.content) as never;
    },
    onDestroy() {
      engines.delete(this.editor);
    },
    addGlobalAttributes: globalAttributes,
    addProseMirrorPlugins: () => [plugin],
  });

  /** The steps a layout patch takes on `block`, or null where the block does not take it. */
  const layoutSteps = (block: Block, layout: LayoutPatch): [string, unknown][] | null => {
    const keys = keysOf(block.node);
    const steps: [string, unknown][] = [];
    for (const [key, value] of Object.entries(layout)) {
      if (value === undefined) continue;
      if (!keys.includes(key)) return null;
      if (key === 'width' && value !== null) {
        if (value === 'full' ? email : block.node.type.name === 'table') return null;
        steps.push([key, value === 'full' ? 'full' : snapWidth(value as number)]);
      } else {
        steps.push([key, value]);
      }
    }
    return steps.length === 0 ? null : steps;
  };

  /** Runs `change` on a transaction of `facade`'s engine and dispatches it when `dispatch`; whether it applies. */
  const apply = (
    facade: IEditor,
    dispatch: boolean,
    change: (state: EngineState, tr: EngineTransaction) => boolean,
  ): boolean => {
    const engine = engineOf(facade);
    if (!engine) return false;
    const tr = engine.state.tr;
    if (!change(engine.state, tr)) return false;
    if (dispatch) engine.view.dispatch(tr);
    return true;
  };

  const setBlockLayout = (dispatch: boolean) => (facade: IEditor, args: z.infer<typeof blockLayoutArgs>) =>
    apply(facade, dispatch, (state, tr) => {
      const block = blockAt(state, args.pos, (node) => layoutSteps({ node, pos: 0 }, args.layout) !== null);
      const steps = block && layoutSteps(block, args.layout);
      if (!block || !steps) return false;
      for (const [key, value] of steps) tr.setNodeAttribute(block.pos, key, value);
      return true;
    });

  const setTextAlign =
    (dispatch: boolean) =>
    (facade: IEditor, { align }: z.infer<typeof textAlignArgs>) =>
      apply(facade, dispatch, (state, tr) => {
        if (email && align === 'justify') return false;
        const blocks = textblocksIn(state, TEXT_ALIGN_NODES);
        for (const { pos } of blocks) tr.setNodeAttribute(pos, 'textAlign', align);
        return blocks.length > 0;
      });

  const setParagraphSize =
    (dispatch: boolean) =>
    (facade: IEditor, { size }: z.infer<typeof paragraphSizeArgs>) =>
      apply(facade, dispatch, (state, tr) => {
        const blocks = textblocksIn(state, ['paragraph']);
        for (const { pos } of blocks) tr.setNodeAttribute(pos, 'size', size);
        return blocks.length > 0;
      });

  const setPaint =
    (name: 'textColor' | 'textBackground', dispatch: boolean) =>
    (facade: IEditor, { token }: z.infer<typeof paintArgs>) =>
      apply(facade, dispatch, (state, tr) => {
        const type = state.schema.marks[name];
        if (!type) return false;
        const { from, to, empty } = state.selection;
        const clear = token === null || token === 'default';
        if (empty) {
          if (clear) tr.removeStoredMark(type);
          else tr.addStoredMark(type.create({ token }));
        } else if (clear) {
          tr.removeMark(from, to, type);
        } else {
          tr.addMark(from, to, type.create({ token }));
        }
        return true;
      });

  const setColumnsLayout = (dispatch: boolean) => (facade: IEditor, args: z.infer<typeof columnsArgs>) =>
    apply(facade, dispatch, (state, tr) => {
      const block = blockAt(state, args.pos, (node) => node.type.name === 'columns');
      if (!block) return false;
      const lanes = args.lanes ?? block.node.childCount;
      if (lanes < 2 || lanes > MAX_LANES) return false;
      if (args.ratio !== undefined && args.ratio.length !== lanes) return false;
      if (args.lanes === undefined && args.ratio === undefined && args.valign === undefined) return false;
      const column = state.schema.nodes.column;
      for (let count = block.node.childCount; count < lanes; count += 1) {
        const lane = column?.createAndFill();
        if (!lane) return false;
        const columns = tr.doc.nodeAt(block.pos) as EngineNode;
        tr.insert(block.pos + columns.nodeSize - 1, lane);
      }
      for (let count = block.node.childCount; count > lanes; count -= 1) {
        // The last lane goes; whatever it holds but an empty line moves to the end of the lane before it.
        const columns = tr.doc.nodeAt(block.pos) as EngineNode;
        const last = columns.child(count - 1);
        const lastPos = block.pos + columns.nodeSize - 1 - last.nodeSize;
        const empty =
          last.childCount === 1 && last.firstChild?.isTextblock === true && last.firstChild.content.size === 0;
        tr.delete(lastPos, lastPos + last.nodeSize);
        if (!empty) tr.insert(lastPos - 1, last.content);
      }
      if (args.lanes !== undefined && args.lanes !== block.node.childCount && args.ratio === undefined) {
        tr.setNodeAttribute(block.pos, 'ratio', null);
      }
      if (args.ratio !== undefined) tr.setNodeAttribute(block.pos, 'ratio', args.ratio);
      if (args.valign !== undefined) tr.setNodeAttribute(block.pos, 'valign', args.valign);
      return true;
    });

  const setTableLayout = (dispatch: boolean) => (facade: IEditor, args: z.infer<typeof tableArgs>) =>
    apply(facade, dispatch, (state, tr) => {
      const block = blockAt(state, args.pos, (node) => node.type.name === 'table');
      if (!block || args.columnWidths === undefined || !('columnWidths' in block.node.attrs)) return false;
      if (args.columnWidths !== null) {
        const widths = columnWidthsOf(args.columnWidths);
        if (widths === null || widths.length !== columnCount(block.node)) return false;
      }
      tr.setNodeAttribute(block.pos, 'columnWidths', args.columnWidths);
      return true;
    });

  const setSectionLayout = (dispatch: boolean) => (facade: IEditor, args: z.infer<typeof sectionArgs>) =>
    apply(facade, dispatch, (state, tr) => {
      const block = blockAt(state, args.pos, (node) => node.type.name === 'section');
      const entries = Object.entries(args.layout as SectionPatch).filter(([, value]) => value !== undefined);
      if (!block || entries.length === 0 || (email && args.layout.width === 'full')) return false;
      for (const [key, value] of entries) tr.setNodeAttribute(block.pos, key, value);
      return true;
    });

  // A section sits only at the top of the document: the caret's line, or the picked block, is one of its children.
  const insertSection = (dispatch: boolean) => (facade: IEditor) =>
    apply(facade, dispatch, (state, tr) => {
      const { section: sectionType, paragraph } = state.schema.nodes;
      const { selection } = state;
      const picked = 'node' in selection;
      const atTop = [selection.$from, selection.$to].every(($pos) => $pos.depth === (picked ? 0 : 1));
      if (!sectionType || !paragraph || !atTop) return false;
      const start = picked ? selection.from : selection.$from.before(1);
      const block = state.doc.nodeAt(start);
      if (!block) return false;
      const section = sectionType.create(null, paragraph.create());
      // An empty line becomes the section; any other block keeps its place, the section following it.
      const at = block.isTextblock && block.content.size === 0 ? start : start + block.nodeSize;
      tr.replaceWith(at, at === start ? start + block.nodeSize : at, section);
      tr.setSelection(Selection.near(tr.doc.resolve(at + 2)));
      return true;
    });

  return {
    id: 'blockLayout',
    advanced: { engineExtensions: [engineExtension, paintMark('textColor'), paintMark('textBackground')] },
    commands: {
      /** Sets the layout keys given on the block at `pos`, or the selected one; null clears a key. */
      setBlockLayout: { args: blockLayoutArgs, run: setBlockLayout(true), can: setBlockLayout(false) },
      /** Aligns every paragraph and heading the selection touches; null clears it. */
      setTextAlign: { args: textAlignArgs, run: setTextAlign(true), can: setTextAlign(false) },
      /** Makes every paragraph the selection touches a lead or a small one; null makes it a plain one. */
      setParagraphSize: { args: paragraphSizeArgs, run: setParagraphSize(true), can: setParagraphSize(false) },
      /** Colours the selection's text; null or `default` takes the colour away. */
      setTextColor: { args: paintArgs, run: setPaint('textColor', true), can: setPaint('textColor', false) },
      /** Colours behind the selection's text; null or `default` takes it away. */
      setTextBackground: {
        args: paintArgs,
        run: setPaint('textBackground', true),
        can: setPaint('textBackground', false),
      },
      /**
       * Weighs a columns block's lanes (`ratio`, one whole weight of 1 to 12 per lane), aligns them (`valign`) or
       * changes how many it has (`lanes`, 2 to 4): a new lane opens empty at the end, and the last lane's blocks move
       * into the lane before it as it goes. A lane count changed without a ratio draws the lanes equal.
       */
      setColumnsLayout: { args: columnsArgs, run: setColumnsLayout(true), can: setColumnsLayout(false) },
      /** Sets a table's column widths, one share per column of at least a twentieth; null draws them equal. */
      setTableLayout: { args: tableArgs, run: setTableLayout(true), can: setTableLayout(false) },
      /**
       * Inserts a section holding an empty line after the block holding the caret, in place of an empty line, with the
       * caret in it. Refused below the top of the document: in a lane, a section, a callout, a quote, a list or a table.
       */
      insertSection: { run: insertSection(true), can: insertSection(false) },
      /** Sets a section's background, padding and width; null clears a key. */
      setSectionLayout: { args: sectionArgs, run: setSectionLayout(true), can: setSectionLayout(false) },
    },
  };
}
