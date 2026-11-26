import { z } from 'zod';
import { parseInlineMarkup } from '../../markup/inline-markup.js';
import { defineBlockType } from '../block.js';
import { BLOCK_TEXT_MAX_LENGTH, readOr, spaceAfter, spaceBefore } from './shared.js';

/** The most rows and columns a table holds: a timetable or a price list, never a spreadsheet. */
export const TABLE_MAX_ROWS = 20;
export const TABLE_MAX_COLUMNS = 6;

/** One cell's text: inline markup, and empty where the cell is. */
const cell = z
  .string()
  .max(BLOCK_TEXT_MAX_LENGTH)
  .refine((text) => parseInlineMarkup(text).ok, { message: 'malformed inline markup' });

/** Each column's share of the table's width, the narrowest a twentieth; the drawn widths are read against their sum. */
const columnWidths = z.array(z.number().min(0.05).max(1)).min(1).max(TABLE_MAX_COLUMNS);

const attributes = z
  .object({ header: z.boolean().optional(), columnWidths: columnWidths.optional(), spaceBefore, spaceAfter })
  .strict();
const content = z
  .object({
    rows: z
      .array(z.array(cell).min(1).max(TABLE_MAX_COLUMNS))
      .min(1)
      .max(TABLE_MAX_ROWS)
      .refine((rows) => rows.every((row) => row.length === rows[0].length), { message: 'rows of one width' }),
  })
  .strict();
const lenientAttributes = z.object({
  header: z.boolean().optional().catch(undefined),
  columnWidths: columnWidths.optional().catch(undefined),
  spaceBefore: spaceBefore.catch(undefined),
  spaceAfter: spaceAfter.catch(undefined),
});
const lenientContent = z.object({
  rows: z
    .array(z.unknown())
    .catch([])
    .transform((rows) =>
      rows.map((row) => (Array.isArray(row) ? row.map((value) => (typeof value === 'string' ? value : '')) : [])),
    ),
});

/** The rows as drawn: within the bounds, each padded with empty cells to the widest. */
function drawnRows(rows: readonly (readonly string[])[]): string[][] {
  const kept = rows.slice(0, TABLE_MAX_ROWS).map((row) => row.slice(0, TABLE_MAX_COLUMNS));
  const widest = Math.max(0, ...kept.map((row) => row.length));
  return widest === 0 ? [] : kept.map((row) => [...row, ...Array<string>(widest - row.length).fill('')]);
}

/** Rows of cells, the first a header where `header` is set; bordered, and read by a screen reader as a table. */
export const table = defineBlockType({
  type: 'table',
  attributes,
  content,
  readAttributes: (raw) => readOr(lenientAttributes, raw, {}),
  readContent: (raw) => readOr(lenientContent, raw, { rows: [] }),
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    const rows: string[][] = [];
    // In order rather than at once: a provider limits translations per minute.
    for (const row of source.rows) {
      const cells: string[] = [];
      for (const text of row) cells.push(text === '' ? '' : await translateOne(text));
      rows.push(cells);
    }
    return { rows };
  },
  render({ attributes: a, content: c }, { h }) {
    const rows = drawnRows(c.rows);
    if (rows.length === 0) return [];
    const widths =
      a.columnWidths !== undefined && a.columnWidths.length === rows[0].length ? a.columnWidths : undefined;
    return h.table({ header: a.header ?? false, rows, ...(widths === undefined ? {} : { columnWidths: widths }) });
  },
  sample: {
    attributes: { header: true },
    content: {
      rows: [
        ['Day', 'Place'],
        ['1', '{{place}}'],
      ],
    },
    variableTypes: { place: 'string' },
  },
});
