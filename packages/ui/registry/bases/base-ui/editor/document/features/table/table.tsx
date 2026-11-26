import { Table, TableKit } from '@tiptap/extension-table';
import { ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
import { TableIcon } from '@/registry/bases/base-ui/icons/lucide/table-icon';
import {
  defineFeature,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeJSON,
} from '@zeroxsolutions/editor-core/document/core/index';
import { layoutDataAttributes } from '@zeroxsolutions/editor-core/document/layout/index';
import { SPACES, type Layout } from '@zeroxsolutions/editor-core/template/layout/index';
import type { ReactNodeCodec } from '../../../react-types';
import { layoutProps } from '../../layout/layout-props';
import { layoutWordsOf, type LayoutWords } from '../../layout/layout-words';
import { TableView } from './table-view';
import { columnWidthsOf, sharesOfPixels, storedShares } from './table-widths';

export interface TableOptions {
  /** The words of the toolbar and the border handles over the English, or a getter read on each draw. */
  messages?: Partial<LayoutWords> | (() => LayoutWords);
  /**
   * Whether the author may size the columns of, or bleed, the table at `pos`; always when absent. The email editor
   * refuses in locked structure and on a block the host requires, and draws no border and no toolbar there.
   */
  changeable?(editor: IEditor, pos: number): boolean;
}

/**
 * Tables. The engine schema (table / row / header / cell) comes from Tiptap's MIT
 * `TableKit` (used **internally**: the feature exposes only an engine-free
 * `EditorFeature`), its pixel column resizing off: column widths are shares of the
 * table, set by dragging a border in `TableView`. This file adds the GFM-table
 * Markdown codec, the HTML/React codecs, and the insert command + slash item. Import this feature
 * lazily (`await import('@/registry/bases/base-ui/editor/document/features/table/index')`)
 * to keep it out of the core bundle.
 *
 * The node codecs author against the chrome `ReactNodeCodec` (so `toReact` can
 * call `ctx.renderChildren`) and are cast to the core `NodeCodec` at the
 * registration boundary.
 */
/**
 * The layout a table takes: `full`, the only width it has besides its container's, and the space before and after
 * it; every other value is left out.
 */
function layoutOf(attrs: Record<string, unknown> | undefined): Layout {
  const spaceBefore = SPACES.find((space) => space === attrs?.spaceBefore);
  const spaceAfter = SPACES.find((space) => space === attrs?.spaceAfter);
  return {
    ...(attrs?.width === 'full' ? { width: 'full' as const } : {}),
    ...(spaceBefore ? { spaceBefore } : {}),
    ...(spaceAfter ? { spaceAfter } : {}),
  };
}

/** How many columns a stored table's first row spans. */
function columnCount(node: NodeJSON): number {
  return (node.content?.[0]?.content ?? []).reduce((count, cell) => {
    const span = cell.attrs?.colspan;
    return count + (typeof span === 'number' && span > 1 ? span : 1);
  }, 0);
}

/**
 * The attributes a `<table>` carries: its `data-column-widths`, or else the pixel `colwidth`s of its first row read
 * as shares, its full width and the space around it.
 */
function attrsOfElement(element: HTMLElement): { attrs?: Record<string, unknown> } {
  const stored = columnWidthsOf(
    (element.getAttribute('data-column-widths') ?? '').split(',').filter(Boolean).map(Number),
  );
  const firstRow = element.querySelector('tr');
  const pixels = [...(firstRow?.children ?? [])].flatMap((cell) => {
    const span = Math.max(1, Number(cell.getAttribute('colspan') ?? 1));
    const widths = (cell.getAttribute('colwidth') ?? '').split(',').filter(Boolean).map(Number);
    return widths.length === span ? widths : [null];
  });
  const columnWidths = stored ?? sharesOfPixels(pixels);
  const attrs = {
    ...(columnWidths ? { columnWidths } : {}),
    ...(element.getAttribute('data-width') === 'full' ? { width: 'full' } : {}),
    ...(SPACES.find((space) => space === element.getAttribute('data-space-before'))
      ? { spaceBefore: element.getAttribute('data-space-before') }
      : {}),
    ...(SPACES.find((space) => space === element.getAttribute('data-space-after'))
      ? { spaceAfter: element.getAttribute('data-space-after') }
      : {}),
  };
  return Object.keys(attrs).length > 0 ? { attrs } : {};
}

/** A cell's Markdown on one line, every `|` that would end the cell escaped; the serializer escaped its text's own. */
const cellText = (cell: NodeJSON, serialize: (n: NodeJSON) => string): string =>
  (cell.content ?? [])
    .map(serialize)
    .join(' ')
    .replace(/\n+/g, ' ')
    .replace(/(\\*)\|/g, (pipe, slashes: string) => (slashes.length % 2 === 0 ? `${slashes}\\|` : pipe))
    .trim();

const tableCodec: ReactNodeCodec = {
  node: 'table',
  toMarkdown: (node, ctx) => {
    const rows = node.content ?? [];
    if (rows.length === 0) return '';
    const toCells = (row: NodeJSON): string[] => (row.content ?? []).map((cell) => cellText(cell, ctx.serializeNode));
    const header = toCells(rows[0]);
    const separator = header.map(() => '---');
    const body = rows.slice(1).map(toCells);
    const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
    return [line(header), line(separator), ...body.map(line)].join('\n');
  },
  toHTML: (node, ctx) => {
    const widths = columnWidthsOf(node.attrs?.columnWidths);
    const written = {
      ...(widths ? { 'data-column-widths': widths.join(',') } : {}),
      ...layoutDataAttributes(layoutOf(node.attrs)),
    };
    const attributes = Object.entries(written).map(([name, value]) => ` ${name}="${value}"`);
    return `<table${attributes.join('')}><tbody>${ctx.serializeChildren(node)}</tbody></table>`;
  },
  toReact: (node, ctx) => {
    const shares = storedShares(node.attrs?.columnWidths, columnCount(node));
    return (
      <div data-slot="table" {...layoutProps({ ...layoutOf(node.attrs) })} data-sized={shares ? true : undefined}>
        <table>
          {shares && (
            <colgroup>
              {shares.map((share, index) => (
                <col key={index} style={{ width: `${share * 100}%` }} />
              ))}
            </colgroup>
          )}
          <tbody>{ctx.renderChildren(node)}</tbody>
        </table>
      </div>
    );
  },
  fromMarkdown: (token, ctx) => {
    if (token.type !== 'table') return null;
    const rows = (token.children ?? []).map((row, rowIndex) => ({
      type: 'tableRow',
      content: (row.children ?? []).map((cell) => ({
        type: rowIndex === 0 ? 'tableHeader' : 'tableCell',
        content: [{ type: 'paragraph', content: ctx.fromMarkdownChildren(cell) }],
      })),
    }));
    return { type: 'table', content: rows };
  },
  fromHTML: (element, ctx) =>
    element.tagName === 'TABLE'
      ? {
          type: 'table',
          ...attrsOfElement(element),
          content: [...element.querySelectorAll('tr')].map((tr) => ({
            type: 'tableRow',
            content: [...tr.children].map((cell) => ({
              type: cell.tagName === 'TH' ? 'tableHeader' : 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: ctx.fromHTMLChildren(cell as HTMLElement),
                },
              ],
            })),
          })),
        }
      : null,
};

const tableRow: ReactNodeCodec = {
  node: 'tableRow',
  toHTML: (node, ctx) => `<tr>${ctx.serializeChildren(node)}</tr>`,
  toReact: (node, ctx) => <tr>{ctx.renderChildren(node)}</tr>,
};

const tableCell: ReactNodeCodec = {
  node: 'tableCell',
  toHTML: (node, ctx) => `<td>${ctx.serializeChildren(node)}</td>`,
  toReact: (node, ctx) => <td>{ctx.renderChildren(node)}</td>,
};

const tableHeader: ReactNodeCodec = {
  node: 'tableHeader',
  toHTML: (node, ctx) => `<th>${ctx.serializeChildren(node)}</th>`,
  toReact: (node, ctx) => <th>{ctx.renderChildren(node)}</th>,
};

/**
 * Tiptap's table node drawn by `TableView`, whose `<table>` holds the rows' `<tbody>`, with the engine's pixel
 * column resizing off.
 */
function tableNode(words: () => LayoutWords, changeable: TableOptions['changeable']) {
  const View = (props: ReactNodeViewProps) => <TableView {...props} words={words} changeable={changeable} />;
  return Table.extend({
    addNodeView: () => ReactNodeViewRenderer(View, { contentDOMElementTag: 'tbody' }),
  }).configure({ resizable: false });
}

export function table(options: TableOptions = {}): EditorFeature {
  const words = () => layoutWordsOf(options.messages);
  return defineFeature({
    id: 'table',
    codecs: [tableCodec, tableRow, tableCell, tableHeader] as NodeCodec[],
    commands: {
      insertTable: {
        run: (editor) =>
          editor.run('insertContent', {
            content: {
              type: 'table',
              content: [
                {
                  type: 'tableRow',
                  content: [
                    { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                    { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                  ],
                },
                {
                  type: 'tableRow',
                  content: [
                    { type: 'tableCell', content: [{ type: 'paragraph' }] },
                    { type: 'tableCell', content: [{ type: 'paragraph' }] },
                  ],
                },
              ],
            },
          }),
      },
    },
    slash: [
      {
        id: 'table',
        icon: TableIcon,
        title: 'Table',
        description: 'Insert a 2×2 table',
        group: 'Blocks',
        keywords: ['table', 'grid', 'rows', 'columns'],
        command: 'insertTable',
      },
    ],
    advanced: {
      engineExtensions: [TableKit.configure({ table: false }), tableNode(words, options.changeable)],
    },
  });
}
