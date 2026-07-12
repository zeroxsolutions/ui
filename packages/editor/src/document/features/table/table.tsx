import { TableKit } from '@tiptap/extension-table';
import { Table as TableIcon } from 'lucide-react';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeJSON,
} from '../../core/index.js';

/**
 * Tables. The engine schema (table / row / header / cell, column resizing) comes
 * from Tiptap's MIT `TableKit` (used **internally** — the feature exposes only an
 * engine-free `EditorFeature`). This file adds the GFM-table Markdown codec, the
 * HTML/React codecs, and the insert command + slash item. Import this feature
 * lazily (`await import('@zeroxsolutions/editor/document/features/table/index.js')`)
 * to keep it out of the core bundle.
 */
const cellText = (cell: NodeJSON, serialize: (n: NodeJSON) => string): string =>
  (cell.content ?? [])
    .map(serialize)
    .join(' ')
    .replace(/\n+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();

const tableCodec: NodeCodec = {
  node: 'table',
  toMarkdown: (node, ctx) => {
    const rows = node.content ?? [];
    if (rows.length === 0) return '';
    const toCells = (row: NodeJSON): string[] =>
      (row.content ?? []).map((cell) => cellText(cell, ctx.serializeNode));
    const header = toCells(rows[0]);
    const separator = header.map(() => '---');
    const body = rows.slice(1).map(toCells);
    const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
    return [line(header), line(separator), ...body.map(line)].join('\n');
  },
  toHTML: (node, ctx) => `<table><tbody>${ctx.serializeChildren(node)}</tbody></table>`,
  toReact: (node, ctx) => (
    <table>
      <tbody>{ctx.renderChildren(node)}</tbody>
    </table>
  ),
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
          content: [...element.querySelectorAll('tr')].map((tr) => ({
            type: 'tableRow',
            content: [...tr.children].map((cell) => ({
              type: cell.tagName === 'TH' ? 'tableHeader' : 'tableCell',
              content: [
                { type: 'paragraph', content: ctx.fromHTMLChildren(cell as HTMLElement) },
              ],
            })),
          })),
        }
      : null,
};

const tableRow: NodeCodec = {
  node: 'tableRow',
  toHTML: (node, ctx) => `<tr>${ctx.serializeChildren(node)}</tr>`,
  toReact: (node, ctx) => <tr>{ctx.renderChildren(node)}</tr>,
};

const tableCell: NodeCodec = {
  node: 'tableCell',
  toHTML: (node, ctx) => `<td>${ctx.serializeChildren(node)}</td>`,
  toReact: (node, ctx) => <td>{ctx.renderChildren(node)}</td>,
};

const tableHeader: NodeCodec = {
  node: 'tableHeader',
  toHTML: (node, ctx) => `<th>${ctx.serializeChildren(node)}</th>`,
  toReact: (node, ctx) => <th>{ctx.renderChildren(node)}</th>,
};

export function table(): EditorFeature {
  return defineFeature({
    id: 'table',
    codecs: [tableCodec, tableRow, tableCell, tableHeader],
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
        icon: <TableIcon className="size-4" />,
        title: 'Table',
        description: 'Insert a 2×2 table',
        group: 'Blocks',
        keywords: ['table', 'grid', 'rows', 'columns'],
        command: 'insertTable',
      },
    ],
    advanced: {
      engineExtensions: [TableKit.configure({ table: { resizable: true } })],
    },
  });
}
